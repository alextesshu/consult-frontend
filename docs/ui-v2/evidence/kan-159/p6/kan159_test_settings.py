import os

os.environ['DJANGO_ENV'] = 'test'
os.environ['SENTRY_DSN'] = ''
os.environ['DJANGO_SECRET_KEY'] = 'isolated-registration-contract-tests-only'
os.environ['GCS_PUBLIC'] = 'false'
os.environ['GCS_CREDENTIALS_FILE'] = ''
os.environ['GCS_CREDENTIALS_JSON'] = ''
os.environ['NOTE_ENCRYPTION_ALLOW_SECRET_KEY_FALLBACK'] = 'true'

from config.settings import *

DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': 'registration_contract',
    'USER': 'registration_contract',
    'PASSWORD': '',
    'HOST': '127.0.0.1',
    'PORT': '58504',
    'TEST': {'NAME': 'test_kan159_p6_contract'},
}}
CACHES = {'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}}
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
ONBOARDING_CONFIRMED_EMAIL_PROVIDER = 'smtp'
DEBUG = False
ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
