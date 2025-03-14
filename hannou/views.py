from hashlib import sha224
import logging
import re

from django import forms
from django.core.files.storage import default_storage
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views import generic
from PIL import Image

from .models import Image as ImageModel, Tag

logger = logging.getLogger("hannou")


class UploadForm(forms.Form):
    text = forms.CharField(required=False)
    image = forms.ImageField(required=True)


class JsonListView(generic.ListView):
    def get_object_list(self, *args, **kwargs):
        return list(self.get_queryset().values())

    def get(self, request, *args, **kwargs):
        self.object_list = self.get_object_list()
        context = self.get_context_data()
        del context["view"]
        return JsonResponse(context)


@method_decorator(csrf_exempt, name="dispatch")
class UploadView(generic.FormView):
    form_class = UploadForm

    def form_invalid(self, form):
        return JsonResponse({
            "success": False,
            "errors": form.errors,
        }, status=400)

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
            "success": True,
            "update": update,
            "image": {
                "updated_at": image.updated_at,
                "image_file": image.image_file.url,
                "tags": [tag.name for tag in image.tags.all()]
            }
        })


@method_decorator(csrf_exempt, name="dispatch")
class ImageView(JsonListView):
    model = ImageModel
    ordering = "-updated_at"

    def get_object_list(self, query=None):
        queryset = self.get_queryset()
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

    def post(self, request, *args, **kwargs):
        query = re.split(r"[,;\s]+", request.body.decode("utf8"))
        logger.debug(query)
        self.object_list = self.get_object_list(query)
        context = self.get_context_data()
        del context["view"]
        return JsonResponse(context)


class TagView(JsonListView):
    model = Tag
    ordering = "name"


class VueAppView(generic.TemplateView):
    template_name = "index.html"
