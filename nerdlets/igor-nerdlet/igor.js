import React from 'react';
import PropTypes from 'prop-types';

import DeckGL, {MapController} from '@deck.gl/react';
import { StaticMap, _MapContext as MapContext, NavigationControl } from 'react-map-gl';
import { MapView } from '@deck.gl/core';
import { ColumnLayer } from '@deck.gl/layers';

import {
  navigation,
  Button,
  AccountStorageQuery,
  NerdGraphQuery,
} from 'nr1';

import AccountPicker from './account-picker';
import Donut from '../igor-detail/donut';

export default class Igor extends React.Component {
  static propTypes = {
    launcherUrlState: PropTypes.object,
    nerdletUrlState: PropTypes.object,
    width: PropTypes.number,
    height: PropTypes.number,
  };

  constructor(props) {
    super(props);
    this.state = {
      accountId: null,
      settings: null,
      data: null,
      viewState: {
        longitude: -98.5556199,
        latitude: 39.8097343,
        zoom: 4,
        pitch: 60,
        bearing: 0
      },
      layers: [],
    };

    this.loadData = this.loadData.bind(this);
    this.queryData = this.queryData.bind(this);
    this.openAdmin = this.openAdmin.bind(this);
    this.accountChange = this.accountChange.bind(this);
  }

  componentDidMount() {}

  openAdmin() {
    const { accountId } = this.state;

    navigation.openStackedNerdlet({
      id: 'igor-admin',
      urlState: {
        accountId: accountId
      }
    });
  }

  accountChange(account) {
    this.setState({
      accountId: account.id
    }, () => this.loadData());
  }

  async loadData() {
    const { accountId } = this.state;

    const res = await AccountStorageQuery.query({
        accountId: accountId,
        collection: 'IgorDB',
    });

    const docs = (res || {}).data || [];
    const o = docs.reduce((a, d) => {
      a[d.id] = d.document;
      return a;
    }, {});

    this.setState(o, () => (!('settings' in o) || !('data' in o)) ? this.openAdmin() : this.queryData());
  }

  async queryData() {
    const { accountId, data } = this.state;

    const [queries, locs] = Object.keys(data).reduce((a, c, i) => {
      let loc = data[c];
      if ('attribute' in loc && 'values' in loc) {
        a[0].push(`q${i}: nrql(query: "${this.nrql(loc.attribute, loc.values)}") {results}`);
        a[1][`q${i}`] = {
          coords: [loc.lng, loc.lat],
          name: c,
          attrib: loc.attribute,
          values: loc.values,
        };
      }
      return a;
    }, [[], {}]);

    const gql = `{actor {account(id: ${accountId}) { ${queries.join(' ')} }}}`;
    const res = await NerdGraphQuery.query({query: gql});
    const results = ((((res || {}).data || {}).actor || {}).account || {});

    const mapData = Object.keys(locs).map(l => {
      if (l in results) {
        return results[l].results.reduce((a, r) => Object.assign(r, locs[l]), {});
      }
      else return [];
    })

    const defaultAttribs = {
      data: mapData,
      diskResolution: 6,
      radius: 10000,
      extruded: true,
      pickable: true,
      elevationScale: 100,
      getPosition: d => d.coords,
      onHover: info => this.setState({
        hoveredObject: info.object,
        pointerX: info.x,
        pointerY: info.y
      }),
      onClick: info => navigation.openStackedNerdlet({
        id: 'igor-detail',
        urlState: {
          clickedObject: info.object
        }
      })
    }

    const layers = [
      new ColumnLayer({
        ...defaultAttribs,
        id: 'maxProcLayer',
        offset: [-2, 0],
        getElevation: d => d['max.cpuPercent']*100,
        getFillColor: d => this.colorByPercent(d['max.cpuPercent']),
      }),
      new ColumnLayer({
        ...defaultAttribs,
        id: 'maxMemLayer',
        offset: [0, 0],
        getElevation: d => d['max.memoryUsedPercent']*100,
        getFillColor: d => this.colorByPercent(d['max.memoryUsedPercent']),
      }),
      new ColumnLayer({
        ...defaultAttribs,
        id: 'maxDiskLayer',
        offset: [2, 0],
        getElevation: d => d['max.diskUsedPercent']*100,
        getFillColor: d => this.colorByPercent(d['max.diskUsedPercent']),
      }),
    ];

    this.setState({
      layers: layers
    });
  }

  nrql(attrib, locs) {
    let _locs = `'` + locs.join(`','`) + `'`;
    return `SELECT max(cpuPercent), max(diskUsedPercent), max((memoryUsedBytes/memoryTotalBytes)*100) AS 'max.memoryUsedPercent' FROM SystemSample WHERE ${attrib} IN (${_locs})`;
  }

  colorByPercent(pct, isString) {
    let r = pct>50 ? 255 : Math.floor((pct*2)*255/100);
    let g = pct<50 ? 255 : Math.floor(255-(pct*2-100)*255/100);
    return (isString) ? 'rgb('+r+', '+g+', 0)' : [r, g, 0 ];
  }

  percentFormatter(pct) {
    return new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 }).format(pct/100);
  }

  render() {
    const { settings, data, viewState, layers, hoveredObject, pointerX, pointerY } = this.state;

    return (
      <div className="container">
        <div style={{zIndex: '1', position: 'absolute', padding: '1em'}}>
          <div>
            <AccountPicker onChange={this.accountChange} />
            <Button
              type={Button.TYPE.NORMAL}
              sizeType={Button.SIZE_TYPE.SMALL}
              iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__CONFIGURE}
              onClick={this.openAdmin}
              style={{marginLeft: '.5em'}} />
          </div>
        </div>
        <DeckGL viewState={viewState} layers={layers} controller={MapController} ContextProvider={MapContext.Provider} onViewStateChange={({viewState}) => this.setState({viewState})}>
          {settings && 'mapboxAccessToken' in settings &&
            <MapView id="map" controller={true}>
              <StaticMap mapboxApiAccessToken={settings.mapboxAccessToken}>
                <div className='mapboxgl-ctrl-top-right'>
                  <NavigationControl showCompass={false} />
                </div>
              </StaticMap>
            </MapView>
          }
        </DeckGL>
        {hoveredObject && (
          <div className="tooltip" style={{position: 'absolute', zIndex: 1, left: pointerX, top: pointerY}}>
            <div>Max Used Percent for <span style={{fontWeight: '600'}}>{hoveredObject.name}</span></div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 6em)'}}>
              <div className="cell" style={{height: '3em'}}>
                <Donut percent={this.percentFormatter(hoveredObject['max.cpuPercent'])} />
              </div>
              <div className="cell" style={{height: '3em'}}>
                <Donut percent={this.percentFormatter(hoveredObject['max.memoryUsedPercent'])} />
              </div>
              <div className="cell" style={{height: '3em'}}>
                <Donut percent={this.percentFormatter(hoveredObject['max.diskUsedPercent'])} />
              </div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 6em)'}}>
              <div className="cell">CPU</div>
              <div className="cell">Memory</div>
              <div className="cell">Disk</div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
