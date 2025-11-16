"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
# from drf_yasg.views import get_schema_view
# from drf_yasg import openapi


def health(request):
    return JsonResponse({"status": "ok", "message": "Backend is running"})


# # Swagger/OpenAPI schema
# schema_view = get_schema_view(
#     openapi.Info(
#         title="Puppy CRM API",
#         default_version='v1',
#         description="API documentation for Puppy CRM system",
#         contact=openapi.Contact(email="support@puppycrm.com"),
#         license=openapi.License(name="Proprietary"),
#     ),
#     public=True,
#     permission_classes=(permissions.AllowAny,),
# )

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/', include('apps.crm.urls')),
    path('api/customers/', include('apps.customers.urls')),
    path('api/orders/', include('apps.customers.orders_urls')),
    path('api/interactions/', include('apps.customers.interactions_urls')),
    path('api/customer/', include('apps.customers.portal_urls')),
    path('api/emails/', include('apps.emails.urls')),
<<<<<<< HEAD
    path('api/calls/', include('apps.calls.urls')),
=======
>>>>>>> 517ed252086bbf69d280f680af46e67f68419d5c
    
    # API Documentation
    # path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    # path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
