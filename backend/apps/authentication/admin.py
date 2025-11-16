from django.contrib import admin
from .models import User, Company, CompanyUser, Customer, CustomerCompany

admin.site.register(User)
admin.site.register(Company)
admin.site.register(CompanyUser)
admin.site.register(Customer)
admin.site.register(CustomerCompany)
