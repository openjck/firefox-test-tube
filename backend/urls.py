from django.conf.urls import include, url

from .admin import admin_site
from .api import views as api_views
from .views import IndexView


urlpatterns = [
    # API v2
    url(r'^v2/experiments/$',
        api_views.experiments, name='v2-experiments'),
    url(r'^v2/experiments/(?P<exp_slug>\d+)/$',
        api_views.experiment_by_slug, name='v2-experiment-by-slug'),
    url(r'^v2/experiments/(?P<exp_id>\d+)/metrics/(?P<metric_id>\d+)/$',
        api_views.metric_by_id, name='v2-metric-by-id'),

    # Auth0
    url(r'^accounts/', include('mozilla_django_oidc.urls')),

    # Admin
    url(r'^admin/', admin_site.urls),

    # Send everything else to React
    url(r'.*', IndexView.as_view(), name='index'),
]
