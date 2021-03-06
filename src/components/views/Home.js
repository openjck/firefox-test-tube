import React from 'react';

import ExperimentsTableContainer from '../containers/ExperimentsTableContainer';

import './css/Home.css';


export default props => {
    const activeExperiments = props.experiments.filter(e => e.enabled === true);
    const completedExperiments = props.experiments.filter(e => e.enabled === false);

    let maybeActiveSection = null;
    if (activeExperiments.length) {
        maybeActiveSection = (
            <section id="active-experiments" className="experiments">
                <h2>Active experiments</h2>
                <ExperimentsTableContainer experiments={activeExperiments} />
            </section>
        );
    }

    let maybeCompletedSection = null;
    if (completedExperiments.length) {
        maybeCompletedSection = (
            <section id="completed-experiments" className="experiments">
                <h2>Completed experiments</h2>
                <ExperimentsTableContainer experiments={completedExperiments} />
            </section>
        );
    }

    return (
        <article id="home">
            {maybeActiveSection}
            {maybeCompletedSection}
        </article>
    );
};
