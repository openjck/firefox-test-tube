import React from 'react';
import { Link } from 'react-router-dom';
import dateFormat from 'dateformat';

import Paginator from './Paginator';
import SearchBox from './SearchBox';

import './css/ExperimentsTable.css';


export default props => {
    let maybePaginator = null;
    if (!props.searchActive) {
        maybePaginator = (
            <Paginator
                initialPage={props.initialPage - 1} // zero-based
                pageCount={Math.ceil(props.numItems / props.itemsPerPage)}
                onPageChange={props.onPageChange}
            />
        );
    }

    return (
        <div className="experiments-table-container">
            <SearchBox onKeyUp={props.onSearch} />
            <table className="experiments-table">
                <colgroup>
                    <col className="experiment-name" />
                    <col className="experiment-creation-date" />
                </colgroup>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Creation date</th>
                    </tr>
                </thead>
                <tbody>
                    {props.visibleExperiments.map((e, index) => (
                        <tr key={index}>
                            <td><Link to={`/experiments/${e.slug}/`}>{e.name || e.slug}</Link></td>
                            <td>{e.creationDate && dateFormat(e.creationDate, 'longDate', true)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {maybePaginator}
        </div>
    );
}
