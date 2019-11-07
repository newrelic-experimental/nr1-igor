import React from 'react';
import PropTypes from 'prop-types';

import {
  TextField,
  Button,
  AccountStorageMutation,
} from 'nr1';

import InfoBar from './info-bar';

export default class Locations extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    accountId: PropTypes.number,
    onUpdate: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      locationsText: '',
    };

    this.addLocations = this.addLocations.bind(this);
    this.removeLocation = this.removeLocation.bind(this);
    this.dataMutation = this.dataMutation.bind(this);
  }

  addLocations() {
    const { locationsText } = this.state;
    const { data } = this.props;

    const locs = locationsText.split('\n').reduce((a, l) => {
      let loc = l.split(',');
      if (loc.length === 3) {
        let name = loc.shift();
        let [lat, lng] = loc.map(parseFloat);
        if (lat && lng) a[name.trim()] = {lat, lng};
      }
      return a;
    }, {})

    this.dataMutation(Object.assign((data || {}), locs));
  }

  removeLocation(loc) {
    const { data } = this.props;

    delete data[loc];
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
        locationsText: ''
      }, () => (onUpdate) ? onUpdate() : null);
    });
  }

  render() {
    const { locationsText } = this.state;
    const { data } = this.props;

    const locationPlaceholder = 'San Francisco,37.7913249,-122.3951599\nAtlanta,33.7869491,-84.3849318\nPortland,45.5221871,-122.6784799\nPhoenix,33.4485711,-112.0743242';

    return (
      <div className="tab-container">
        <div className="col">
          <table className="default-table">
            {/*<caption>Locations</caption>*/}
            <thead>
              <tr>
                <th>Name</th>
                <th>Lat/Lng</th>
                <th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {data && Object.keys(data).map((loc,i) => (
                <tr key={i}>
                  <td>{loc}</td>
                  <td>{'' + data[loc]['lat'] + ', ' + data[loc]['lng']}</td>
                  <td>
                    <Button
                      type={Button.TYPE.DESTRUCTIVE}
                      sizeType={Button.SIZE_TYPE.SMALL}
                      iconType={Button.ICON_TYPE.INTERFACE__SIGN__CLOSE}
                      onClick={() => this.removeLocation(loc)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="col">
          Add locations below
          <InfoBar info={
            `One location per line
            Comma separated vaules - name, latitude, longitude
            All 3 parameters are required
            Leading/trailing spaces are stripped out
            Name has to be unique`} />
          <div className="form-element">
            <TextField multiline label="Locations" placeholder={locationPlaceholder} value={locationsText} onChange={e => this.setState({locationsText: e.target.value})} />
          </div>
          <div>
            <Button
              type={Button.TYPE.NORMAL}
              iconType={Button.ICON_TYPE.INTERFACE__SIGN__CHECKMARK}
              onClick={this.addLocations}>
              Add Location(s)
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
