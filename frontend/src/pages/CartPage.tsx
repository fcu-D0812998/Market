import { Button, Card, Empty, InputNumber, Space, Table, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import { formatTwd } from '../lib/money';
import { useCart } from '../store/cart';

export function CartPage() {
  const cart = useCart();
  const nav = useNavigate();

  if (cart.items.length === 0) {
    return (
      <Card>
        <Empty description="購物車是空的">
          <Link to="/">去逛逛商品</Link>
        </Empty>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        購物車
      </Typography.Title>

      <Table
        rowKey={(r) => `${r.product.id}_${r.variantId || 'none'}`}
        pagination={false}
        dataSource={cart.items}
        columns={[
          {
            title: '商品',
            render: (_, r) => {
              const variant = r.variantId ? r.product.variants?.find((v) => v.id === r.variantId) : null;
              const price = variant ? variant.price : r.product.price;
              const displayName = variant ? `${r.product.name} - ${variant.name}` : r.product.name;
              return (
                <Space>
                  {r.product.image_url ? (
                    <img src={r.product.image_url} alt={r.product.name} style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                  ) : null}
                  <div>
                    <div style={{ fontWeight: 600 }}>{displayName}</div>
                    <div style={{ color: '#888' }}>{formatTwd(price)}</div>
                  </div>
                </Space>
              );
            },
          },
          {
            title: '數量',
            width: 120,
            render: (_, r) => (
              <InputNumber
                min={1}
                value={r.quantity}
                onChange={(v) => cart.setQty(r.product.id, Number(v || 1), r.variantId)}
              />
            ),
          },
          {
            title: '小計',
            width: 140,
            render: (_, r) => {
              const variant = r.variantId ? r.product.variants?.find((v) => v.id === r.variantId) : null;
              const price = variant ? variant.price : r.product.price;
              return formatTwd(Number(price) * r.quantity);
            },
          },
          {
            title: '操作',
            width: 120,
            render: (_, r) => (
              <Button danger onClick={() => cart.remove(r.product.id, r.variantId)}>
                移除
              </Button>
            ),
          },
        ]}
      />

      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space direction="vertical">
            <Typography.Text type="secondary">運費</Typography.Text>
            <Typography.Text type="secondary">合計</Typography.Text>
          </Space>
          <Space direction="vertical" style={{ textAlign: 'right' }}>
            <Typography.Text type="secondary">{formatTwd(0)}</Typography.Text>
            <Typography.Text strong style={{ fontSize: 18 }}>
              {formatTwd(cart.totalAmount)}
            </Typography.Text>
          </Space>
        </Space>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => cart.clear()}>清空購物車</Button>
          <Button type="primary" onClick={() => nav('/checkout')}>
            前往結帳
          </Button>
        </div>
      </Card>
    </Space>
  );
}


