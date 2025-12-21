import React, { useMemo } from 'react';
import { Selector } from 'antd-mobile';

const UserSelect = ({ users, onSelect }) => {
  // 使用 useMemo 优化 options 渲染，避免重复创建新对象
  const userOptions = useMemo(() => {
    return users.map(user => ({
      value: user.id,
      label: user.name,
    }));
  }, [users]);

  return (
    <div style={{ padding: '8px 0 8px 16px' }}>
      <Selector options={userOptions} onChange={arr => onSelect(arr[0])} />
    </div>
  );
};

export default React.memo(UserSelect);
