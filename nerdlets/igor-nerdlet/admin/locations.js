import React from 'react';
import PropTypes from 'prop-types';

import {
  Icon,
  Button,
  AccountStorageMutation,
} from 'nr1';

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

    this.textChange = this.textChange.bind(this);
    this.addLocations = this.addLocations.bind(this);
    this.removeLocation = this.removeLocation.bind(this);
    this.updateData = this.updateData.bind(this);
  }

  textChange(e) {
    this.setState({
      locationsText: e.target.value,
    });
  }

  addLocations() {
    const { locationsText } = this.state;
    const { data } = this.props;

    const parseErrors = [];

    const locs = locationsText.split('\n').reduce((a, l) => {
      let loc = l.split(',');
      if (loc.length === 3) {
        let name = loc.shift().trim();
        let [lat, lng] = loc.map(parseFloat);
        if (!(name in (data || {})) && lat && lng) {
          a[name] = {lat, lng};
        } else {
          parseErrors.push(l);
        }
      } else {
        parseErrors.push(l);
      }
      return a;
    }, {});

    this.setState({
      parseErrors: parseErrors,
    }, () => this.updateData(Object.assign((data || {}), locs)));
  }

  removeLocation(loc) {
    const { data } = this.props;

    delete data[loc];
    this.updateData(data);
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

    if (!('error' in res)) {
      this.setState({
        locationsText: ''
      }, () => (onChange) ? onChange() : null);
    }
  }

  render() {
    const { locationsText, parseErrors } = this.state;
    const { data } = this.props;

    const formStyle = {
      font: '1.5em Inconsolata, monospace',
      border: '1px solid #e3e4e4',
      padding: '.5em',
      borderRadius: '.25em'
    };

    const bullet = <Icon type={Icon.TYPE.INTERFACE__SIGN__MINUS} style={{marginRight: '.2em'}} />;

    const locationPlaceholder = `San Francisco,37.7913249,-122.3951599
      Atlanta,33.7869491,-84.3849318
      Portland,45.5221871,-122.6784799
      Phoenix,33.4485711,-112.0743242`.replace(/  +/g, '');

    return (
      <div className="cols">
        <div className="col">
          <div className="field">
            <label htmlFor="locations" className="label">Locations</label>
            {parseErrors && (parseErrors.length > 0) &&
              <div className="message fail">
                Unable to parse the following lines:<br/>
                {parseErrors.map((p, i) => (
                  <span style={{marginLeft: '1em'}} key={i}>
                    {bullet}{p}<br/>
                  </span>
                ))}
              </div>
            }
            <textarea
              id="locations"
              rows="5"
              className="input"
              placeholder={locationPlaceholder}
              value={locationsText}
              onChange={this.textChange}
              style={formStyle}/>
            <div className="hint">
              {bullet}One location each line<br/>
              {bullet}Each location has 3 values - <span className="pass">name, latitude, longitude</span><br/>
              {bullet}Values should be in that order, comma-separated<br/>
              {bullet}All <span className="fail">3 values</span> are <span className="fail">required</span> for each location<br/>
              {bullet}Leading/trailing spaces are stripped out for each value<br/>
              {bullet}<span className="pass">Name</span> is <span className="fail">case-sensitive</span>, and should be <span className="fail">unique</span>
            </div>
            <Button
              type={Button.TYPE.NORMAL}
              iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS__V_ALTERNATE}
              onClick={this.addLocations}>
              Add
            </Button>
          </div>
        </div>
        <div className="col">
          {data &&
            <table className="admin">
              {/*<caption>Locations</caption>*/}
              <thead>
                <tr>
                  <th>Name</th>
                  <th colSpan="2">Lat/Lng</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(data).map((loc,i) => (
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
          }
        </div>
      </div>
    );
  }
}
