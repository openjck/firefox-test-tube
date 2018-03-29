from django.db.models import F
from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from .models import Collection, DataSet, Metric


@api_view(['GET'])
def experiments(request):
    datasets = (
        DataSet.objects.visible()
                       .order_by(F('created_at').desc(nulls_last=True))
    )
    data = []
    for d in datasets:
        data.append({
            'id': d.id,
            'slug': d.slug,
            'name': d.name,
            'enabled': d.enabled,
            'creationDate': d.created_at.date().isoformat() if d.created_at else None,
        })

    return Response({'experiments': data})


@api_view(['GET'])
def experiment_by_slug(request, exp_slug):
    try:
        dataset = DataSet.objects.visible().get(slug=exp_slug)
    except DataSet.DoesNotExist:
        raise NotFound('No experiment with given slug found.')

    data = {
        'id': dataset.id,
        'name': dataset.name,
        'description': '',  # TODO
        'authors': [],
        'populations': dataset.get_populations(),
        'subgroups': dataset.get_subgroups(),
        'metrics': dataset.get_metrics(),
    }
    return Response(data)


@api_view(['GET'])
def metric_by_id(request, exp_id, metric_id):
    metric = Metric.objects.get(id=metric_id)
    # TODO: Add subgroups.
    pops = Collection.objects.filter(dataset=exp_id,
                                     metric=metric_id,
                                     subgroup='All').order_by('population')

    populations = []
    for p in pops:
        if metric.type == 'UintScalar':
            populations.append({
                'name': p.population,
                'n': p.num_observations,
                'data': [
                    dict(x=d.bucket,
                         y=round(d.proportion, 16),
                         count=d.count) for d in p.hdr()
                ]
            })
        else:
            populations.append({
                'name': p.population,
                'n': p.num_observations,
                'data': [
                    dict(x=d.bucket,
                         y=round(d.proportion, 16),
                         count=d.count) for d in p.points()]
            })

    data = {
        'id': metric.id,
        'name': metric.name,
        'description': metric.description,
        'type': metric.type,
        'units': {'x': metric.units},
        'populations': populations,
    }

    return Response(data)
