import React from 'react';
import PropTypes from 'prop-types';

import {
  Dropdown,
  DropdownItem,
  List,
  ListItem,
  Checkbox,
  Button,
  AccountStorageMutation,
  NerdGraphQuery,
} from 'nr1';

import InfoBar from './info-bar';

export default class Mappings extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    accountId: PropTypes.number,
    onUpdate: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      attribute: '',
      attributes: [],
      values: [],
      selectedValues: [],
      selectedLocation: '',
    };

    this.fetchAttribs = this.fetchAttribs.bind(this);
    this.fetchValues = this.fetchValues.bind(this);
    this.toggleValue = this.toggleValue.bind(this);
    this.addMapping = this.addMapping.bind(this);
    this.removeMapping = this.removeMapping.bind(this);
    this.dataMutation = this.dataMutation.bind(this);
  }

  componentDidMount() {
    this.fetchAttribs()
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
      attributes: attribs
    }, () => this.fetchValues('hostname'));
  }

  async fetchValues(attrib) {
    const { accountId } = this.props;
    const gql = `{actor {account(id: ${accountId}) {nrql(query: "SELECT uniques(${attrib}) FROM SystemSample") {  results }}}}`;

    const res = await NerdGraphQuery.query({query: gql});
    const results = (((((res || {}).data || {}).actor || {}).account || {}).nrql || {}).results || [];

    this.setState({
      attribute: attrib,
      values: results.map(r => r.member)
    });
  }

  toggleValue(val) {
    const { selectedValues } = this.state;

    const vals = selectedValues.filter(v => (v !== val));
    if (vals.length === selectedValues.length) vals.push(val);

    this.setState({ selectedValues: vals });
  }

  addMapping() {
    const { attribute, selectedValues, selectedLocation } = this.state;
    const { data } = this.props;

    if (selectedLocation in data) {
      data[selectedLocation]['attribute'] = attribute;
      data[selectedLocation]['values'] = selectedValues;
      this.dataMutation(data);
    }
  }

  removeMapping(loc) {
    const { data } = this.props;

    delete data[loc]['attribute'];
    delete data[loc]['values'];
    this.dataMutation(data);
  }

  dataMutation(data) {
    const { accountId, onUpdate } = this.props;

    AccountStorageMutation.mutate({
        accountId: accountId,
        actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
        collection: 'IgorDB',
        documentId: 'data',
        document: data,
    }).then(res => {
      if (!('error' in res)) this.setState({
        selectedValues: [],
        selectedLocation: '',
      }, () => (onUpdate) ? onUpdate() : null);
    });
  }

  render() {
    const { attribute, attributes, values, selectedValues, selectedLocation } = this.state;
    const { data } = this.props;

    const [unmapped, mapped] = (data) ? Object.keys(data).reduce((a, l) => {
      let index = +('attribute' in data[l] && 'values' in data[l]);
      a[index].push(l);
      return a;
    }, [[], []]) : [[], []];

    return (
      <div className="tab-container">
        <div className="col">
          <table className="default-table">
            {/*<caption>Mappings</caption>*/}
            <thead>
              <tr>
                <th>Location</th>
                <th>Attribute</th>
                <th>Values</th>
                <th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {mapped.map((loc, i) => (
                <tr key={i}>
                  <td>{loc}</td>
                  <td>{data[loc]['attribute']}</td>
                  <td>{data[loc]['values']}</td>
                  <td>
                    <Button
                      type={Button.TYPE.DESTRUCTIVE}
                      sizeType={Button.SIZE_TYPE.SMALL}
                      iconType={Button.ICON_TYPE.INTERFACE__SIGN__CLOSE}
                      onClick={() => this.removeMapping(loc)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="col">
          Select all hosts that belong to a location
          <InfoBar info="Hint: choose an alternate attribute, if hosts are already grouped by that attribute." />
          <div className="form-element" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gridColumnGap: '2em'}}>
            <div>
              <Dropdown title={(attribute) ? attribute : 'Available Attributes'}>
                {attributes.map((a, i) => <DropdownItem key={i} onClick={() => this.fetchValues(a)}>{a}</DropdownItem>)}
              </Dropdown>
            </div>
            <div>
              <Dropdown title={(selectedLocation) ? selectedLocation : 'Select Location'} disabled={!selectedValues.length}>
                {unmapped.map((loc, i) => <DropdownItem key={i} onClick={() => this.setState({selectedLocation: loc})}>{loc}</DropdownItem>)}
              </Dropdown>
              <Button
                type={Button.TYPE.NORMAL}
                sizeType={Button.SIZE_TYPE.SMALL}
                iconType={Button.ICON_TYPE.INTERFACE__SIGN__CHECKMARK}
                disabled={!selectedValues.length}
                onClick={this.addMapping}>
                Save Mapping
              </Button>
            </div>
          </div>
          <div className="form-element">
            <div>
              <List style={{width: '100%'}}>
                {values.map((v, i) => (
                  <ListItem key={i}>
                    <Checkbox onChange={() => this.toggleValue(v)} label={v} checked={selectedValues.includes(v)} />
                  </ListItem>
                ))}
              </List>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
