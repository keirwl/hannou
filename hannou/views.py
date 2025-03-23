from hashlib import sha224
import logging
import re

from django import forms
from django.conf import settings
from django.core.files.storage import default_storage
from django.db import DatabaseError, transaction
from django.http import JsonResponse
from django.utils.decorators import method_decorator
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

        try:
            uploaded_image = Image.open(uploaded_file)
            if uploaded_image.format not in settings.SERVABLE_IMAGE_TYPES:
                raise ValueError("Image format is not servable with a mime type")
            sha_hash = sha224(uploaded_image.tobytes()).hexdigest()
        except Exception as e:
            logger.exception("Error opening image file")
            return JsonResponse({
                "success": False,
                "errors": {"image": repr(e)},
            }, status=400)

        file_name = f"{sha_hash}.{uploaded_image.format.lower()}"
        if default_storage.exists(file_name):
            logger.debug("File exists")
            return JsonResponse({
                "success": False,
                "errors": {"image": "Image already exists"},
            }, status=400)

        uploaded_file.name = file_name
        logger.debug(f"File name: {file_name}")

        text = re.split(r"[,;\s]+", form.cleaned_data["text"])
        logger.debug(f"Form text: {text}")
        try:
            with transaction.atomic():
                tags = Tag.objects.bulk_create(
                    [Tag(name=t) for t in text if t],
                    update_conflicts=True,
                    update_fields=["updated_at"],
                    unique_fields=["name"],
                )
                logger.debug(f"Created/updated tags: {','.join(t.name for t in tags)}")
                logger.debug("Uploading file")
                image = ImageModel.objects.create(image_file=uploaded_file)

                image.tags.set(tags)
        except DatabaseError as e:
            return JsonResponse({
                "success": False,
                "errors": {"image": repr(e)},
            }, status=400)

        return JsonResponse({
            "success": True,
            "image": {
                "updated_at": image.updated_at,
                "image_url": image.image_file.url,
                "tags": [tag.name for tag in image.tags.all()]
            }
        }, status=201)


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
                "image_url": q.image_file.url,
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


class TaglessImageView(JsonListView):
    model = ImageModel
    ordering = "-updated_at"

    def get_object_list(self):
        queryset = self.get_queryset().filter(tags=None)

        return [
            {
                "updated_at": q.updated_at,
                "image_url": q.image_file.url,
                "tags": None,
            }
            for q in queryset
        ]


class ImageEditView(generic.View):
    http_method_names = ["post", "delete"]

    def post(self, request, image_url):
        try:
            image = ImageModel.objects.get(image_file=image_url)
        except ImageModel.DoesNotExist:
            return JsonResponse({
                "success": False,
                "errors": {"image": "not found"},
            }, status=404)
        except ImageModel.MultipleObjectsReturned:
            return JsonResponse({
                "success": False,
                "errors": {"image": "MultipleObjectsReturned"},
            }, status=500)

        text = re.split(r"[,;\s]+", request.body.decode("utf8"))
        logger.debug(f"Form text: {text}")
        try:
            with transaction.atomic():
                tags = Tag.objects.bulk_create(
                    [Tag(name=t) for t in text if t],
                    update_conflicts=True,
                    update_fields=["updated_at"],
                    unique_fields=["name"],
                )
                logger.debug(f"Created/updated tags: {','.join(t.name for t in tags)}")
                image.tags.set(tags)
        except DatabaseError as e:
            return JsonResponse({
                "success": False,
                "errors": {"image": repr(e)},
            }, status=400)

        return JsonResponse({"success": True}, status=200)

    def delete(self, request, image_url):
        try:
            image = ImageModel.objects.get(image_file=image_url)
        except ImageModel.DoesNotExist:
            return JsonResponse({
                "success": False,
                "errors": {"image": "not found"},
            }, status=404)
        except ImageModel.MultipleObjectsReturned:
            return JsonResponse({
                "success": False,
                "errors": {"image": "MultipleObjectsReturned"},
            }, status=500)

        image.delete()
        return JsonResponse({"success": True}, status=200)


class TagView(JsonListView):
    model = Tag
    ordering = "name"


class ImagelessTagView(JsonListView):
    model = Tag
    ordering = "name"

    def get_object_list(self):
        return list(self.get_queryset().filter(image=None).values())


class VueAppView(generic.TemplateView):
    template_name = "index.html"
