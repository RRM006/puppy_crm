from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from apps.authentication.models import Company, User  # noqa
from .models import Pipeline, DealStage

DEFAULT_STAGES = [
    ('Prospecting', 10),
    ('Qualification', 25),
    ('Proposal', 50),
    ('Negotiation', 75),
    ('Closed Won', 100),
    ('Closed Lost', 0),
]

@receiver(post_save, sender=Company)
def create_default_pipeline(sender, instance, created, **kwargs):
    if not created:
        return
    # Use company.created_by as creator
    creator = instance.created_by
    if not instance.pipelines.filter(is_default=True).exists():
        pipeline = Pipeline.objects.create(
            company=instance,
            name='Sales Pipeline',
            description='Default sales pipeline',
            is_default=True,
            created_by=creator,
        )
        order = 1
        for name, probability in DEFAULT_STAGES:
            DealStage.objects.create(
                pipeline=pipeline,
                name=name,
                order=order,
                probability=probability,
            )
            order += 1
