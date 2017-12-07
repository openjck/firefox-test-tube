"""
Django settings for backend project.

Generated by 'django-admin startproject' using Django 1.11.6.

For more information on this file, see
https://docs.djangoproject.com/en/1.11/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.11/ref/settings/
"""

import os
from datetime import timedelta

import dj_database_url
from decouple import config
from django.core.urlresolvers import reverse_lazy


# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.normpath(os.path.join(BASE_DIR, '..'))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.11/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='change me to a real secret key')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = ['*']


# Application definition

INSTALLED_APPS = [
    # Django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # 3rd party
    'mozilla_django_oidc',
    'dockerflow.django',
    'rest_framework',

    # Project
    'backend',
    'backend.api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'dockerflow.django.middleware.DockerflowMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.static',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'backend.context_processors.settings',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.11/ref/settings/#databases

DEFAULT_DATABASE = config(
    'DATABASE_URL',
    default='postgresql://experimentsviewer:experimentsviewer@localhost:5432/experimentsviewer',
    cast=dj_database_url.parse)

DATABASES = {
    'default': DEFAULT_DATABASE,
}


# Password validation
# https://docs.djangoproject.com/en/1.11/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/1.11/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = False

USE_L10N = False

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.11/howto/static-files/

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    os.path.join(ROOT_DIR, 'build', 'static'),
]
STATIC_ROOT = os.path.join(BASE_DIR, 'static_files')


# HTTP Security settings

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = int(timedelta(days=365).total_seconds())
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = config('SSL_REDIRECT', default=False, cast=bool)
SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', default=False, cast=bool)
X_FRAME_OPTIONS = 'DENY'

CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = True

SILENCED_SYSTEM_CHECKS = [
    'security.W005',  # Deployed on Heroku and will not have subdomains.
]


# Django Rest Framework

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
    'DATETIME_FORMAT': "%Y-%m-%dT%H:%M:%S",
}


AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    'mozilla_django_oidc.auth.OIDCAuthenticationBackend',
)

# Auth0

OIDC_RP_CLIENT_ID = config('OIDC_RP_CLIENT_ID')
OIDC_RP_CLIENT_SECRET = config('OIDC_RP_CLIENT_SECRET')
OIDC_OP_DOMAIN = config('OIDC_OP_DOMAIN')
OIDC_OP_AUTHORIZATION_ENDPOINT = '%s/authorize' % OIDC_OP_DOMAIN
OIDC_OP_TOKEN_ENDPOINT = '%s/oauth/token' % OIDC_OP_DOMAIN
OIDC_OP_USER_ENDPOINT = '%s/userinfo' % OIDC_OP_DOMAIN
OIDC_STORE_ACCESS_TOKEN = True

LOGIN_URL = reverse_lazy('oidc_authentication_init')
LOGOUT_URL = reverse_lazy('oidc_logout')
LOGIN_REDIRECT_URL = reverse_lazy('index')
LOGOUT_REDIRECT_URL = reverse_lazy('index')
LOGIN_REDIRECT_URL_FAILURE = reverse_lazy('index')


# TODO: Sentry


# Logging

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'dockerflow.logging.JsonLogFormatter',
            'logger_name': 'experiments-viewer',
        },
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(name)s %(message)s',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',  # TODO: Use 'json' for Dockerflow.
        },
        'sentry': {
            'level': 'ERROR',
            'class': 'raven.contrib.django.raven_compat.handlers.SentryHandler',
        },
    },
    'loggers': {
        # TODO: Enable when moving to Dockerflow.
        # 'request.summary': {
        #     'level': 'DEBUG',
        #     'handlers': ['console'],
        #     'propagate': False,
        # },
        'django.db': {
            'level': 'INFO',  # Set to DEBUG to see all the queries.
            'handlers': ['console'],
        },
    }
}
