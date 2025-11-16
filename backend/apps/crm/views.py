from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import models
from django.db.models import Q, Count, Avg, F, DurationField, ExpressionWrapper
from django.utils import timezone
from datetime import timedelta

from .models import Lead, Activity, Deal, Pipeline, DealStage
from .serializers import (
    LeadSerializer, LeadListSerializer, CreateLeadSerializer,
    UpdateLeadSerializer, ConvertLeadSerializer, AssignLeadSerializer,
    PipelineSerializer, CreatePipelineSerializer, DealStageSerializer, UpdateStageOrderSerializer,
    DealSerializer, DealListSerializer, CreateDealSerializer, UpdateDealSerializer, MoveDealStageSerializer, CloseDealSerializer,
    ActivitySerializer, CreateActivitySerializer, ActivityListSerializer
)
from .permissions import IsCompanyUser, CanManageLeads, IsLeadOwnerOrManager, PipelineManagePermission, IsDealOwnerOrManager
from apps.authentication.models import CompanyUser, User

class LeadListCreateView(generics.ListCreateAPIView):
    queryset = Lead.objects.filter(is_active=True).select_related('assigned_to','created_by','company')
    permission_classes = [IsCompanyUser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateLeadSerializer
        return LeadListSerializer

    def get_queryset(self):
        user = self.request.user
        # Determine company context
        company_id = self.request.query_params.get('company_id')
        if company_id and CompanyUser.objects.filter(user=user, company_id=company_id, is_active=True).exists():
            qs = Lead.objects.filter(company_id=company_id, is_active=True)
        else:
            memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
            qs = Lead.objects.filter(company_id__in=memberships, is_active=True)
        # Filters
        status_f = self.request.query_params.get('status')
        if status_f:
            qs = qs.filter(status=status_f)
        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            qs = qs.filter(assigned_to_id=assigned_to)
        lead_source = self.request.query_params.get('lead_source')
        if lead_source:
            qs = qs.filter(lead_source=lead_source)
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            qs = qs.filter(created_at__date__gte=start_date)
        if end_date:
            qs = qs.filter(created_at__date__lte=end_date)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(company_name__icontains=search)
            )
        sort = self.request.query_params.get('sort')
        if sort in ['created_at','updated_at','estimated_value']:
            direction = self.request.query_params.get('direction','desc')
            if direction == 'desc':
                sort = f'-{sort}'
            qs = qs.order_by(sort)
        else:
            qs = qs.order_by('-created_at')
        return qs.select_related('assigned_to','created_by')

    def perform_create(self, serializer):
        serializer.save()

class LeadDetailView(APIView):
    permission_classes = [IsCompanyUser, IsLeadOwnerOrManager]

    def get_object(self, pk):
        return Lead.objects.select_related('assigned_to','created_by','company').filter(pk=pk, is_active=True).first()

    def get(self, request, pk):
        lead = self.get_object(pk)
        if not lead:
            return Response({'detail':'Not found.'}, status=404)
        for perm in self.permission_classes:
            if hasattr(perm, 'has_object_permission'):
                if not perm().has_object_permission(request, self, lead):
                    return Response({'detail':perm.message}, status=403)
        data = LeadSerializer(lead).data
        # Activity history (recent first)
        activities = Activity.objects.filter(lead=lead).order_by('-created_at')[:100]
        data['activities'] = [
            {
                'id':a.id,
                'type':a.activity_type,
                'subject':a.subject,
                'description':a.description,
                'created_at':a.created_at,
                'scheduled_at':a.scheduled_at,
                'completed':a.completed,
            } for a in activities
        ]
        return Response(data)

    def put(self, request, pk):
        lead = self.get_object(pk)
        if not lead:
            return Response({'detail':'Not found.'}, status=404)
        for perm in self.permission_classes:
            if hasattr(perm, 'has_object_permission'):
                if not perm().has_object_permission(request, self, lead):
                    return Response({'detail':perm.message}, status=403)
        serializer = UpdateLeadSerializer(instance=lead, data=request.data, partial=True, context={'request':request})
        serializer.is_valid(raise_exception=True)
        lead = serializer.save()
        return Response(LeadSerializer(lead).data)

    def delete(self, request, pk):
        lead = self.get_object(pk)
        if not lead:
            return Response({'detail':'Not found.'}, status=404)
        for perm in self.permission_classes:
            if hasattr(perm, 'has_object_permission'):
                if not perm().has_object_permission(request, self, lead):
                    return Response({'detail':perm.message}, status=403)
        lead.is_active = False
        lead.save()
        return Response(status=204)

class ConvertLeadView(APIView):
    permission_classes = [IsCompanyUser, IsLeadOwnerOrManager]

    def post(self, request, pk):
        lead = Lead.objects.filter(pk=pk, is_active=True).first()
        if not lead:
            return Response({'detail':'Not found.'}, status=404)
        for perm in self.permission_classes:
            if hasattr(perm, 'has_object_permission'):
                if not perm().has_object_permission(request, self, lead):
                    return Response({'detail':perm.message}, status=403)
        serializer = ConvertLeadSerializer(data=request.data, context={'lead':lead,'request':request})
        serializer.is_valid(raise_exception=True)
        deal = serializer.save()
        return Response({'detail':'Lead converted','deal_id':deal.id}, status=201)

class AssignLeadView(APIView):
    permission_classes = [IsCompanyUser, CanManageLeads]

    def post(self, request, pk):
        lead = Lead.objects.filter(pk=pk, is_active=True).first()
        if not lead:
            return Response({'detail':'Not found.'}, status=404)
        serializer = AssignLeadSerializer(data=request.data, context={'lead':lead,'request':request})
        serializer.is_valid(raise_exception=True)
        lead = serializer.save()
        return Response({'detail':'Lead assigned','assigned_to':lead.assigned_to_id})

class LeadStatsView(APIView):
    permission_classes = [IsCompanyUser]

    def get(self, request):
        user = request.user
        company_id = request.query_params.get('company_id')
        if company_id and CompanyUser.objects.filter(user=user, company_id=company_id, is_active=True).exists():
            leads = Lead.objects.filter(company_id=company_id, is_active=True)
        else:
            memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
            leads = Lead.objects.filter(company_id__in=memberships, is_active=True)
        total = leads.count()
        by_status = leads.values('status').annotate(count=Count('id')).order_by()
        by_source = leads.values('lead_source').annotate(count=Count('id')).order_by()
        converted = leads.filter(status='converted')
        conversion_rate = (converted.count() / total * 100) if total else 0
        # Avg time to conversion
        converted_times = converted.exclude(converted_at__isnull=True).values_list('created_at','converted_at')
        durations = [ (c2 - c1).total_seconds() for c1,c2 in converted_times ]
        avg_time_days = (sum(durations)/len(durations)/86400) if durations else 0
        by_assigned = leads.values('assigned_to').annotate(count=Count('id')).order_by()
        return Response({
            'total_leads': total,
            'leads_by_status': {row['status']: row['count'] for row in by_status},
            'leads_by_source': {row['lead_source']: row['count'] for row in by_source},
            'conversion_rate_percent': round(conversion_rate,2),
            'average_time_to_conversion_days': round(avg_time_days,2),
            'leads_by_assigned_user': {str(row['assigned_to']): row['count'] for row in by_assigned},
        })

# ---------------- Pipeline & Stage Views -----------------

class PipelineListCreateView(generics.ListCreateAPIView):
    permission_classes = [PipelineManagePermission]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreatePipelineSerializer
        return PipelineSerializer

    def get_queryset(self):
        user = self.request.user
        company_id = self.request.query_params.get('company_id')
        if company_id and CompanyUser.objects.filter(user=user, company_id=company_id, is_active=True).exists():
            return Pipeline.objects.filter(company_id=company_id, is_active=True).order_by('id')
        memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
        return Pipeline.objects.filter(company_id__in=memberships, is_active=True).order_by('id')

    def perform_create(self, serializer):
        serializer.save()

class PipelineDetailView(APIView):
    permission_classes = [PipelineManagePermission]

    def get_object(self, pk):
        return Pipeline.objects.filter(pk=pk, is_active=True).select_related('company','created_by').first()

    def get(self, request, pk):
        pipeline = self.get_object(pk)
        if not pipeline:
            return Response({'detail':'Not found.'}, status=404)
        return Response(PipelineSerializer(pipeline).data)

    def put(self, request, pk):
        pipeline = self.get_object(pk)
        if not pipeline:
            return Response({'detail':'Not found.'}, status=404)
        data = {k:v for k,v in request.data.items() if k in ['name','description']}
        for k,v in data.items():
            setattr(pipeline, k, v)
        pipeline.save()
        return Response(PipelineSerializer(pipeline).data)

    def delete(self, request, pk):
        pipeline = self.get_object(pk)
        if not pipeline:
            return Response({'detail':'Not found.'}, status=404)
        if pipeline.deals.exists():
            return Response({'detail':'Cannot delete pipeline with active deals.'}, status=400)
        pipeline.is_active = False
        pipeline.save()
        return Response(status=204)

class StageListCreateView(generics.ListCreateAPIView):
    permission_classes = [PipelineManagePermission]
    serializer_class = DealStageSerializer

    def get_queryset(self):
        pipeline_id = self.kwargs['pk']
        return DealStage.objects.filter(pipeline_id=pipeline_id, is_active=True).order_by('order')

    def create(self, request, *args, **kwargs):
        pipeline_id = kwargs['pk']
        pipeline = Pipeline.objects.filter(id=pipeline_id, is_active=True).first()
        if not pipeline:
            return Response({'detail':'Pipeline not found.'}, status=404)
        name = request.data.get('name')
        probability = request.data.get('probability')
        if name is None or probability is None:
            return Response({'detail':'name and probability required.'}, status=400)
        try:
            probability = int(probability)
        except ValueError:
            return Response({'detail':'probability must be integer.'}, status=400)
        if probability < 0 or probability > 100:
            return Response({'detail':'probability must be 0-100.'}, status=400)
        max_order = pipeline.stages.aggregate(m=models.Max('order'))['m'] or 0
        stage = DealStage.objects.create(pipeline=pipeline, name=name, probability=probability, order=max_order+1)
        return Response(DealStageSerializer(stage).data, status=201)

class StageUpdateView(APIView):
    permission_classes = [PipelineManagePermission]

    def get_object(self, pk):
        return DealStage.objects.filter(pk=pk, is_active=True).select_related('pipeline').first()

    def put(self, request, pk):
        stage = self.get_object(pk)
        if not stage:
            return Response({'detail':'Not found.'}, status=404)
        name = request.data.get('name')
        probability = request.data.get('probability')
        order = request.data.get('order')
        if name:
            stage.name = name
        if probability is not None:
            try:
                probability = int(probability)
            except ValueError:
                return Response({'detail':'probability must be integer.'}, status=400)
            if probability < 0 or probability > 100:
                return Response({'detail':'probability must be 0-100.'}, status=400)
            stage.probability = probability
        if order is not None:
            try:
                order = int(order)
            except ValueError:
                return Response({'detail':'order must be integer.'}, status=400)
            # Reorder: shift other stages
            pipeline = stage.pipeline
            if order < 1:
                return Response({'detail':'order must be >=1.'}, status=400)
            stages = list(pipeline.stages.order_by('order'))
            stages.remove(stage)
            stages.insert(order-1, stage)
            for idx, s in enumerate(stages, start=1):
                DealStage.objects.filter(pk=s.pk).update(order=idx)
        stage.save()
        return Response(DealStageSerializer(stage).data)

    def delete(self, request, pk):
        stage = self.get_object(pk)
        if not stage:
            return Response({'detail':'Not found.'}, status=404)
        if stage.deals.exists():
            return Response({'detail':'Cannot delete stage with existing deals.'}, status=400)
        stage.is_active = False
        stage.save()
        return Response(status=204)

class ReorderStagesView(APIView):
    permission_classes = [PipelineManagePermission]

    def post(self, request, pk):
        pipeline = Pipeline.objects.filter(pk=pk, is_active=True).first()
        if not pipeline:
            return Response({'detail':'Not found.'}, status=404)
        serializer = UpdateStageOrderSerializer(data=request.data, context={'pipeline':pipeline})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail':'Stages reordered.'})

# ---------------- Deal Views -----------------

class DealListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsCompanyUser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateDealSerializer
        return DealListSerializer

    def get_queryset(self):
        user = self.request.user
        company_id = self.request.query_params.get('company_id')
        if company_id and CompanyUser.objects.filter(user=user, company_id=company_id, is_active=True).exists():
            qs = Deal.objects.filter(company_id=company_id, is_active=True)
        else:
            memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
            qs = Deal.objects.filter(company_id__in=memberships, is_active=True)
        # Filters
        pipeline = self.request.query_params.get('pipeline')
        if pipeline:
            qs = qs.filter(pipeline_id=pipeline)
        stage = self.request.query_params.get('stage')
        if stage:
            qs = qs.filter(stage_id=stage)
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status)
        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            qs = qs.filter(assigned_to_id=assigned_to)
        priority = self.request.query_params.get('priority')
        if priority:
            qs = qs.filter(priority=priority)
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            qs = qs.filter(created_at__date__gte=start_date)
        if end_date:
            qs = qs.filter(created_at__date__lte=end_date)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(company_name__icontains=search) |
                Q(contact_name__icontains=search)
            )
        sort = self.request.query_params.get('sort')
        if sort in ['created_at','value','expected_close_date']:
            direction = self.request.query_params.get('direction','desc')
            if direction == 'desc':
                sort = f'-{sort}'
            qs = qs.order_by(sort)
        else:
            qs = qs.order_by('-created_at')
        return qs.select_related('pipeline','stage','assigned_to')

    def perform_create(self, serializer):
        serializer.save()

class DealDetailView(APIView):
    permission_classes = [IsCompanyUser, IsDealOwnerOrManager]

    def get_object(self, pk):
        return Deal.objects.filter(pk=pk, is_active=True).select_related('pipeline','stage','assigned_to','created_by','company').first()

    def get(self, request, pk):
        deal = self.get_object(pk)
        if not deal:
            return Response({'detail':'Not found.'}, status=404)
        for perm in self.permission_classes:
            if hasattr(perm, 'has_object_permission'):
                if not perm().has_object_permission(request, self, deal):
                    return Response({'detail':perm.message}, status=403)
        data = DealSerializer(deal).data
        activities = Activity.objects.filter(deal=deal).order_by('-created_at')[:200]
        data['activities'] = [
            {
                'id':a.id,
                'type':a.activity_type,
                'subject':a.subject,
                'description':a.description,
                'created_at':a.created_at,
                'scheduled_at':a.scheduled_at,
                'completed':a.completed,
            } for a in activities
        ]
        return Response(data)

    def put(self, request, pk):
        deal = self.get_object(pk)
        if not deal:
            return Response({'detail':'Not found.'}, status=404)
        for perm in self.permission_classes:
            if hasattr(perm, 'has_object_permission'):
                if not perm().has_object_permission(request, self, deal):
                    return Response({'detail':perm.message}, status=403)
        serializer = UpdateDealSerializer(instance=deal, data=request.data, partial=True, context={'request':request})
        serializer.is_valid(raise_exception=True)
        deal = serializer.save()
        return Response(DealSerializer(deal).data)

    def delete(self, request, pk):
        deal = self.get_object(pk)
        if not deal:
            return Response({'detail':'Not found.'}, status=404)
        for perm in self.permission_classes:
            if hasattr(perm, 'has_object_permission'):
                if not perm().has_object_permission(request, self, deal):
                    return Response({'detail':perm.message}, status=403)
        deal.is_active = False
        deal.save()
        return Response(status=204)

class MoveDealStageView(APIView):
    permission_classes = [IsCompanyUser, IsDealOwnerOrManager]

    def post(self, request, pk):
        deal = Deal.objects.filter(pk=pk, is_active=True).first()
        if not deal:
            return Response({'detail':'Not found.'}, status=404)
        for perm in self.permission_classes:
            if hasattr(perm, 'has_object_permission'):
                if not perm().has_object_permission(request, self, deal):
                    return Response({'detail':perm.message}, status=403)
        serializer = MoveDealStageSerializer(data=request.data, context={'deal':deal,'request':request})
        serializer.is_valid(raise_exception=True)
        deal = serializer.save()
        return Response({'detail':'Stage moved','stage_id':deal.stage_id,'probability':deal.probability})

class CloseDealView(APIView):
    permission_classes = [IsCompanyUser, IsDealOwnerOrManager]

    def post(self, request, pk):
        deal = Deal.objects.filter(pk=pk, is_active=True).first()
        if not deal:
            return Response({'detail':'Not found.'}, status=404)
        for perm in self.permission_classes:
            if hasattr(perm, 'has_object_permission'):
                if not perm().has_object_permission(request, self, deal):
                    return Response({'detail':perm.message}, status=403)
        serializer = CloseDealSerializer(data=request.data, context={'deal':deal,'request':request})
        serializer.is_valid(raise_exception=True)
        deal = serializer.save()
        return Response({'detail':f'Deal {deal.status}','actual_close_date':str(deal.actual_close_date)})

class AssignDealView(APIView):
    permission_classes = [IsCompanyUser, CanManageLeads]

    def post(self, request, pk):
        deal = Deal.objects.filter(pk=pk, is_active=True).first()
        if not deal:
            return Response({'detail':'Not found.'}, status=404)
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail':'user_id required.'}, status=400)
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({'detail':'User not found.'}, status=404)
        if not CompanyUser.objects.filter(user=user, company=deal.company, is_active=True).exists():
            return Response({'detail':'User not in company.'}, status=400)
        deal.assigned_to = user
        deal.save()
        Activity.objects.create(company=deal.company, user=request.user, deal=deal, activity_type='note', subject='Deal assigned', description=f'Assigned to {user.id}')
        return Response({'detail':'Deal assigned','assigned_to':user.id})

class DealStatsView(APIView):
    permission_classes = [IsCompanyUser]

    def get(self, request):
        user = request.user
        company_id = request.query_params.get('company_id')
        if company_id and CompanyUser.objects.filter(user=user, company_id=company_id, is_active=True).exists():
            deals = Deal.objects.filter(company_id=company_id, is_active=True)
        else:
            memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
            deals = Deal.objects.filter(company_id__in=memberships, is_active=True)
        from django.db.models.functions import TruncMonth
        total_value = deals.aggregate(s=models.Sum('value'))['s'] or 0
        by_stage = deals.values('stage__name').annotate(count=Count('id'), value=models.Sum('value')).order_by()
        won = deals.filter(status='won')
        total = deals.count() or 1
        win_rate = won.count()/total*100
        avg_deal_size = (deals.aggregate(a=models.Avg('value'))['a'] or 0)
        # Avg days to close (won + lost with actual_close_date)
        durations = list(
            deals.exclude(actual_close_date__isnull=True).values_list('created_at','actual_close_date')
        )
        import datetime
        avg_days = 0
        if durations:
            seconds = [ (datetime.datetime.combine(d2, datetime.time.min, tzinfo=None) - d1.replace(tzinfo=None)).total_seconds() for d1,d2 in durations ]
            avg_days = (sum(seconds)/len(seconds))/86400
        by_assigned = deals.values('assigned_to').annotate(count=Count('id'), value=models.Sum('value')).order_by()
        monthly = deals.annotate(m=TruncMonth('created_at')).values('m').annotate(count=Count('id'), value=models.Sum('value')).order_by('m')
        return Response({
            'total_deals_value': float(total_value),
            'deals_by_stage': {row['stage__name'] or '': {'count':row['count'],'value':float(row['value'] or 0)} for row in by_stage},
            'win_rate_percent': round(win_rate,2),
            'average_deal_size': float(avg_deal_size or 0),
            'average_days_to_close': round(avg_days,2),
            'deals_by_assigned_user': {str(row['assigned_to']): {'count':row['count'],'value':float(row['value'] or 0)} for row in by_assigned},
            'monthly_trends': [ {'month':str(row['m'])[:7], 'count':row['count'], 'value':float(row['value'] or 0)} for row in monthly ],
        })

class DealsByStageView(APIView):
    permission_classes = [IsCompanyUser]

    def get(self, request):
        user = request.user
        pipeline_id = request.query_params.get('pipeline_id')
        qs = Deal.objects.filter(is_active=True)
        if pipeline_id:
            qs = qs.filter(pipeline_id=pipeline_id)
        else:
            memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
            qs = qs.filter(company_id__in=memberships)
        data = {}
        for stage in DealStage.objects.filter(pipeline_id=pipeline_id).order_by('order') if pipeline_id else DealStage.objects.filter(is_active=True).order_by('pipeline_id','order'):
            deals = qs.filter(stage=stage).select_related('assigned_to','stage','pipeline')
            data.setdefault(str(stage.id), {
                'stage': {'id':stage.id,'name':stage.name,'order':stage.order,'probability':stage.probability},
                'deals': DealListSerializer(deals, many=True).data
            })
        return Response(data)

# ---------------- Activity Views -----------------

class ActivityListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsCompanyUser]

    def get_serializer_class(self):
        return CreateActivitySerializer if self.request.method == 'POST' else ActivityListSerializer

    def get_queryset(self):
        user = self.request.user
        company_id = self.request.query_params.get('company_id')
        if company_id and CompanyUser.objects.filter(user=user, company_id=company_id, is_active=True).exists():
            qs = Activity.objects.filter(company_id=company_id)
        else:
            memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
            qs = Activity.objects.filter(company_id__in=memberships)
        # Filters
        lead = self.request.query_params.get('lead')
        if lead:
            qs = qs.filter(lead_id=lead)
        deal = self.request.query_params.get('deal')
        if deal:
            qs = qs.filter(deal_id=deal)
        user_id = self.request.query_params.get('user')
        if user_id:
            qs = qs.filter(user_id=user_id)
        activity_type = self.request.query_params.get('activity_type')
        if activity_type:
            qs = qs.filter(activity_type=activity_type)
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            qs = qs.filter(created_at__date__gte=start_date)
        if end_date:
            qs = qs.filter(created_at__date__lte=end_date)
        sort = self.request.query_params.get('sort')
        if sort in ['created_at','scheduled_at']:
            direction = self.request.query_params.get('direction','desc')
            if direction == 'desc':
                sort = f'-{sort}'
            qs = qs.order_by(sort)
        else:
            qs = qs.order_by('-created_at')
        return qs.select_related('user','lead','deal','deal__stage')

    def perform_create(self, serializer):
        serializer.save()

class ActivityDetailView(APIView):
    permission_classes = [IsCompanyUser]

    def get_object(self, pk, request):
        memberships = CompanyUser.objects.filter(user=request.user, is_active=True).values_list('company_id', flat=True)
        return Activity.objects.filter(pk=pk, company_id__in=memberships).select_related('user','lead','deal','deal__stage').first()

    def get(self, request, pk):
        obj = self.get_object(pk, request)
        if not obj:
            return Response({'detail':'Not found.'}, status=404)
        return Response(ActivitySerializer(obj).data)

    def put(self, request, pk):
        obj = self.get_object(pk, request)
        if not obj:
            return Response({'detail':'Not found.'}, status=404)
        # Only allow updating mutable fields
        data = {k:v for k,v in request.data.items() if k in ['activity_type','subject','description','scheduled_at','completed']}
        for k,v in data.items():
            setattr(obj, k, v)
        obj.save()
        return Response(ActivitySerializer(obj).data)

    def delete(self, request, pk):
        obj = self.get_object(pk, request)
        if not obj:
            return Response({'detail':'Not found.'}, status=404)
        obj.delete()
        return Response(status=204)

class LeadActivitiesView(APIView):
    permission_classes = [IsCompanyUser, IsLeadOwnerOrManager]

    def get(self, request, pk):
        lead = Lead.objects.filter(pk=pk, is_active=True).first()
        if not lead:
            return Response({'detail':'Not found.'}, status=404)
        # object permission
        for perm in self.permission_classes:
            if hasattr(perm, 'has_object_permission'):
                if not perm().has_object_permission(request, self, lead):
                    return Response({'detail':perm.message}, status=403)
        activities = Activity.objects.filter(lead=lead).select_related('user').order_by('-created_at')
        return Response(ActivityListSerializer(activities, many=True).data)

class DealActivitiesView(APIView):
    permission_classes = [IsCompanyUser, IsDealOwnerOrManager]

    def get(self, request, pk):
        deal = Deal.objects.filter(pk=pk, is_active=True).first()
        if not deal:
            return Response({'detail':'Not found.'}, status=404)
        for perm in self.permission_classes:
            if hasattr(perm, 'has_object_permission'):
                if not perm().has_object_permission(request, self, deal):
                    return Response({'detail':perm.message}, status=403)
        activities = Activity.objects.filter(deal=deal).select_related('user').order_by('-created_at')
        return Response(ActivityListSerializer(activities, many=True).data)

class MarkActivityCompleteView(APIView):
    permission_classes = [IsCompanyUser]

    def post(self, request, pk):
        memberships = CompanyUser.objects.filter(user=request.user, is_active=True).values_list('company_id', flat=True)
        obj = Activity.objects.filter(pk=pk, company_id__in=memberships).first()
        if not obj:
            return Response({'detail':'Not found.'}, status=404)
        obj.completed = True
        obj.save()
        return Response({'detail':'Activity marked complete','id':obj.id,'completed':obj.completed})
