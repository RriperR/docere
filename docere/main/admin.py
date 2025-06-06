from django.contrib import admin
from django.contrib.auth import get_user_model

User = get_user_model()

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role')  # если у тебя есть поле role

from .models import Patient, Doctor # и т.д.

admin.site.register(Patient)
admin.site.register(Doctor)