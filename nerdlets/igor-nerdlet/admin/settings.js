import React from 'react';
import PropTypes from 'prop-types';

import {
  Icon,
  Button,
  AccountStorageMutation,
} from 'nr1';

export default class Settings extends React.Component {
  static propTypes = {
    settings: PropTypes.object,
    accountId: PropTypes.number,
    onChange: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      mapboxAccessToken: '',
    };

    this.textChange = this.textChange.bind(this);
    this.saveHandler = this.saveHandler.bind(this);
  }

  textChange(txt, attr) {
    const o = {};
    o[attr] = txt;
    this.setState(o);
  }

  async saveHandler(attr) {
    const { settings, accountId, onChange } = this.props;

    let o = {};
    o[attr] = this.state[attr];

    let _settings = Object.assign((settings || {}), o);

    const res = await AccountStorageMutation.mutate({
        accountId: accountId,
        actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
        collection: 'IgorDB',
        documentId: 'settings',
        document: _settings,
    });

    if (!('error' in res)) {
      if (onChange) onChange('settings', _settings);
      this.setState({
        mapboxAccessToken: ''
      });
    }
  }

  render() {
    const { mapboxAccessToken } = this.state;
    const { settings } = this.props;

    const formStyle = {
      font: '1.5em Inconsolata, monospace',
      border: '1px solid #e3e4e4',
      padding: '.5em',
      borderRadius: '.25em'
    };

    return (
      <div className="field">
        <label htmlFor="mapbox-access-token" className="label">Mapbox Access Token</label>
        {settings && 'mapboxAccessToken' in settings &&
          <div className="message info">
            <Icon type={Icon.TYPE.INTERFACE__SIGN__CHECKMARK} style={{color: '#0288d1', marginRight: '.2em'}} />
            Mapbox Access Token has already been set. Adding a new token will overwrite the existing one.
          </div>
        }
        <input
          autoFocus
          id="mapbox-access-token"
          className="input"
          type="text"
          placeholder="ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
          value={mapboxAccessToken}
          onChange={e => this.textChange(e.target.value, 'mapboxAccessToken')}
          style={formStyle}/>
        <div className="hint">
          Add a <a href="https://docs.mapbox.com/help/glossary/access-token/" target="_blank">Mapbox Access Token</a>, which is required to display the map.
        </div>
        <Button
          type={Button.TYPE.NORMAL}
          iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS__V_ALTERNATE}
          onClick={e => this.saveHandler('mapboxAccessToken')}>
          Add
        </Button>
      </div>
    );
  }
}
