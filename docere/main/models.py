from django.db import models

class Patient(models.Model):
    title = models.CharField(max_length=255)
    contect = models.TextField(blank=True)
    time_create = models.DateTimeField(auto_now_add=True)
    time_update = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=True)