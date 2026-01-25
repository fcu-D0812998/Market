import { HomeOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Badge, Layout, Menu, Typography } from 'antd';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useCart } from '../store/cart';

const { Header, Content, Footer } = Layout;

export function AppLayout({ children }: { children: ReactNode }) {
  const { totalQuantity } = useCart();
  const location = useLocation();
  const selectedKey =
    location.pathname.startsWith('/cart') ? 'cart' : 'home';

  return (
    <Layout style={{ minHeight: '100%' }}>
      <Header style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
          吉璿行
        </Typography.Title>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={[
            {
              key: 'home',
              icon: <HomeOutlined />,
              label: <Link to="/">商品</Link>,
            },
            {
              key: 'cart',
              icon: (
                <Badge count={totalQuantity} size="small">
                  <ShoppingCartOutlined />
                </Badge>
              ),
              label: <Link to="/cart">購物車</Link>,
            },
          ]}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header>
      <Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>{children}</div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Market MVP · React + Vite + Ant Design · Django</Footer>
    </Layout>
  );
}


