import React from 'react';
import PropTypes from 'prop-types';

import {
  Icon,
  Button,
  AccountStorageMutation,
} from 'nr1';

import ReactMapGL, {NavigationControl} from 'react-map-gl';

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
      mapDefaultsLongitude: ((props.settings || {}).mapDefaults || {}).longitude || '-98.5556199',
      mapDefaultsLatitude: ((props.settings || {}).mapDefaults || {}).latitude || '39.8097343',
      mapDefaultsZoom: ((props.settings || {}).mapDefaults || {}).zoom || '4',
      mapDefaultsPitch: ((props.settings || {}).mapDefaults || {}).pitch || '60',
      mapDefaultsBearing: ((props.settings || {}).mapDefaults || {}).bearing || '0',
    };

    this.textChange = this.textChange.bind(this);
    this.saveHandler = this.saveHandler.bind(this);
    this.resetDefauls = this.resetDefauls.bind(this);
    this.updateViewport = this.updateViewport.bind(this);
  }

  textChange(txt, attr) {
    const o = {};
    o[attr] = txt;
    this.setState(o);
  }

  async saveHandler(attr) {
    const { mapboxAccessToken, mapDefaultsLongitude, mapDefaultsLatitude, mapDefaultsZoom, mapDefaultsPitch, mapDefaultsBearing } = this.state;
    const { settings, accountId, onChange } = this.props;

    let o = {};
    o[attr] = (attr === 'mapDefaults')
    ? {
      longitude: mapDefaultsLongitude,
      latitude: mapDefaultsLatitude,
      zoom: mapDefaultsZoom,
      pitch: mapDefaultsPitch,
      bearing: mapDefaultsBearing,
    }
    : this.state[attr];

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

  resetDefauls() {
    const { settings } = this.props;

    this.setState({
      mapDefaultsLongitude: ((settings || {}).mapDefaults || {}).longitude || '-98.5556199',
      mapDefaultsLatitude: ((settings || {}).mapDefaults || {}).latitude || '39.8097343',
      mapDefaultsZoom: ((settings || {}).mapDefaults || {}).zoom || '4',
      mapDefaultsPitch: ((settings || {}).mapDefaults || {}).pitch || '60',
      mapDefaultsBearing: ((settings || {}).mapDefaults || {}).bearing || '0',
    }, () => this.saveHandler('mapDefaults'));
  }

  updateViewport(v) {
    const {latitude, longitude, zoom, bearing, pitch} = v;
    this.setState({
      mapDefaultsLatitude: latitude.toString(),
      mapDefaultsLongitude: longitude.toString(),
      mapDefaultsZoom: zoom.toString(),
      mapDefaultsBearing: bearing.toString(),
      mapDefaultsPitch: pitch.toString(),
    });
  }

  render() {
    const { mapboxAccessToken, mapDefaultsLongitude, mapDefaultsLatitude, mapDefaultsZoom, mapDefaultsPitch, mapDefaultsBearing } = this.state;
    const { settings } = this.props;

    const formStyle = {
      font: '1.5em Inconsolata, monospace',
      border: '1px solid #e3e4e4',
      padding: '.5em',
      borderRadius: '.25em'
    };

    return (
      <div>
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
        {settings && 'mapboxAccessToken' in settings &&
          <div className="cols bound" style={{gridTemplateColumns: '1fr 5fr'}}>
            <div className="col" style={{margin: '1em'}}>
              <div className="summary">
                <span className="title">Map Defaults</span>
                Set default values for the <a href="https://docs.mapbox.com/help/glossary/camera/" target="_blank">camera</a>. These are the settings used when the map first loads.
              </div>
              <div className="field">
                <label htmlFor="map-defaults-longitude" className="label">longitude</label>
                <input
                  id="map-defaults-longitude"
                  className="input"
                  type="number"
                  placeholder="-98.5556199"
                  min="-180"
                  max="180"
                  value={mapDefaultsLongitude}
                  onChange={e => this.textChange(e.target.value, 'mapDefaultsLongitude')}
                  style={formStyle}/>
              </div>
              <div className="field">
                <label htmlFor="map-defaults-latitude" className="label">latitude</label>
                <input
                  id="map-defaults-latitude"
                  className="input"
                  type="number"
                  placeholder="39.8097343"
                  min="-90"
                  max="90"
                  value={mapDefaultsLatitude}
                  onChange={e => this.textChange(e.target.value, 'mapDefaultsLatitude')}
                  style={formStyle}/>
              </div>
              <div className="field">
                <label htmlFor="map-defaults-zoom" className="label">zoom</label>
                <input
                  id="map-defaults-zoom"
                  className="input"
                  type="number"
                  placeholder="4"
                  min="0"
                  max="22"
                  step="1"
                  value={mapDefaultsZoom}
                  onChange={e => this.textChange(e.target.value, 'mapDefaultsZoom')}
                  style={formStyle}/>
              </div>
              <div className="field">
                <label htmlFor="map-defaults-pitch" className="label">pitch</label>
                <input
                  id="map-defaults-pitch"
                  className="input"
                  type="number"
                  placeholder="60"
                  min="0"
                  max="60"
                  step="1"
                  value={mapDefaultsPitch}
                  onChange={e => this.textChange(e.target.value, 'mapDefaultsPitch')}
                  style={formStyle}/>
              </div>
              <div className="field">
                <label htmlFor="map-defaults-bearing" className="label">bearing</label>
                <input
                  id="map-defaults-bearing"
                  className="input"
                  type="number"
                  placeholder="0"
                  min="0"
                  max="360"
                  step="1"
                  value={mapDefaultsBearing}
                  onChange={e => this.textChange(e.target.value, 'mapDefaultsBearing')}
                  style={formStyle}/>
              </div>
              <Button
                type={Button.TYPE.NORMAL}
                style={{marginRight: '1em'}}
                onClick={e => this.saveHandler('mapDefaults')}>
                Save
              </Button>
              <Button
                type={Button.TYPE.PLAIN}
                onClick={this.resetDefauls}>
                Reset
              </Button>
            </div>
            <div className="col" style={{marginRight: '1em'}}>
              <ReactMapGL
                mapboxApiAccessToken={settings.mapboxAccessToken}
                width={'100%'}
                height={'100%'}
                latitude={parseFloat(mapDefaultsLatitude) || 0}
                longitude={parseFloat(mapDefaultsLongitude) || 0}
                zoom={parseFloat(mapDefaultsZoom) || 0}
                bearing={parseFloat(mapDefaultsBearing) || 0}
                pitch={parseFloat(mapDefaultsPitch) || 0}
                onViewportChange={viewport => this.updateViewport(viewport)}>
                <div style={{position: 'absolute', top: '.5em', right: '.5em'}}>
                  <NavigationControl />
                </div>
              </ReactMapGL>
            </div>
          </div>
        }
      </div>
    );
  }
}
