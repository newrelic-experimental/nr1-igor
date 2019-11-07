import React from 'react';
import PropTypes from 'prop-types';

import {
  Tabs,
  TabsItem,
  AccountStorageQuery,
} from 'nr1';

import Settings from './settings';
import Locations from './locations';
import Mappings from './mappings';

export default class IgorAdmin extends React.Component {
  static propTypes = {
    launcherUrlState: PropTypes.object,
    nerdletUrlState: PropTypes.object,
    width: PropTypes.number,
    height: PropTypes.number,
  };

  constructor(props) {
    super(props);
    this.state = {
      settings: null,
      data: null,
      accountId: (props.nerdletUrlState || {}).accountId
    };

    this.loadData = this.loadData.bind(this);
  }

  componentDidMount() {
    this.loadData();
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

    this.setState(o);
  }

  render() {
    const { settings, data, accountId } = this.state;

    return (
      <Tabs defaultValue="tab-1">
        <TabsItem value="tab-1" label="General Settings">
          <Settings settings={settings} accountId={accountId} onUpdate={this.loadData} />
        </TabsItem>
        <TabsItem value="tab-2" label="Add/Edit Locations">
          <Locations data={data} accountId={accountId} onUpdate={this.loadData} />
        </TabsItem>
        <TabsItem value="tab-3" label="Map Hosts to Locations">
          <Mappings data={data} accountId={accountId} onUpdate={this.loadData} />
        </TabsItem>
      </Tabs>
    );
  }
}
