import React from 'react';
import PropTypes from 'prop-types';

import {
  Icon,
} from 'nr1';

export default class InfoBar extends React.Component {
  static propTypes = {
    info: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { info } = this.props;

    return (
      <div className="info-bar">
        <div className="info-bar-icon">
          <Icon type={Icon.TYPE.INTERFACE__INFO__INFO} />
        </div>
        <div className="info-bar-text">
          {info.split('\n').map((l, i) => (
            <span key={i}>
              {l}
              <br/>
            </span>
          ))}
        </div>
      </div>
    );
  }
}
