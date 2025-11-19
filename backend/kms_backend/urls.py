from django.contrib import admin
from django.urls import include, path
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from aktenverwaltung.views import AkteViewSet, DashboardView, MandantViewSet, GegnerViewSet
from finanzen.views import ZahlungspositionViewSet
from organizer.views import AufgabeViewSet, FristViewSet, NotizViewSet

router = routers.DefaultRouter()
router.register(r"akten", AkteViewSet, basename="akte")
router.register(r"mandanten", MandantViewSet, basename="mandant")
router.register(r"gegner", GegnerViewSet, basename="gegner")
router.register(r"aufgaben", AufgabeViewSet, basename="aufgabe")
router.register(r"fristen", FristViewSet, basename="frist")
router.register(r"notizen", NotizViewSet, basename="notiz")
router.register(r"zahlungen", ZahlungspositionViewSet, basename="zahlung")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/dashboard/", DashboardView.as_view(), name="dashboard"),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include(router.urls)),
]
