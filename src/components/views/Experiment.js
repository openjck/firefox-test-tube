import React from 'react';
import gravatar from 'gravatar';

import MetricContainer from '../containers/MetricContainer';
import Paginator from './Paginator';
import Switch from './Switch';

import { Input } from 'antd';

import './css/Experiment.css';

export default class extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showOutliers: props.showOutliers,
        };
    }

    getCountDL(populations, accessor) {
        const termGroups = [];
        let total = 0;

        for (const populationName in populations) {
            if (populations.hasOwnProperty(populationName)) {

                const count = populations[populationName][accessor];
                total += count;

                // Apparently wrapping a <dt> and <dd> pair in a <div> is valid. And
                // it helps with styling.
                // https://github.com/whatwg/html/pull/1945
                termGroups.push(
                    <div key={populationName}>
                        <dt>{populationName}</dt>
                        <dd>{count.toLocaleString('en-US')}</dd>
                    </div>
                );

            }
        }

        termGroups.push(
            <div key='total'>
                <dt>Total</dt>
                <dd>{total.toLocaleString('en-US')}</dd>
            </div>
        );

        return <dl>{termGroups}</dl>;
    }

    getGravatarURL(email) {
        return gravatar.url(email, {
            default: 'mm',
            rating: 'g',
            size: '100',
        });
    }

    render() {
        let maybeMetricOverlay = null;
        if (this.props.selectedMetricId !== undefined && this.props.visibleMetricIds.includes(this.props.selectedMetricId)) {
            maybeMetricOverlay = (
              <MetricContainer
                  experimentId={this.props.id}
                  id={this.props.selectedMetricId}
                  asOverlay={true}
              />
            );
        }

        let maybeDescription = null;
        if (this.props.description) {
            maybeDescription = (
                <section id="experiment-description">
                    <h4>Description</h4>
                    <p>{this.props.description}</p>
                </section>
            );
        }

        let maybeAuthors = null;
        if (this.props.authors.length) {
            maybeAuthors = (
                <section id="experiment-authors">
                    <h4>Authors</h4>
                    <ul>
                        {this.props.authors.map((contact, index) => (
                            <li key={index}>
                                <a href={`mailto:${contact.email}`}>
                                    <img src={this.getGravatarURL(contact.email)} alt={contact.name} />
                                    <span>{contact.name}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
            );
        }

        return (
            <div>
                <article id="experiment">
                    <h2>{this.props.name || this.props.slug}</h2>
                    <section id="experiment-details" className={maybeDescription ? 'with-description' : 'without-description'}>
                        <h3>Details</h3>
                        {maybeDescription}
                        <section id="experiment-counts">
                            <h4>Counts</h4>
                            <section id="experiment-client-counts">
                                <h5>Clients</h5>
                                {this.getCountDL(this.props.populations, 'total_clients')}
                            </section>
                            <section id="experiment-ping-counts">
                                <h5>Pings</h5>
                                {this.getCountDL(this.props.populations, 'total_pings')}
                            </section>
                        </section>
                        {maybeAuthors}
                    </section>
                    <aside id="experiment-options">
                        <h3>Options</h3>
                        <Input.Search placeholder="Search..." onKeyUp={this.props.onSearch} />
                        <Switch
                            active={this.state.showOutliers}
                            label="show outliers"
                            onClick={evt => {
                                this.setState({showOutliers: !this.state.showOutliers});
                            }}
                        />
                    </aside>
                    <section id="experiment-metrics">
                        <h3>Metrics</h3>
                        {this.props.visibleMetricIds.map(id => (
                            <MetricContainer
                                key={id}
                                experimentId={this.props.id}
                                id={id}
                                showOutliers={this.state.showOutliers}
                            />
                        ))}
                    </section>
                    <Paginator
                        initialPage={this.props.initialPage - 1}
                        pageCount={Math.ceil(this.props.numItems / this.props.itemsPerPage)}
                        onPageChange={this.props.onPageChange}
                    />
                </article>
                {maybeMetricOverlay}
            </div>
        );
    }
}
