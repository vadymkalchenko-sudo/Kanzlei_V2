"""
User ViewSet for user assignment in tasks.
"""
from django.contrib.auth.models import User
from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing users (read-only for assignment purposes)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
