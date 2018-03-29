import React from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-refetch';
import Sifter from 'sifter';

import Experiment from '../views/Experiment';
import Loading from '../views/Loading';
import Error from '../views/Error';
import URLManager from '../../lib/URLManager';
import { visiblePaginatorMembers, debounce } from '../../lib/utils';


class ExperimentContainer extends React.Component {
    constructor(props) {
        super(props);

        this.urlManager = new URLManager(props.location, props.history);
        this.defaultShowOutliers = false;

        this.fetchedMetricIds = false;
        this.allMetricIds = [];

        // Pagination
        this.initialPage = Number(this.urlManager.getQueryParameter('page')) || 1;
        this.itemsPerPage = 22;
        this.state= {
            pageNumber: this.initialPage,
        };

        this._setSearchPhrase = debounce(this._setSearchPhrase, process.env.REACT_APP_SEARCH_DEBOUNCE_TIME);
    }

    _onPageChange = e => {
        const currentPageNumber = e.selected + 1; // zero-based
        this.urlManager.setQueryParameter('page', currentPageNumber);
        this.setState({ pageNumber: currentPageNumber });
    }

    _onSearch = e => {
        this._setSearchPhrase(e.target.value);
    }

    /**
     * This method is needed to make the debounce function work without the
     * event expiring.
     *
     * http://blog.revathskumar.com/2016/02/reactjs-using-debounce-in-react-components.html
     */
    _setSearchPhrase(searchPhrase) {
        this.setState({ searchPhrase })
    }

    componentWillReceiveProps(nextProps) {
        console.log('nextprops:', nextProps);
        if (this.fetchedMetricIds === false && nextProps.experimentFetch.value.metrics) {
            this.fetchedMetricIds = true;
            this.allMetricIds = nextProps.experimentFetch.value.metrics.map(m => m.id);
        }

        if (nextProps.experimentFetch.fulfilled) {
            const nextMetrics = nextProps.experimentFetch.value.metrics;

            if (!this.props.experimentFetch.fulfilled || nextMetrics !== this.props.experimentFetch.value.metrics) {
                this.setState({ sifter: new Sifter(nextMetrics) });
            }
        }
    }

    componentWillUpdate(nextProps) {
        this.urlManager = new URLManager(nextProps.location, nextProps.history);
    }

    render() {
        const experimentFetch = this.props.experimentFetch;

        if (experimentFetch.pending) {
            return <Loading />;
        } else if (experimentFetch.rejected) {
            return <Error message={experimentFetch.reason.message} />;
        } else if (experimentFetch.fulfilled) {
            let visibleMetricIds = [];
            let searchActive = false;

            if (this.state.sifter && this.state.searchPhrase) {
                const matchedIndices = this.state.sifter.search(this.state.searchPhrase, { fields: ['name'] }).items.map(m => m.id);
                visibleMetricIds = experimentFetch.value.metrics.filter((_, index) => matchedIndices.includes(index)).map(m => m.id);
                searchActive = true;
            } else {
                visibleMetricIds = visiblePaginatorMembers(this.allMetricIds, this.itemsPerPage, this.state.pageNumber);
            }

            return (
                <Experiment
                    id={experimentFetch.value.id}
                    name={experimentFetch.value.name}
                    slug={experimentFetch.value.slug}
                    description={experimentFetch.value.description}
                    authors={experimentFetch.value.authors}
                    populations={experimentFetch.value.populations}
                    showOutliers={this.defaultShowOutliers}
                    selectedMetricId={Number(this.urlManager.getQueryParameter('chart'))}

                    onPageChange={this._onPageChange}
                    onSearch={this._onSearch}
                    initialPage={this.initialPage}
                    itemsPerPage={this.itemsPerPage}
                    numItems={this.allMetricIds.length}
                    visibleMetricIds={visibleMetricIds}
                    searchActive={searchActive}
                />
            );
        }

        return <Error message="Error fetching experiment" />;
    }
}

// Gets us access to props.location and props.history
ExperimentContainer = withRouter(ExperimentContainer);

export default connect(props => {
    const slug = props.match.params.experimentSlug;
    console.log('props:', props);

    return {
        experimentFetch: { url: `${process.env.REACT_APP_API_URL}/experiments/${slug}/` },
    };
})(ExperimentContainer);
