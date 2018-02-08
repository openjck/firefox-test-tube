import React from 'react';

import Chart from '../views/Chart';
import Error from '../views/Error';


export default class extends React.Component {
    constructor(props) {
        super(props);

        // See https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors/
        this.colors = [
            { r: 74, g: 144, b: 226 },
            { r: 230, g: 25, b: 75 },
            { r: 60, g: 180, b: 75 },
            { r: 255, g: 255, b: 25 },
            { r: 245, g: 130, b: 49 },
            { r: 145, g: 30, b: 180 },
            { r: 70, g: 240, b: 240 },
            { r: 250, g: 190, b: 190 },
        ];

        // Outlier constants
        this.outliersThreshold = 10;
        this.outliersSmallestProportion = 0.01;

        this.chartType = this._getChartType(props.type);

        if (this.chartType !== 'unsupported') {
            this.dataPack = this._createDataPack(props.unformattedData, this.chartType);
        }
    }

    /**
     * Return a "data pack". A data pack is an object of data formatted for use
     * with Chart.js, organized by whether or not the data has been trimmed to
     * remove outliers.
     *
     * Example output:
     *
     *     {
     *         all: [...] // Formatted data with all data points present
     *         trimmed: [...] // Formatted data with outlying data points removed
     *     }
     *
     * If a "line type" metric has too few data points, it will be formatted for
     * use as a bar chart instead. this.chartType will also be changed
     * accordingly.
     */
    _createDataPack(data, chartType) {
        const dataPack = {};

        // The minimum number of data points that the biggest population of a
        // "line type" metric must have in order for it to be rendered as a line
        // chart. If the biggest population has fewer than this many data
        // points, it will be rendered as a bar chart instead.
        const minLinePoints = 21;

        if (chartType === 'bar') {
            dataPack.all = this._formatBarData(data);
        } else if (chartType === 'line') {
            if (this._biggestPopulationSize(data) >= minLinePoints) {
                dataPack.all = this._formatLineData(data, true);

                if (this._biggestPopulationSize(data) >= this.outliersThreshold) {
                    dataPack.trimmed = this._formatLineData(data, false);
                }
            } else {
                dataPack.all = this._formatBarData(data, true);
                this.chartType = 'bar';
            }
        }

        return dataPack;
    }

    /**
     * Return the size of the biggest population in a dataset.
     */
    _biggestPopulationSize(data) {
        return Math.max(...data.populations.map(p => p.data.length));
    }

    /**
     * Format metric JSON for use with Chart.js bar charts.
     *
     * @param  data  The raw JSON from /metric/[id]
     */
    _formatLineData = (data, showOutliers) => {
        const formattedData = {
            datasets: [],
        };

        data.populations.forEach((population, index) => {
            const thisColor = this.colors[index];
            const resultData = [];

            // Sort by x-axis value
            population.data.sort((a, b) => {
                return a.x - b.x;
            });

            // The API provides y values as numbers between 0 and 1, but we want
            // to display them as percentages.
            population.data.forEach((dataPoint, index) => {
                resultData.push({x: index, xActualValue: dataPoint.x, y: dataPoint.y * 100});
            });

            formattedData.datasets.push({
                label: population.name,
                data: showOutliers ? resultData : this._removeOutliers(resultData),

                // What d3 calls curveStepBefore
                steppedLine: 'before',

                // Don't color the area below the chart
                fill: false,

                // Line color
                borderColor: `rgba(${thisColor.r}, ${thisColor.g}, ${thisColor.b}, .5)`,

                // Color of this dataset's box in the legend and also the dots
                // in the corresponding line
                backgroundColor: `rgb(${thisColor.r}, ${thisColor.g}, ${thisColor.b})`,

                // Don't show a border for this dataset's box in the legend
                borderWidth: 0,
            });
        });

        return formattedData;
    }

    /**
     * Format metric JSON for use with Chart.js bar charts.
     *
     * @param  data        The raw JSON from /metric/[id]
     * @param  isLineType  True if this metric is technically a "line type," but
     *                     it needs to be rendered as a bar chart anyway. The
     *                     JSON of "line type" metrics is formatted differently
     *                     and need to account for that here.
     */
    _formatBarData = (data, isLineType = false) => {
        const formattedData = {
            datasets: [],
        };

        if (isLineType) {
            formattedData['labels'] = data.populations[0].data.map(dp => dp.x);
        } else {
            formattedData['labels'] = data.categories;
        }

        data.populations.forEach((population, index) => {
            const thisColor = this.colors[index];

            const newDataset = {
                label: population.name,
                backgroundColor: `rgba(${thisColor.r}, ${thisColor.g}, ${thisColor.b}, .5)`,
            };

            if (isLineType) {
                newDataset.data = population.data.map(dp => dp.y);
            } else {
                newDataset.data = population.data;
            }

            formattedData.datasets.push(newDataset);
        });

        return formattedData;
    }

    _getChartType(metricType) {
        const lineTypes = [
            'CountHistogram',
            'EnumeratedHistogram',
            'ExponentialHistogram',
            'LinearHistogram',
            'StringScalar',
            'UintScalar',
        ];

        const barTypes = [
            'BooleanHistogram',
            'BooleanScalar',
            'FlagHistogram',
        ];

        if (lineTypes.includes(metricType)) {
            return 'line';
        } else if (barTypes.includes(metricType)) {
            return 'bar';
        } else {
            return 'unsupported';
        }
    }

    // Return an array with buckets with data less than the
    // `outliersSmallestProportion` trimmed from the right.
    _removeOutliers(data) {
        let indexLast = data.length - 1;
        for (; indexLast >= 0; indexLast--) {
          if (data[indexLast]['y'] > this.outliersSmallestProportion) {
            break;
          }
        }

        // Add 1 because the second paramater to Array.slice is not inclusive.
        return data.slice(0, indexLast + 1);
    }

    render() {
        if (this.chartType === 'unsupported') {
            return <Error message={`Unsupported metric type: ${this.props.type}`} showPageTitle={false} />;
        } else {
            let dataToShow;
            if (this.props.showOutliers === false && this.dataPack.trimmed) {
                dataToShow = this.dataPack.trimmed;
            } else {
                dataToShow = this.dataPack.all;
            }

            return (
                <Chart
                    {...this.props}

                    chartType={this.chartType}
                    data={dataToShow}
                />
            );
        }
    }
}
