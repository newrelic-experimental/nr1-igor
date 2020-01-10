import React from 'react';
import PropTypes from 'prop-types';

export default class Donut extends React.Component {
  static propTypes = {
    percent: PropTypes.string
  };

  constructor(props) {
    super(props);
  }

  colorByPercent(pct, isString) {
    const r = pct > 50 ? 255 : Math.floor((pct * 2 * 255) / 100);
    const g = pct < 50 ? 255 : Math.floor(255 - ((pct * 2 - 100) * 255) / 100);
    return isString ? `rgb(${r}, ${g}, 0)` : [r, g, 0];
  }

  render() {
    const { percent } = this.props;

    const pct = parseFloat(percent);

    const dashArray = [pct, 100 - pct].join(' ');

    return (
      <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
        <circle
          className="donut-hole"
          cx="21"
          cy="21"
          r="15.91549430918954"
          fill="#fff"
        />
        <circle
          className="donut-ring"
          cx="21"
          cy="21"
          r="15.91549430918954"
          fill="transparent"
          stroke="#d2d3d4"
          strokeWidth="3"
        />
        <circle
          className="donut-segment"
          cx="21"
          cy="21"
          r="15.91549430918954"
          fill="transparent"
          stroke={this.colorByPercent(pct, true)}
          strokeWidth="3"
          strokeDasharray={dashArray}
          strokeDashoffset="25"
        />
        <text x="50%" y="50%" className="chart-label">
          {percent}
        </text>
      </svg>
    );
  }
}
