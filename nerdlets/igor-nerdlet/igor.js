import React from 'react';
import PropTypes from 'prop-types';

import DeckGL, {MapController} from '@deck.gl/react';
import { StaticMap, _MapContext as MapContext, NavigationControl } from 'react-map-gl';
import { MapView } from '@deck.gl/core';
import { ColumnLayer } from '@deck.gl/layers';

import {
  navigation,
  Icon,
  Button,
  AccountStorageQuery,
  NerdGraphQuery,
} from 'nr1';

import AccountPicker from './account-picker';
import Detail from './detail';
import Donut from './donut';
import Modal from './modal';
import Admin from './admin/';

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
      showAdmin: false,
    };

    this.loadData = this.loadData.bind(this);
    this.setupQueries = this.setupQueries.bind(this);
    this.queryData = this.queryData.bind(this);
    this.openAdmin = this.openAdmin.bind(this);
    this.dataChanged = this.dataChanged.bind(this);
    this.accountChange = this.accountChange.bind(this);
    this.modalClose = this.modalClose.bind(this);
  }

  componentWillUnmount() {
    const { queryTimer } = this.state;
    if (queryTimer) clearInterval(queryTimer);
  }

  openAdmin() {
    this.setState({showAdmin: true});
  }

  accountChange(account) {
    this.setState({
      accountId: account.id
    }, () => this.loadData());
  }

  modalClose() {
    this.setState({
      clickedObject: null,
      showAdmin: false,
    });
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

    //this.setState(o, () => (!('settings' in o) || !('data' in o)) ? this.openAdmin() : this.setupQueries());
    this.setState(o, () => ('settings' in o && 'data' in o) ? this.setupQueries() : null)
  }

  setupQueries() {
    const { data, queryTimer } = this.state;

    const nrql = `
      SELECT
        max(cpuPercent),
        max(diskUsedPercent),
        max((memoryUsedBytes/memoryTotalBytes)*100) AS 'max.memoryUsedPercent'
      FROM SystemSample
      SINCE 2 minutes ago`;

    const [queries, locs] = Object.keys(data).reduce((a, c, i) => {
      let loc = data[c];
      if ('attribute' in loc && 'values' in loc) {
        a[0].push(`q${i}: nrql(query: "${nrql.replace(/\s\s+/g, ' ')} WHERE ${loc.attribute} IN ('${loc.values.join('\',\'')}')") {results}`);
        a[1][`q${i}`] = {
          coords: [loc.lng, loc.lat],
          name: c,
          attrib: loc.attribute,
          values: loc.values,
        };
      }
      return a;
    }, [[], {}]);

    if (queryTimer) clearInterval(queryTimer);

    this.setState({
      queries: queries,
      locs: locs,
      queryTimer: setInterval(this.queryData, 60000)
    }, () => this.queryData());
  }

  async queryData() {
    const { querying, queryTimer, accountId, queries, locs } = this.state;

    if (querying || !queries || !queries.length) return;

    this.setState({
      querying: true
    });

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
      onHover: o => this.setState({
        pointerX: o.x,
        pointerY: o.y,
        hoveredIndex: o.index
      }),
      onClick: o => this.setState({
        clickedObject: o.object,
      }),
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
      mapData: mapData,
      layers: layers,
      querying: false,
    });
  }

  dataChanged(type, data) {
    let o = {};
    o[type] = data;
    this.setState(o, () => this.loadData());
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
    const { accountId, settings, data, viewState, mapData, layers, hoveredIndex, pointerX, pointerY, clickedObject, showAdmin } = this.state;
    const { launcherUrlState } = this.props;

    const hoveredObject = (hoveredIndex > -1) ? mapData[hoveredIndex] : null;

    return (
      <div className="container">
        {(!settings || !('mapboxAccessToken' in settings)) &&
          <div className="intro">
            <div>
              <h1>Welcome to I.G.O.R. - Infra Geo Ops Reporter!</h1>
              In order to use IGOR you need to set it up.<br/>
              Click on the <Icon type={Icon.TYPE.INTERFACE__OPERATIONS__CONFIGURE} style={{margin: '.1em'}} /> button on the top right, to get started.
            </div>
          </div>
        }
        <div className="panel">
          <div>
            <AccountPicker onChange={this.accountChange} />
            <Button
              type={Button.TYPE.NORMAL}
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
            <div className="cells">
              <div className="cell">
                <div>
                  <Donut percent={this.percentFormatter(hoveredObject['max.cpuPercent'])} />
                </div>
                <span>CPU</span>
              </div>
              <div className="cell">
                <div>
                  <Donut percent={this.percentFormatter(hoveredObject['max.memoryUsedPercent'])} />
                </div>
                <span>Memory</span>
              </div>
              <div className="cell">
                <div>
                  <Donut percent={this.percentFormatter(hoveredObject['max.diskUsedPercent'])} />
                </div>
                <span>Disk</span>
              </div>
            </div>

          </div>
        )}
        {clickedObject && (
          <Modal onClose={this.modalClose}>
            <Detail accountId={accountId} clickedObject={clickedObject} launcherUrlState={launcherUrlState} />
          </Modal>
        )}
        {showAdmin && (
          <Modal onClose={this.modalClose}>
            <Admin accountId={accountId} settings={settings} data={data} onChange={this.dataChanged} />
          </Modal>
        )}
      </div>
    );
  }
}
