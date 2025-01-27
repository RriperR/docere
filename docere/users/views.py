from django.contrib.auth.models import User

from rest_framework import generics
from rest_framework.permissions import AllowAny
from users.serializers import UserSerializer

from users.forms import LoginUserForm
from django.contrib.auth.views import LoginView

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class LoginUser(LoginView):
    form_class = LoginUserForm
    template_name = 'users/login.html'
    extra_context = {"title":"Авторизация"}
