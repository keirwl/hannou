"""
URL configuration for hannou project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path

from . import views

api_patterns = [
    path("images", views.ImageView.as_view(), name="images"),
    path("images/<path:image_url>", views.ImageEditView.as_view(), name="edit"),
    path("tags", views.TagView.as_view(), name="tags"),
    path("upload", views.UploadView.as_view(), name="upload"),
    path("images/tagless", views.TaglessImageView.as_view(), name="tagless"),
    path("tags/imageless", views.ImagelessTagView.as_view(), name="imageless"),
]

urlpatterns = [
    path("", views.VueAppView.as_view(), name="index"),
    path("api/", include(api_patterns)),
] + static(
    settings.STATIC_URL, document_root=settings.STATIC_ROOT
) + static(
    settings.MEDIA_URL, document_root=settings.MEDIA_ROOT
)
