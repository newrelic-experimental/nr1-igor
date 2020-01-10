import React from 'react';
import PropTypes from 'prop-types';

import { Icon } from 'nr1';

export default class Modal extends React.Component {
  static propTypes = {
    height: PropTypes.number,
    width: PropTypes.number,
    onClose: PropTypes.func,
    children: PropTypes.node
  };

  constructor(props) {
    super(props);

    this.modalSize = { width: 0, height: 0 };
    this.modalContent = React.createRef();
    this.handleClose = this.handleClose.bind(this);
  }

  handleClose(e) {
    e.preventDefault();

    const { onClose } = this.props;
    if (onClose) onClose();
  }

  render() {
    const { height, width, children } = this.props;

    const modalContentStyle = {
      height: height || '90%',
      width: width || '90%'
    };

    return (
      <div className="modal-window">
        <div
          className="modal-content"
          ref={this.modalContent}
          style={modalContentStyle}
        >
          <a href="#" onClick={this.handleClose}>
            <Icon
              type={Icon.TYPE.INTERFACE__SIGN__TIMES}
              className="modal-close"
            />
          </a>
          {children}
        </div>
      </div>
    );
  }
}
