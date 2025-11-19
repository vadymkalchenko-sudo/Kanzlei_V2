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

# Main router for akten, mandanten, gegner
router = routers.DefaultRouter()
router.register(r"akten", AkteViewSet, basename="akte")
router.register(r"mandanten", MandantViewSet, basename="mandant")
router.register(r"gegner", GegnerViewSet, basename="gegner")

# Organizer router
organizer_router = routers.DefaultRouter()
organizer_router.register(r"aufgaben", AufgabeViewSet, basename="aufgabe")
organizer_router.register(r"fristen", FristViewSet, basename="frist")
organizer_router.register(r"notizen", NotizViewSet, basename="notiz")

# Finanzen router
finanzen_router = routers.DefaultRouter()
finanzen_router.register(r"positionen", ZahlungspositionViewSet, basename="position")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/dashboard/", DashboardView.as_view(), name="dashboard"),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/organizer/", include(organizer_router.urls)),
    path("api/finanzen/", include(finanzen_router.urls)),
    path("api/", include(router.urls)),
]
