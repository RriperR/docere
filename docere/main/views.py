from django.http import HttpResponse
from django.shortcuts import render

def index(request):
    return HttpResponse("page of main app")

def categories(request, cat_id):
    return HttpResponse(f"<h1>page of Categories</h1><p>id: {cat_id}</p>")