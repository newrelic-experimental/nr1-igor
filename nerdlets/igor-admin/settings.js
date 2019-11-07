import React from 'react';
import PropTypes from 'prop-types';

import {
  TextField,
  Button,
  AccountStorageMutation,
} from 'nr1';

import InfoBar from './info-bar';

export default class Settings extends React.Component {
  static propTypes = {
    settings: PropTypes.object,
    accountId: PropTypes.number,
    onUpdate: PropTypes.func,
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

  saveHandler(attr) {
    const { settings, accountId, onUpdate } = this.props;

    const o = {};
    o[attr] = this.state[attr];

    AccountStorageMutation.mutate({
        accountId: accountId,
        actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
        collection: 'IgorDB',
        documentId: 'settings',
        document: Object.assign((settings || {}), o),
    }).then(res => {
      if (!('error' in res)) {
        o[attr] = '';
        this.setState(o, () => (onUpdate) ? onUpdate() : null);
      }
    });
  }

  render() {
    const { mapboxAccessToken } = this.state;
    const { settings } = this.props;

    return (
      <div className="col">
        Add <a href="https://docs.mapbox.com/help/glossary/access-token/" target="_blank">Mapbox Access Token</a>
        {settings && 'mapboxAccessToken' in settings && <InfoBar info="Mapbox Access Token has already been set. Adding a new one will overwrite the existing setting.  " />}
        <div className="form-element">
          <TextField label="Mapbox Access Token" placeholder="ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890" value={mapboxAccessToken} onChange={e => this.textChange(e.target.value, 'mapboxAccessToken')} />
        </div>
        <div className="form-element">
          <Button type={Button.TYPE.NORMAL} iconType={Button.ICON_TYPE.INTERFACE__SIGN__CHECKMARK} onClick={e => this.saveHandler('mapboxAccessToken')}>
            Save
          </Button>
        </div>
      </div>
    );
  }
}
