import React from 'react';

import Chart from '../views/Chart';
import Error from '../views/Error';


export default class extends React.Component {
    constructor(props) {
        super(props);

        this.chartType = this._getChartType(props.type);

        if (this.chartType !== 'unsupported') {
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

            this.formattedData = this._formatData(props.unformattedData, this.chartType);

            // Set the min and max x values that should be shown when outliers
            // are hidden
            if (this.chartType === 'line' && this._biggestPopulationSize(props.unformattedData) > this.outliersThreshold) {
                this.trimmedMinX = this._getTrimmedMinX(this.formattedData);
                this.trimmedMaxX = this._getTrimmedMaxX(this.formattedData);
            }
        }
    }

    /**
     * Format data for use in Chart.js.
     *
     * If a "line type" metric has too few data points, it will be formatted for
     * use as a bar chart instead. this.chartType will also be changed
     * accordingly.
     */
    _formatData(data, chartType) {
        // The minimum number of data points that the biggest population of a
        // "line type" metric must have in order for it to be rendered as a line
        // chart. If the biggest population has fewer than this many data
        // points, it will be rendered as a bar chart instead.
        const minLinePoints = 21;

        let dataFormattingMethod;

        if (chartType === 'bar') {
            dataFormattingMethod = this._formatBarData;
        } else if (chartType === 'line') {
            if (this._biggestPopulationSize(data) >= minLinePoints) {
                dataFormattingMethod = this._formatLineData;
            } else {
                dataFormattingMethod = data => this._formatBarData(data, true);
                this.chartType = 'bar';
            }
        }

        return dataFormattingMethod(data);
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
    _formatLineData = data => {
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
                resultData.push({x: index, xActualValue: Number(dataPoint.x), y: dataPoint.y * 100});
            });

            formattedData.datasets.push({
                label: population.name,
                data: resultData,

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

    _getTrimmedMinX(data) {
        let smallestValue;
        let indexOfSmallestValue;
        data.datasets.forEach(population => {
            population.data.forEach((dataPoint, index) => {
                if (!smallestValue || dataPoint.xActualValue < smallestValue) {
                    smallestValue = xActualValue;
                    indexOfSmallestValue = index;1
                }
            });
        });





        const smallestXValue = Math.min(...data.datasets.map(ds => Math.min(...ds.data.map(dp => dp.xActualValue))));
        return smallestXValue + (smallestXValue * this.outliersSmallestProportion);
    }

    _getTrimmedMaxX(data) {
        const biggestXValue = Math.max(...data.datasets.map(ds => Math.max(...ds.data.map(dp => dp.xActualValue))));
        return biggestXValue - (biggestXValue * (1 - this.outliersSmallestProportion));
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
            const extraProps = {};
            if (this.props.showOutliers === false) {
                extraProps.minX = this.trimmedMinX;
                extraProps.maxX = this.trimmedMaxX;
            }

            return (
                <Chart
                    {...this.props}

                    chartType={this.chartType}
                    data={this.formattedData}

                    {...extraProps}
                />
            );
        }
    }
}
