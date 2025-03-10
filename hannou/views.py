from hashlib import sha224
import logging
import re

from django import forms
from django.core.files.storage import default_storage
from django.db.models import Q
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views import generic
from PIL import Image

from .models import Image as ImageModel, Tag

logger = logging.getLogger("hannou")
csrf_protect = method_decorator(csrf_protect)
ensure_csrf_cookie = method_decorator(ensure_csrf_cookie)


class UploadForm(forms.Form):
    text = forms.CharField(required=False)
    image = forms.ImageField(required=True)


class UploadView(generic.FormView):
    form_class = UploadForm

    def form_valid(self, form):
        logger.debug(f"Uploaded image: {form.cleaned_data['image']}")
        uploaded_file = form.cleaned_data["image"]
        uploaded_image = Image.open(uploaded_file)
        sha_hash = sha224(uploaded_image.tobytes()).hexdigest()
        file_name = f"{sha_hash}.{uploaded_image.format.lower()}"
        uploaded_file.name = file_name
        logger.debug(f"File name: {file_name}")

        text = re.split(r"[,;\s]+", form.cleaned_data["text"])
        logger.debug(f"Form text: {text}")
        tags = Tag.objects.bulk_create(
            [Tag(name=t) for t in text if t],
            update_conflicts=True,
            update_fields=["updated_at"],
            unique_fields=["name"],
        )
        logger.debug(f"Created/updated tags: {','.join(t.name for t in tags)}")

        if default_storage.exists(file_name):
            logger.debug("File exists")
            image = ImageModel.objects.get(image_file=file_name)
            update = True
        else:
            logger.debug("Uploading file")
            image = ImageModel.objects.create(image_file=uploaded_file)
            update = False

        image.tags.set(tags)

        return JsonResponse({
            'success': True,
            'update': update,
            'image': {
                'updated_at': image.updated_at,
                'image_file': image.image_file.url,
                'tags': [tag.name for tag in image.tags.all()]
            }
        })


class IndexView(generic.ListView):
    model = ImageModel
    ordering = "-updated_at"

    def get_queryset(self, query=None):
        queryset = super().get_queryset()
        if query:
            tags = Tag.objects.filter(name__in=query)
            for tag in tags:  # not the most efficient, but n is very small
                queryset = queryset.filter(tags=tag)
        queryset = queryset.prefetch_related("tags")

        return [
            {
                "updated_at": q.updated_at,
                "image_file": q.image_file.url,
                "tags": [tag.name for tag in q.tags.all()],
            }
            for q in queryset
        ]

    @ensure_csrf_cookie
    def get(self, request, *args, **kwargs):
        self.object_list = self.get_queryset()
        context = self.get_context_data()
        del context["view"]
        return JsonResponse(context)

    @csrf_protect
    def post(self, request, *args, **kwargs):
        query = re.split(r"[,;\s]+", request.body.decode("utf8"))
        logger.debug(query)
        self.object_list = self.get_queryset(query)
        context = self.get_context_data()
        del context["view"]
        return JsonResponse(context)


class VueAppView(generic.TemplateView):
    template_name = "index.html"
