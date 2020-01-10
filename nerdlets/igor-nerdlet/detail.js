import React from 'react';
import PropTypes from 'prop-types';

import {
  Link,
  LineChart,
  NerdGraphQuery,
  EntityByGuidQuery,
  navigation
} from 'nr1';

import Table from './table';

export default class Detail extends React.Component {
  static propTypes = {
    accountId: PropTypes.number,
    clickedObject: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {
      hosts: []
    };

    this.loadTableData = this.loadTableData.bind(this);
    this.sortHosts = this.sortHosts.bind(this);
    this.pickedHost = this.pickedHost.bind(this);
    this.fetchHost = this.fetchHost.bind(this);
    this.getRelationships = this.getRelationships.bind(this);
  }

  componentDidMount() {
    this.loadTableData();
  }

  async loadTableData() {
    const { accountId, clickedObject } = this.props;

    const nrql = `
      SELECT
        latest(entityGuid) AS 'guid',
        latest(cpuPercent) AS 'cpu',
        latest(diskUsedPercent) AS 'disk',
        latest((memoryUsedBytes/memoryTotalBytes)*100) AS 'memory'
      FROM SystemSample
      FACET hostname`;

    const query = `{
      actor {
        account(id: ${accountId}) {
          nrql(query: "${nrql.replace(/\s\s+/g, ' ')} WHERE ${
      clickedObject.attrib
    } IN (${`'${clickedObject.values.join(`','`)}'`}) LIMIT MAX") {
            results
          }
        }
      }
    }`;

    const res = await NerdGraphQuery.query({ query: query });
    const results = (
      ((((res || {}).data || {}).actor || {}).account || {}).nrql || {}
    ).results;

    const hosts = results.map(r => ({
      id: r.guid,
      hostname: { value: r.hostname, text: r.hostname },
      cpuPercent: { value: r.cpu, text: this.percentFormatter(r.cpu) },
      memoryUsedPercent: {
        value: r.memory,
        text: this.percentFormatter(r.memory)
      },
      diskUsedPercent: { value: r.disk, text: this.percentFormatter(r.disk) }
    }));

    this.setState(
      {
        hosts: hosts,
        marked: hosts.length ? hosts[0].id : null
      },
      () => this.pickedHost(hosts[0])
    );
  }

  colorByPercent(pct, isString) {
    const r = pct > 50 ? 255 : Math.floor((pct * 2 * 255) / 100);
    const g = pct < 50 ? 255 : Math.floor(255 - ((pct * 2 - 100) * 255) / 100);
    return isString ? `rgb(${r}, ${g}, 0)` : [r, g, 0];
  }

  percentFormatter(pct) {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      maximumFractionDigits: 2
    }).format(pct / 100);
  }

  sortHosts(col, order) {
    const { hosts } = this.state;

    const sorted = hosts.sort((a, b) =>
      // eslint-disable-next-line no-nested-ternary
      order === 'asc'
        ? a[col].value > b[col].value
          ? 1
          : -1
        : a[col].value < b[col].value
        ? 1
        : -1
    );

    this.setState({
      hosts: sorted
    });
  }

  pickedHost(host) {
    if (host && 'id' in host) this.fetchHost(host.id);
  }

  async fetchHost(guid) {
    const res = await EntityByGuidQuery.query({ entityGuid: guid });

    const entities = ((res || {}).data || {}).entities || [];

    if (entities.length) {
      const firstEntity = entities.shift();
      const _entity = {
        guid: firstEntity.guid,
        name: firstEntity.name,
        reporting: firstEntity.reporting,
        alertSeverity: firstEntity.alertSeverity,
        tags: firstEntity.tags.reduce((acc, tag) => {
          if (
            ['accountId', 'account'].indexOf(tag.key) < 0 &&
            tag.values.length === 1
          )
            acc[tag.key] = tag.values[0];
          return acc;
        }, {})
      };

      if ('systemMemoryBytes' in _entity.tags) {
        const _e = Math.floor(
          Math.log(_entity.tags.systemMemoryBytes) / Math.log(1000)
        );
        _entity.systemMemory = `${(
          _entity.tags.systemMemoryBytes / Math.pow(1000, _e)
        ).toFixed(2)} ${' KMGTP'.charAt(_e)}B`;
      }

      const { apmApplicationNames, apmApplicationIds } = _entity.tags;
      if (apmApplicationNames && apmApplicationIds) {
        const _apmApplicationNames = apmApplicationNames
          .slice(1, -1)
          .split('|');
        const _apmApplicationIds = apmApplicationIds.slice(1, -1).split('|');
        if (_apmApplicationNames.length === _apmApplicationIds.length)
          _entity.apmApps = _apmApplicationNames.map((_a, _i) => ({
            name: _a,
            id: _apmApplicationIds[_i]
          }));
      }

      _entity.tags.agent = `${_entity.tags.agentName} ${_entity.tags.agentVersion}`;

      [
        'domain',
        'type',
        'apmApplicationNames',
        'apmApplicationIds',
        'systemMemoryBytes',
        'agentName',
        'agentVersion'
      ].map(i => delete _entity.tags[i]);

      this.setState(
        {
          marked: guid,
          entity: _entity
        },
        () => this.getRelationships(guid)
      );
    }
  }

  async getRelationships(guid) {
    const gql = `{ actor { entity(guid: "${guid}") {
      ... on InfrastructureHostEntity {
        relationships { target { entityType entity { name guid } } }
      } } } }`;

    const res = await NerdGraphQuery.query({ query: gql });

    const relationships = (
      ((((res || {}).data || {}).actor || {}).entity || {}).relationships || []
    ).map(r => ({
      entityName: r.target.entity.name,
      entityGuid: r.target.entity.guid,
      entityType: r.target.entityType
    }));

    this.setState(state => ({
      relationships:
        'entity' in state &&
        'guid' in state.entity &&
        state.entity.guid === guid
          ? relationships
          : []
    }));
  }

  render() {
    const { hosts, marked, entity, relationships } = this.state;
    const { accountId, clickedObject } = this.props;

    const cols = [
      { title: 'Hostname', name: 'hostname' },
      { title: 'CPU', name: 'cpuPercent' },
      { title: 'Memory', name: 'memoryUsedPercent' },
      { title: 'Disk', name: 'diskUsedPercent' }
    ];

    return (
      <div className="details">
        <h2 className="header">{clickedObject.name} Hosts</h2>
        <div className="grid">
          <div>
            <Table
              cols={cols}
              data={hosts}
              sort={this.sortHosts}
              pick={this.pickedHost}
              mark={marked}
            />
          </div>
          <div>
            {entity && (
              <div>
                <h3 className="header title">{entity.name}</h3>
                <LineChart
                  accountId={accountId}
                  query={`SELECT
                            average(cpuPercent) AS 'cpu usage (%)',
                            average(diskUsedPercent) AS 'disk usage (%)',
                            average((memoryUsedBytes/memoryTotalBytes)*100) AS 'memory usage (%)'
                          FROM SystemSample
                          TIMESERIES
                          WHERE entityGuid = '${entity.guid}'`}
                  fullWidth
                />
                <table className="meta">
                  <tbody>
                    {Object.keys(entity.tags).map((e, i) => (
                      <tr key={`e${i}`}>
                        <td>{e}</td>
                        <td>{entity.tags[e]}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan="2">
                        <Link
                          to={navigation.getOpenStackedEntityLocation(
                            entity.guid
                          )}
                        >
                          More...
                        </Link>
                      </td>
                    </tr>
                    {relationships &&
                      relationships.map((r, i) => (
                        <tr key={`r${i}`}>
                          <td colSpan="2">
                            <Link
                              to={navigation.getOpenStackedEntityLocation(
                                r.entityGuid
                              )}
                            >
                              {r.entityName}
                            </Link>{' '}
                            (application)
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
