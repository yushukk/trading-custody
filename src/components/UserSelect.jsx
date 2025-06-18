import React from 'react';
import { Selector } from 'antd-mobile'; // 替换 Select 为 Selector

const UserSelect = ({ users, onSelect }) => (
  <Selector
    placeholder="选择用户"
    options={users.map(user => ({
      value: user.id,
      label: `${user.name} (${user.email})`
    }))}
    onChange={onSelect}
    style={{ width: '100%', marginBottom: '15px' }}
  />
);

export default UserSelect;