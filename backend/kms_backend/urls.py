from django.contrib import admin
from django.urls import include, path
from rest_framework import routers

from aktenverwaltung.views import AkteViewSet, DashboardView
from organizer.views import AufgabeViewSet, FristViewSet, NotizViewSet

router = routers.DefaultRouter()
router.register(r"akten", AkteViewSet, basename="akte")
router.register(r"aufgaben", AufgabeViewSet, basename="aufgabe")
router.register(r"fristen", FristViewSet, basename="frist")
router.register(r"notizen", NotizViewSet, basename="notiz")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/dashboard/", DashboardView.as_view(), name="dashboard"),
    path("api/", include(router.urls)),
]
