from django.db import models

class Tag(models.Model):
    name = models.TextField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Image(models.Model):
    tags = models.ManyToManyField(Tag)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    image_file = models.ImageField()

    @property
    def tag_list(self):
        return ", ".join([tag.name for tag in self.tags.all()])
