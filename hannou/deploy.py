import os

from .settings import *

DEBUG = False
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
ALLOWED_HOSTS = ["127.0.0.1"]
MEDIA_ROOT = BASE_DIR / "media"
DJANGO_VITE["default"]["dev_mode"] = False
