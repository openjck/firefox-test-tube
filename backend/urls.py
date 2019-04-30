from django.urls import include, path, re_path

from .api import views as api_views


urlpatterns = [
    # API v2
    path('v2/experiments/',
         api_views.experiments, name='v2-experiments'),
    path('v2/experiments/<slug:exp_slug>/',
         api_views.experiment_by_slug, name='v2-experiment-by-slug'),
    path('v2/experiments/<slug:exp_slug>/realtime-populations/',
         api_views.realtime_experiment_populations,
         name='v2-experiment-realtime-populations'),
    path('v2/experiments/<slug:exp_slug>/populations/',
         api_views.experiment_populations, name='v2-experiment-populations'),
    path('v2/experiments/<slug:exp_slug>/realtime-enrolls/',
         api_views.realtime_experiment_enrolls, name='v2-experiment-realtime-enrolls'),
    path('v2/experiments/<slug:exp_slug>/realtime-unenrolls/',
         api_views.realtime_experiment_unenrolls, name='v2-experiment-realtime-unenrolls'),
    path('v2/experiments/<slug:exp_slug>/enrolls/',
         api_views.experiment_enrolls, name='v2-experiment-enrolls'),
    path('v2/experiments/<slug:exp_slug>/unenrolls/',
         api_views.experiment_unenrolls, name='v2-experiment-unenrolls'),
    path('v2/enrollment/', api_views.enrollment, name='v2-enrollment'),

    # Auth0
    path('accounts/', include('mozilla_django_oidc.urls')),
]
