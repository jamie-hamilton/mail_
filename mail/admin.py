from django.contrib import admin

from mail.models import User, Email, WelcomeEmail

admin.site.register(User)
admin.site.register(Email)
admin.site.register(WelcomeEmail)