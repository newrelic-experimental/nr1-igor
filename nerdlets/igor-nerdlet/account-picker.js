import React from 'react';
import PropTypes from 'prop-types';

import { Dropdown, DropdownItem, AccountsQuery } from 'nr1';

export default class AccountPicker extends React.Component {
  static propTypes = {
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      account: {},
      accounts: []
    };

    this.loadAccounts = this.loadAccounts.bind(this);
    this.switchAccount = this.switchAccount.bind(this);
  }

  componentDidMount() {
    this.loadAccounts();
  }

  async loadAccounts() {
    const res = await AccountsQuery.query();
    const data = (res || {}).data;
    if (data.length) {
      this.switchAccount(data[0]);
      this.setState({
        accounts: data
      });
    }
  }

  switchAccount(account) {
    const { onChange } = this.props;

    this.setState(
      {
        account: account
      },
      () => (onChange ? onChange(account) : null)
    );
  }

  render() {
    const { account, accounts } = this.state;

    return (
      <div style={{ display: 'inline-block' }}>
        {accounts.length > 0 && (
          <Dropdown title={account ? account.name : ''}>
            {accounts.map(a => (
              <DropdownItem key={a.id} onClick={() => this.switchAccount(a)}>
                {a.name}
              </DropdownItem>
            ))}
          </Dropdown>
        )}
      </div>
    );
  }
}
