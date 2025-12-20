import React, { useMemo } from 'react';
import { Selector } from 'antd-mobile'; // 替换 Select 为 Selector

const UserSelect = ({ users, onSelect }) => {
  // 使用 useMemo 优化 options 渲染，避免重复创建新对象
  const userOptions = useMemo(() => {
    return users.map(user => ({
      value: user.id,
      label: `${user.name} (${user.email})`,
    }));
  }, [users]);

  return (
    <Selector
      placeholder="选择用户"
      options={userOptions}
      onChange={onSelect}
      style={{ width: '100%', marginBottom: '15px' }}
    />
  );
};

export default React.memo(UserSelect);
