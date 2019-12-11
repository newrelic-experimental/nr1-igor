import React from 'react';
import PropTypes from 'prop-types';

import {
  Icon,
  AccountStorageMutation,
  NerdGraphQuery,
} from 'nr1';

export default class Mappings extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    accountId: PropTypes.number,
    onChange: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      attribute: '',
      attributes: [],
      values: [],
      selectedValues: [],
      selectedLocation: '',
      searchText: '',
    };

    this.changeAttrib = this.changeAttrib.bind(this);
    this.fetchAttribs = this.fetchAttribs.bind(this);
    this.fetchValues = this.fetchValues.bind(this);
    this.changeLocation = this.changeLocation.bind(this);
    this.toggleValue = this.toggleValue.bind(this);
    this.updateData = this.updateData.bind(this);
  }

  componentDidMount() {
    this.fetchAttribs();
  }

  changeAttrib(e) {
    const attrib = e.target.value;
    const { selectedLocation } = this.state;
    const { data } = this.props;

    this.setState({
      attribute: attrib,
      selectedValues: ((data[selectedLocation].attribute || '') === attrib) ? data[selectedLocation]['values'] : [],
    }, () => this.fetchValues(attrib));
  }

  async fetchAttribs() {
    const { accountId } = this.props;
    const gql = `{actor {account(id: ${accountId}) {nrql(query: "SELECT keySet() FROM SystemSample") {  results }}}}`;

    const res = await NerdGraphQuery.query({query: gql});
    const results = (((((res || {}).data || {}).actor || {}).account || {}).nrql || {}).results || [];

    const skipAttribs = ['agentName', 'agentVersion', 'avgQueueLen', 'avgReadQueueLen', 'avgWriteQueueLen', 'currentQueueLen', 'device', 'diskFreeBytes', 'diskFreePercent', 'diskTotalBytes', 'diskUsedBytes', 'diskUsedPercent', 'entityAndMountPoint', 'entityID', 'filesystemType', 'fullHostname', 'inodesFree', 'inodesTotal', 'inodesUsed', 'inodesUsedPercent', 'isReadOnly', 'kernelVersion', 'linuxDistribution', 'mountPoint', 'operatingSystem', 'readBytesPerSecond', 'readIoPerSecond', 'readUtilizationPercent', 'timestamp', 'totalUtilizationPercent', 'windowsFamily', 'windowsPlatform', 'windowsVersion', 'writeBytesPerSecond', 'writeIoPerSecond', 'writeUtilizationPercent', 'apmApplicationIds', 'apmApplicationNames', 'coreCount', 'entityGuid', 'entityId', 'entityKey', 'entityName', 'externalKey', 'hostID', 'instanceType', 'nr.apmApplicationIds', 'nr.apmApplicationNames', 'nr.entityType', 'processorCount', 'systemMemoryBytes', 'vendor'];
    const attribs = results.reduce((a, c) => {
      if (c.type === 'string' && !skipAttribs.includes(c.key)) a.push(c.key);
      return a;
    }, []);

    this.setState({
      attributes: attribs,
    });
  }

  async fetchValues(attrib) {
    const { accountId } = this.props;
    const gql = `{actor {account(id: ${accountId}) {nrql(query: "SELECT uniques(${attrib}) FROM SystemSample") {  results }}}}`;

    const res = await NerdGraphQuery.query({query: gql});
    const results = (((((res || {}).data || {}).actor || {}).account || {}).nrql || {}).results || [];

    this.setState({
      searchText: '',
      values: results.map(r => r.member),
    });
  }

  changeLocation(loc) {
    const { data } = this.props;

    this.setState({
      selectedLocation: loc,
      selectedValues: ('values' in data[loc]) ? data[loc]['values'] : [],
      attribute: ('attribute' in data[loc]) ? data[loc]['attribute'] : 'hostname',
    }, () => this.fetchValues(this.state.attribute));
  }

  toggleValue(val) {
    const { attribute, selectedValues, selectedLocation } = this.state;
    const { data } = this.props;

    const vals = selectedValues.filter(v => (v !== val));
    if (vals.length === selectedValues.length) vals.push(val);

    this.setState({
      selectedValues: vals
    }, () => {
      data[selectedLocation]['attribute'] = attribute;
      data[selectedLocation]['values'] = vals;
      this.updateData(data);
    });
  }

  async updateData(data) {
    const { accountId, onChange } = this.props;

    const res = await AccountStorageMutation.mutate({
        accountId: accountId,
        actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
        collection: 'IgorDB',
        documentId: 'data',
        document: data,
    });

    if (!('error' in res) && onChange) onChange('data', data);
  }

  render() {
    const { attribute, attributes, values, selectedValues, selectedLocation, searchText } = this.state;
    const { data } = this.props;

    return (
      <div className="cols bound">
        <div className="col">
          <table className="split">
            <tbody>
              {data && Object.keys(data).map((loc,i) => (
                <tr key={i} onClick={() => this.changeLocation(loc)}>
                  <td style={(selectedLocation && (selectedLocation === loc)) ? {backgroundColor: 'transparent'} : {}}>
                    <div>
                      <div className="location">
                        {loc}
                        {'values' in data[loc] && data[loc]['values'].length > 0 &&
                          <span className="count">{data[loc]['values'].length}</span>
                        }
                      </div>
                      <div className="indicator">
                        {selectedLocation && (selectedLocation === loc) && <Icon type={Icon.TYPE.INTERFACE__CHEVRON__CHEVRON_RIGHT} />}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && !selectedLocation && (
          <div className="col" style={{justifySelf: 'center', padding: '1em'}}>
            <Icon type={Icon.TYPE.INTERFACE__CHEVRON__CHEVRON_LEFT} />
            <span style={{font: '1.5em Inconsolata, monospace'}}>select location</span>
          </div>
        )}
        {selectedLocation &&
          <div className="col" style={{padding: '1em'}}>
            <div className="field">
              <label htmlFor="host-types" className="label">Show</label>
              <div className="select">
                <span style={{position: 'absolute', top: '45%', right: '1.5em'}}>
                  <Icon type={Icon.TYPE.INTERFACE__CHEVRON__CHEVRON_BOTTOM__WEIGHT_BOLD} />
                </span>
                <select
                  id="host-types"
                  className="u-unstyledSelect"
                  value={attribute}
                  style={{font: '1.5em Inconsolata, monospace'}}
                  onChange={this.changeAttrib}>
                  {attributes.map((a, i) => <option value={a} key={i}>{a}</option>)}
                </select>
              </div>
            </div>
            <div>
              <ul className="hosts">
                <li>
                  <input
                    className="u-unstyledInput"
                    type="text"
                    placeholder="search to filter"
                    value={searchText}
                    onChange={e => this.setState({searchText: e.target.value})} />
                </li>
                {values.filter(v => (searchText === '' || v.toLowerCase().indexOf(searchText.toLowerCase()) !== -1)).map((v, i) => (
                  <li key={i}>
                    <input
                      className="u-unstyledInput"
                      id={'check-' + i}
                      type="checkbox"
                      checked={selectedValues.includes(v)}
                      onChange={() => this.toggleValue(v)} />
                    <label htmlFor={'check-' + i}><span></span>{v}</label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        }
      </div>
    );
  }
}
