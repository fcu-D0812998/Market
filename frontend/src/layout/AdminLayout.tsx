import { AppstoreOutlined, LogoutOutlined, SettingOutlined, TagsOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, Typography } from 'antd';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../store/auth';

const { Header, Content, Footer } = Layout;

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const selectedKey = location.pathname.startsWith('/admin/settings')
    ? 'settings'
    : location.pathname.startsWith('/admin/tags')
      ? 'tags'
      : location.pathname.startsWith('/admin/orders')
        ? 'orders'
        : 'products';

  const handleLogout = async () => {
    await logout();
    nav('/admin/login', { replace: true });
  };

  return (
    <Layout style={{ minHeight: '100%' }}>
      <Header style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
          Market 後台
        </Typography.Title>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={[
            { key: 'settings', icon: <SettingOutlined />, label: <Link to="/admin/settings">設定</Link> },
            { key: 'tags', icon: <TagsOutlined />, label: <Link to="/admin/tags">標籤管理</Link> },
            { key: 'products', icon: <AppstoreOutlined />, label: <Link to="/admin/products">商品管理</Link> },
            { key: 'orders', icon: <UnorderedListOutlined />, label: <Link to="/admin/orders">訂單管理</Link> },
          ]}
          style={{ flex: 1, minWidth: 0 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Typography.Text style={{ color: '#fff' }}>{user?.username}</Typography.Text>
          <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} style={{ color: '#fff' }}>
            登出
          </Button>
        </div>
      </Header>
      <Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>{children}</div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Admin · React + Vite + Ant Design · Django</Footer>
    </Layout>
  );
}


