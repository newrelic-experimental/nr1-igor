import React from 'react';
import PropTypes from 'prop-types';

import {
  Icon,
} from 'nr1';

export default class Table extends React.Component {
  static propTypes = {
    cols: PropTypes.array,
    data: PropTypes.array,
    sort: PropTypes.func,
    pick: PropTypes.func,
    mark: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = {
      cols: props.cols.map(c => Object.assign(c, {sort: ''}))
    };

    this.onSort = this.onSort.bind(this);
    this.onPick = this.onPick.bind(this);
  }

  onSort(e, col) {
    e.preventDefault();

    const { cols } = this.state;
    const { data, sort } = this.props;

    const sorted = cols.reduce((a, c) => {
      c.sort = (c.name === col.name)
      ? ((c.sort === 'asc')
        ? 'desc'
        : 'asc')
      : '';
      a.cols.push(c);
      if (c.sort !== '') {
        a.col = c.name;
        a.order = c.sort;
      }
      return a;
    }, {cols: [], col: '', order: ''});

    this.setState({
      cols: sorted.cols
    }, () => (sort) ? sort(sorted.col, sorted.order) : null);
  }

  onPick(e, row) {
    e.preventDefault();

    const { pick } = this.props;

    if (pick) pick(row);
  }

  render() {
    const { cols } = this.state;
    const { data, mark } = this.props;

    const sortArrow = (order) => (
      (order === 'desc')
      ? <Icon type={Icon.TYPE.INTERFACE__ARROW__ARROW_TOP} />
      : (order === 'asc')
      ? <Icon type={Icon.TYPE.INTERFACE__ARROW__ARROW_BOTTOM} />
      : <Icon type={Icon.TYPE.INTERFACE__ARROW__SORT} color="#ccc" />
    );

    return (
      <table className="detail">
        <thead>
          <tr>
            {cols.map((col, i) => (
              <th key={i} onClick={e => this.onSort(e, col)}>
                <div>
                  <div>{col.title}</div>
                  <div>{sortArrow(col.sort)}</div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr className={(mark && 'id' in row && mark === row.id) ? 'marked' : ''} key={i}>
              {cols.map((col, j) => (
                <td onClick={e => this.onPick(e, row)} key={'_'+i+'_'+j}>{row[col.name].text}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}
