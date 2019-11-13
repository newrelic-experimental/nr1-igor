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
import Detail from './detail';
import Donut from './donut';
import Modal from './modal';

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
    this.setupQueries = this.setupQueries.bind(this);
    this.queryData = this.queryData.bind(this);
    this.openAdmin = this.openAdmin.bind(this);
    this.accountChange = this.accountChange.bind(this);
    this.modalClose = this.modalClose.bind(this);
  }

  componentDidMount() {}

  componentWillUnmount() {
    const { queryTimer } = this.state;

    if (queryTimer) clearInterval(queryTimer);
  }

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

  modalClose() {
    this.setState({
      clickedObject: null
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

    this.setState(o, () => (!('settings' in o) || !('data' in o)) ? this.openAdmin() : this.setupQueries());
  }

  setupQueries() {
    const { data } = this.state;

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

    this.setState({
      queries: queries,
      locs: locs,
      queryTimer: setInterval(this.queryData, 60000)
    }, () => this.queryData());
  }

  async queryData() {
    const { querying, queryTimer, accountId, queries, locs } = this.state;
    if (querying) return;

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

  colorByPercent(pct, isString) {
    let r = pct>50 ? 255 : Math.floor((pct*2)*255/100);
    let g = pct<50 ? 255 : Math.floor(255-(pct*2-100)*255/100);
    return (isString) ? 'rgb('+r+', '+g+', 0)' : [r, g, 0 ];
  }

  percentFormatter(pct) {
    return new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 }).format(pct/100);
  }

  render() {
    const { accountId, settings, data, viewState, mapData, layers, hoveredIndex, pointerX, pointerY, clickedObject } = this.state;
    const { launcherUrlState } = this.props;

    const hoveredObject = (hoveredIndex > -1) ? mapData[hoveredIndex] : null;

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
      </div>
    );
  }
}
