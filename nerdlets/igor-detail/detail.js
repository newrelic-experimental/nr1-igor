import React from 'react';
import PropTypes from 'prop-types';

import {
  NerdGraphQuery,
} from 'nr1';

import Donut from './donut';

export default class IgorDetail extends React.Component {
  static propTypes = {
    launcherUrlState: PropTypes.object,
    nerdletUrlState: PropTypes.object,
    width: PropTypes.number,
    height: PropTypes.number,
  };

  constructor(props) {
    super(props);
    this.state = {
      hosts: [],
      clickedObject: (props.nerdletUrlState || {}).clickedObject
    };

    this.loadData = this.loadData.bind(this);
  }

  componentDidMount() {
    this.loadData();
  }

  async loadData() {
    const { clickedObject } = this.state;

    const query = `{
      actor {
        account(id: 1334766) {
          nrql(query: "SELECT max(cpuPercent), max(diskUsedPercent), max((memoryUsedBytes/memoryTotalBytes)*100) AS 'max.memoryUsedPercent' FROM SystemSample FACET hostname WHERE ${clickedObject.attrib} IN (${`'` + clickedObject.values.join(`','`) + `'`}) LIMIT MAX") {
            results
          }
        }
      }
    }`;

    const res = await NerdGraphQuery.query({query: query});
    const results = (((((res || {}).data || {}).actor || {}).account || {}).nrql || {}).results

    this.setState({
      hosts: results
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
    const { clickedObject, hosts } = this.state;

    return (
      <div style={{backgroundColor: '#fff', padding: '4em 2em'}}>
        <h1 className="header">{clickedObject.name} Hosts</h1>
        <div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr'}}>
            <div className="cell" style={{height: '10em'}}>
              <Donut percent={this.percentFormatter(clickedObject['max.cpuPercent'])} />
            </div>
            <div className="cell" style={{height: '10em'}}>
              <Donut percent={this.percentFormatter(clickedObject['max.memoryUsedPercent'])} />
            </div>
            <div className="cell" style={{height: '10em'}}>
              <Donut percent={this.percentFormatter(clickedObject['max.diskUsedPercent'])} />
            </div>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr'}}>
            <div className="cell">Max CPU in {clickedObject.name}</div>
            <div className="cell">Max Memory in {clickedObject.name}</div>
            <div className="cell">Max Disk in {clickedObject.name}</div>
          </div>
          <table className="detail">
            <thead>
              <tr>
                <th>Hostname</th>
                <th>CPU</th>
                <th>Memory</th>
                <th>Disk</th>
              </tr>
            </thead>
            <tbody>
              {hosts.map((host, i) => (
              <tr key={i}>
                <td>{host.hostname}</td>
                <td>{this.percentFormatter(host['max.cpuPercent'])}</td>
                <td>{this.percentFormatter(host['max.memoryUsedPercent'])}</td>
                <td>{this.percentFormatter(host['max.diskUsedPercent'])}</td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
