from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from .models import Lead, Deal, Pipeline, DealStage, Activity
from apps.authentication.models import CompanyUser, User
from django.db.models import Sum, Count

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email']

class LeadSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    assigned_to = UserMiniSerializer(read_only=True)
    days_since_created = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            'id','company','created_by','assigned_to','first_name','last_name','email','phone','company_name','job_title',
            'lead_source','status','estimated_value','notes','created_at','updated_at','converted_to_deal','converted_at','is_active',
            'days_since_created','is_overdue'
        ]
        read_only_fields = ['company','created_by','converted_to_deal','converted_at','days_since_created','is_overdue']

    def get_days_since_created(self, obj):
        return (timezone.now() - obj.created_at).days if obj.created_at else 0

    def get_is_overdue(self, obj):
        last_activity = obj.activities.order_by('-created_at').first()
        if not last_activity:
            return (timezone.now() - obj.created_at).days >= 7
        return (timezone.now() - last_activity.created_at).days >= 7

class LeadListSerializer(serializers.ModelSerializer):
    assigned_to = UserMiniSerializer(read_only=True)

    class Meta:
        model = Lead
        fields = ['id','first_name','last_name','email','status','assigned_to','estimated_value','created_at','updated_at']
        read_only_fields = fields

class CreateLeadSerializer(serializers.ModelSerializer):
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Lead
        fields = [
            'first_name','last_name','email','phone','company_name','job_title','lead_source','estimated_value','notes','assigned_to_id'
        ]

    def validate(self, data):
        required = ['first_name','last_name','email','lead_source']
        missing = [f for f in required if not data.get(f)]
        if missing:
            raise serializers.ValidationError({"missing_fields": missing})
        return data

    def create(self, validated_data):
        request = self.context['request']
        user = request.user
        # Determine company - first active membership unless explicit company_id param
        company_id = request.data.get('company_id')
        if company_id:
            membership = CompanyUser.objects.filter(user=user, company_id=company_id, is_active=True).first()
        else:
            membership = CompanyUser.objects.filter(user=user, is_active=True).order_by('joined_at').first()
        if not membership:
            raise serializers.ValidationError('User must belong to a company to create leads.')
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        assigned_to = None
        if assigned_to_id:
            assigned_to = User.objects.filter(id=assigned_to_id).first()
            if not assigned_to:
                raise serializers.ValidationError({'assigned_to_id': 'User not found.'})
            # Ensure same company
            if not CompanyUser.objects.filter(user=assigned_to, company=membership.company, is_active=True).exists():
                raise serializers.ValidationError({'assigned_to_id': 'User not in your company.'})
        lead = Lead.objects.create(
            company=membership.company,
            created_by=user,
            assigned_to=assigned_to,
            **validated_data
        )
        return lead

class UpdateLeadSerializer(serializers.ModelSerializer):
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Lead
        fields = [
            'first_name','last_name','email','phone','company_name','job_title','lead_source','status','estimated_value','notes','assigned_to_id'
        ]
        extra_kwargs = {'status': {'required': False}}

    def update(self, instance, validated_data):
        old_status = instance.status
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        if assigned_to_id is not None:
            if assigned_to_id == '':
                instance.assigned_to = None
            else:
                user = User.objects.filter(id=assigned_to_id).first()
                if not user:
                    raise serializers.ValidationError({'assigned_to_id': 'User not found.'})
                if not CompanyUser.objects.filter(user=user, company=instance.company, is_active=True).exists():
                    raise serializers.ValidationError({'assigned_to_id': 'User not in company.'})
                instance.assigned_to = user
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if 'status' in validated_data and validated_data['status'] != old_status:
            Activity.objects.create(
                company=instance.company,
                user=self.context['request'].user,
                lead=instance,
                activity_type='note',
                subject='Status changed',
                description=f'Status changed from {old_status} to {validated_data["status"]}',
            )
        return instance

class ConvertLeadSerializer(serializers.Serializer):
    pipeline_id = serializers.IntegerField()
    stage_id = serializers.IntegerField()
    title = serializers.CharField(max_length=255)
    value = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(max_length=8, required=False, default='USD')
    contact_name = serializers.CharField(max_length=255)
    contact_email = serializers.EmailField()
    contact_phone = serializers.CharField(max_length=32, required=False, allow_null=True, allow_blank=True)
    company_name = serializers.CharField(max_length=255)
    expected_close_date = serializers.DateField(required=False, allow_null=True)
    priority = serializers.ChoiceField(choices=[('low','Low'),('medium','Medium'),('high','High')], default='medium')

    def validate(self, data):
        lead = self.context['lead']
        if lead.status == 'converted':
            raise serializers.ValidationError('Lead already converted.')
        pipeline = Pipeline.objects.filter(id=data['pipeline_id'], company=lead.company).first()
        if not pipeline:
            raise serializers.ValidationError({'pipeline_id':'Pipeline not found for company.'})
        stage = DealStage.objects.filter(id=data['stage_id'], pipeline=pipeline).first()
        if not stage:
            raise serializers.ValidationError({'stage_id':'Stage not found in pipeline.'})
        data['pipeline'] = pipeline
        data['stage'] = stage
        return data

    @transaction.atomic
    def create(self, validated_data):
        lead = self.context['lead']
        user = self.context['request'].user
        deal = Deal.objects.create(
            company=lead.company,
            pipeline=validated_data['pipeline'],
            stage=validated_data['stage'],
            created_by=user,
            assigned_to=lead.assigned_to,
            lead=lead,
            title=validated_data['title'],
            description=lead.notes or '',
            value=validated_data['value'],
            currency=validated_data.get('currency','USD'),
            expected_close_date=validated_data.get('expected_close_date'),
            contact_name=validated_data['contact_name'],
            contact_email=validated_data['contact_email'],
            contact_phone=validated_data.get('contact_phone'),
            company_name=validated_data['company_name'],
            status='open',
            priority=validated_data.get('priority','medium'),
        )
        lead.status = 'converted'
        lead.converted_to_deal = deal
        lead.converted_at = timezone.now()
        lead.save()
        return deal

class AssignLeadSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

    def validate(self, data):
        lead = self.context['lead']
        target = User.objects.filter(id=data['user_id']).first()
        if not target:
            raise serializers.ValidationError({'user_id':'User not found.'})
        if not CompanyUser.objects.filter(user=target, company=lead.company, is_active=True).exists():
            raise serializers.ValidationError({'user_id':'User not in company.'})
        data['target'] = target
        return data

    def save(self):
        lead = self.context['lead']
        target = self.validated_data['target']
        lead.assigned_to = target
        lead.save()
        return lead

# ---------------- Pipeline / Stage Serializers -----------------

class DealStageSerializer(serializers.ModelSerializer):
    deal_count = serializers.SerializerMethodField()

    class Meta:
        model = DealStage
        fields = ['id','pipeline','name','order','probability','is_active','created_at','deal_count']
        read_only_fields = ['id','pipeline','created_at','deal_count']

    def get_deal_count(self, obj):
        return obj.deals.count()

class PipelineSerializer(serializers.ModelSerializer):
    stages = serializers.SerializerMethodField()
    total_deals_count = serializers.SerializerMethodField()

    class Meta:
        model = Pipeline
        fields = ['id','company','name','description','is_default','created_by','created_at','is_active','stages','total_deals_count']
        read_only_fields = ['id','company','created_by','created_at','is_default','stages','total_deals_count']

    def get_stages(self, obj):
        qs = obj.stages.order_by('order')
        return DealStageSerializer(qs, many=True).data

    def get_total_deals_count(self, obj):
        return obj.deals.count()

class CreatePipelineStageInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    probability = serializers.IntegerField(min_value=0, max_value=100)
    order = serializers.IntegerField(min_value=1)

class CreatePipelineSerializer(serializers.ModelSerializer):
    stages = CreatePipelineStageInputSerializer(many=True, required=False)

    class Meta:
        model = Pipeline
        fields = ['name','description','is_default','stages']

    DEFAULT_STAGES = [
        ('Prospecting', 10),
        ('Qualification', 25),
        ('Proposal', 50),
        ('Negotiation', 75),
        ('Closed Won', 100),
        ('Closed Lost', 0),
    ]

    def validate_stages(self, value):
        if not value:
            return value
        orders = [s['order'] for s in value]
        if len(orders) != len(set(orders)):
            raise serializers.ValidationError('Stage order values must be unique.')
        if min(orders) != 1:
            raise serializers.ValidationError('Stage order must start at 1.')
        # Ensure contiguous sequence
        if sorted(orders) != list(range(1, len(orders)+1)):
            raise serializers.ValidationError('Stage orders must be contiguous starting at 1.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        request = self.context['request']
        user = request.user
        company_id = request.data.get('company_id')
        membership = None
        if company_id:
            membership = CompanyUser.objects.filter(user=user, company_id=company_id, is_active=True).first()
        if not membership:
            membership = CompanyUser.objects.filter(user=user, is_active=True).order_by('joined_at').first()
        if not membership:
            raise serializers.ValidationError('User must belong to a company.')
        stages_data = validated_data.pop('stages', None)
        pipeline = Pipeline.objects.create(company=membership.company, created_by=user, **validated_data)
        if not stages_data:
            order = 1
            for name, prob in self.DEFAULT_STAGES:
                DealStage.objects.create(pipeline=pipeline, name=name, order=order, probability=prob)
                order += 1
        else:
            for stage in stages_data:
                DealStage.objects.create(pipeline=pipeline, name=stage['name'], order=stage['order'], probability=stage['probability'])
        return pipeline

# ---------------- Deal Serializers -----------------

class DealUserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','first_name','last_name','email']

class StageMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = DealStage
        fields = ['id','name','order','probability']

class PipelineMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pipeline
        fields = ['id','name','is_default']

class DealSerializer(serializers.ModelSerializer):
    created_by = DealUserMiniSerializer(read_only=True)
    assigned_to = DealUserMiniSerializer(read_only=True)
    pipeline = PipelineMiniSerializer(read_only=True)
    stage = StageMiniSerializer(read_only=True)
    activity_count = serializers.SerializerMethodField()
    days_in_stage = serializers.SerializerMethodField()
    weighted_value = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Deal
        fields = [
            'id','company','pipeline','stage','created_by','assigned_to','lead','title','description','value','currency',
            'expected_close_date','actual_close_date','contact_name','contact_email','contact_phone','company_name','status',
            'lost_reason','priority','probability','created_at','updated_at','won_at','lost_at','is_active',
            'activity_count','days_in_stage','weighted_value','is_overdue'
        ]
        read_only_fields = ['company','created_by','probability','won_at','lost_at','is_active','activity_count','days_in_stage','weighted_value','is_overdue']

    def get_activity_count(self, obj):
        return obj.activities.count()

    def get_days_in_stage(self, obj):
        # Use last stage change activity time if exists; else created_at
        last_change = obj.activities.filter(activity_type='note', subject__icontains='Stage changed').order_by('-created_at').first()
        ref = last_change.created_at if last_change else obj.created_at
        from django.utils import timezone
        return (timezone.now() - ref).days if ref else 0

    def get_weighted_value(self, obj):
        return float(obj.value) * (obj.probability or 0) / 100.0

    def get_is_overdue(self, obj):
        from django.utils import timezone
        return obj.status == 'open' and obj.expected_close_date and obj.expected_close_date < timezone.now().date()

class DealListSerializer(serializers.ModelSerializer):
    stage = StageMiniSerializer(read_only=True)
    assigned_to = DealUserMiniSerializer(read_only=True)

    class Meta:
        model = Deal
        fields = ['id','title','value','probability','status','priority','expected_close_date','pipeline','stage','assigned_to','company_name','updated_at']
        read_only_fields = fields

class CreateDealSerializer(serializers.ModelSerializer):
    pipeline_id = serializers.IntegerField(write_only=True)
    stage_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Deal
        fields = [
            'pipeline_id','stage_id','title','description','value','currency','expected_close_date','contact_name','contact_email','contact_phone','company_name','priority','assigned_to'
        ]

    def validate(self, data):
        request = self.context['request']
        user = request.user
        # company selection from membership
        company_id = request.data.get('company_id')
        if company_id:
            membership = CompanyUser.objects.filter(user=user, company_id=company_id, is_active=True).first()
        else:
            membership = CompanyUser.objects.filter(user=user, is_active=True).order_by('joined_at').first()
        if not membership:
            raise serializers.ValidationError('User must belong to a company.')
        data['_company'] = membership.company

        pipeline = Pipeline.objects.filter(id=data['pipeline_id'], company=membership.company, is_active=True).first()
        if not pipeline:
            raise serializers.ValidationError({'pipeline_id':'Pipeline not found for company.'})
        data['_pipeline'] = pipeline
        if data.get('stage_id'):
            stage = DealStage.objects.filter(id=data['stage_id'], pipeline=pipeline, is_active=True).first()
        else:
            stage = pipeline.stages.filter(is_active=True).order_by('order').first()
        if not stage:
            raise serializers.ValidationError({'stage_id':'No valid stage for pipeline.'})
        data['_stage'] = stage
        return data

    def create(self, validated_data):
        request = self.context['request']
        company = validated_data.pop('_company')
        pipeline = validated_data.pop('_pipeline')
        stage = validated_data.pop('_stage')
        validated_data.pop('pipeline_id', None)
        validated_data.pop('stage_id', None)
        deal = Deal.objects.create(
            company=company,
            pipeline=pipeline,
            stage=stage,
            created_by=request.user,
            **validated_data
        )
        if deal.assigned_to:
            Activity.objects.create(company=company, user=request.user, deal=deal, activity_type='note', subject='Deal assigned', description=f'Assigned to {deal.assigned_to_id}')
        return deal

class UpdateDealSerializer(serializers.ModelSerializer):
    stage_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Deal
        fields = ['title','description','value','currency','expected_close_date','contact_name','contact_email','contact_phone','company_name','status','lost_reason','priority','assigned_to','stage_id']

    def update(self, instance, validated_data):
        request = self.context['request']
        old_stage_id = instance.stage_id
        stage_id = validated_data.pop('stage_id', None)
        if stage_id is not None:
            stage = DealStage.objects.filter(id=stage_id, pipeline=instance.pipeline, is_active=True).first()
            if not stage:
                raise serializers.ValidationError({'stage_id':'Stage not found in pipeline.'})
            instance.stage = stage
            instance.probability = stage.probability
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if stage_id is not None and old_stage_id != instance.stage_id:
            Activity.objects.create(
                company=instance.company,
                user=request.user,
                deal=instance,
                activity_type='note',
                subject='Stage changed',
                description=f'Stage changed to {instance.stage.name}'
            )
        return instance

class MoveDealStageSerializer(serializers.Serializer):
    stage_id = serializers.IntegerField()

    def validate(self, data):
        deal = self.context['deal']
        stage = DealStage.objects.filter(id=data['stage_id'], pipeline=deal.pipeline, is_active=True).first()
        if not stage:
            raise serializers.ValidationError({'stage_id':'Stage not found in pipeline.'})
        data['stage'] = stage
        return data

    def save(self):
        deal = self.context['deal']
        stage = self.validated_data['stage']
        deal.stage = stage
        deal.probability = stage.probability
        deal.save()
        Activity.objects.create(company=deal.company, user=self.context['request'].user, deal=deal, activity_type='note', subject='Stage changed', description=f'Stage changed to {stage.name}')
        return deal

class CloseDealSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[('won','Won'),('lost','Lost')])
    actual_close_date = serializers.DateField(required=False, allow_null=True)
    lost_reason = serializers.CharField(allow_blank=True, required=False)

    def validate(self, data):
        deal = self.context['deal']
        if data['status'] == 'lost' and not data.get('lost_reason'):
            raise serializers.ValidationError({'lost_reason':'Required when closing as lost.'})
        return data

    def save(self):
        from django.utils import timezone
        deal = self.context['deal']
        request = self.context['request']
        deal.status = self.validated_data['status']
        deal.actual_close_date = self.validated_data.get('actual_close_date') or timezone.now().date()
        if deal.status == 'lost':
            deal.lost_reason = self.validated_data.get('lost_reason','')
        deal.save()
        Activity.objects.create(company=deal.company, user=request.user, deal=deal, activity_type='note', subject=f'Deal {deal.status}', description=f'Deal {deal.status} on {deal.actual_close_date}')
        return deal

class UpdateStageOrderSerializer(serializers.Serializer):
    stage_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)

    def validate(self, data):
        pipeline = self.context['pipeline']
        existing_ids = list(pipeline.stages.values_list('id', flat=True))
        provided = data['stage_ids']
        if sorted(existing_ids) != sorted(provided):
            raise serializers.ValidationError('stage_ids must include all pipeline stages exactly once.')
        return data

    def save(self):
        pipeline = self.context['pipeline']
        stage_ids = self.validated_data['stage_ids']
        # First pass: move to high temporary range to avoid unique constraint collisions
        temp_base = 1000
        for offset, stage_id in enumerate(stage_ids, start=1):
            DealStage.objects.filter(id=stage_id, pipeline=pipeline).update(order=temp_base + offset)
        # Second pass: assign final contiguous order
        for idx, stage_id in enumerate(stage_ids, start=1):
            DealStage.objects.filter(id=stage_id, pipeline=pipeline).update(order=idx)
        return pipeline

# ---------------- Activity Serializers -----------------

class ActivityUserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','first_name','last_name','email']

class ActivityLeadMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ['id','first_name','last_name','email','company_name']

class ActivityDealMiniSerializer(serializers.ModelSerializer):
    stage = StageMiniSerializer(read_only=True)
    class Meta:
        model = Deal
        fields = ['id','title','value','status','stage']

class ActivitySerializer(serializers.ModelSerializer):
    user = ActivityUserMiniSerializer(read_only=True)
    lead = ActivityLeadMiniSerializer(read_only=True)
    deal = ActivityDealMiniSerializer(read_only=True)

    class Meta:
        model = Activity
        fields = ['id','company','user','lead','deal','activity_type','subject','description','created_at','scheduled_at','completed']
        read_only_fields = ['company','user','created_at']

class CreateActivitySerializer(serializers.ModelSerializer):
    lead_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    deal_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Activity
        fields = ['lead_id','deal_id','activity_type','subject','description','scheduled_at']

    def validate(self, data):
        request = self.context['request']
        user = request.user
        lead_id = data.get('lead_id')
        deal_id = data.get('deal_id')
        if not lead_id and not deal_id:
            raise serializers.ValidationError('Either lead_id or deal_id is required.')
        if lead_id and deal_id:
            raise serializers.ValidationError('Provide only one of lead_id or deal_id, not both.')
        target_company = None
        lead = None
        deal = None
        if lead_id:
            lead = Lead.objects.filter(id=lead_id, is_active=True).first()
            if not lead:
                raise serializers.ValidationError({'lead_id':'Lead not found.'})
            target_company = lead.company
        if deal_id:
            deal = Deal.objects.filter(id=deal_id, is_active=True).first()
            if not deal:
                raise serializers.ValidationError({'deal_id':'Deal not found.'})
            target_company = deal.company
        # Ensure requester belongs to company
        if not CompanyUser.objects.filter(user=user, company=target_company, is_active=True).exists():
            raise serializers.ValidationError('You are not a member of this company.')
        data['_company'] = target_company
        data['_lead'] = lead
        data['_deal'] = deal
        return data

    def create(self, validated_data):
        request = self.context['request']
        company = validated_data.pop('_company')
        lead = validated_data.pop('_lead')
        deal = validated_data.pop('_deal')
        validated_data.pop('lead_id', None)
        validated_data.pop('deal_id', None)
        return Activity.objects.create(company=company, user=request.user, lead=lead, deal=deal, **validated_data)

class ActivityListSerializer(serializers.ModelSerializer):
    user = ActivityUserMiniSerializer(read_only=True)
    target_type = serializers.SerializerMethodField()
    target_id = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = ['id','activity_type','subject','description','created_at','scheduled_at','completed','user','target_type','target_id']
        read_only_fields = fields

    def get_target_type(self, obj):
        if obj.lead_id:
            return 'lead'
        if obj.deal_id:
            return 'deal'
        return None

    def get_target_id(self, obj):
        return obj.lead_id or obj.deal_id
