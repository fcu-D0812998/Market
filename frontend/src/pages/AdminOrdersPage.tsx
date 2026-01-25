import { Button, Card, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { listOrders, type Order } from '../lib/api';
import { adminUpdateOrderStatus } from '../lib/api';
import { formatTwd } from '../lib/money';

export function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  const trimmed = useMemo(() => search.trim(), [search]);

  const reload = async (q?: string) => {
    setLoading(true);
    try {
      const res = await listOrders({ search: q });
      setOrders(res);
    } catch (e) {
      message.error('載入訂單失敗（請確認後端已啟動）');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      void reload(trimmed || undefined);
    }, 200);
    return () => clearTimeout(t);
  }, [trimmed]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        後台：訂單列表
      </Typography.Title>

      <Card>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="輸入訂單編號或手機搜尋..."
          allowClear
        />
      </Card>

      <Table
        rowKey={(r) => String(r.id)}
        loading={loading}
        dataSource={orders}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: '下單時間', dataIndex: 'created_at', width: 180, render: (v) => new Date(v).toLocaleString('zh-TW') },
          { title: '訂單編號', dataIndex: 'order_no', width: 200 },
          { title: '姓名', dataIndex: 'customer_name', width: 120 },
          { title: '手機', dataIndex: 'customer_phone', width: 140 },
          { title: '7-11 門市/地址', dataIndex: 'pickup_store_address' },
          { title: '金額', dataIndex: 'total_amount', width: 120, render: (v) => formatTwd(v) },
          {
            title: '狀態',
            dataIndex: 'status',
            width: 120,
            render: (s) => <Tag color={s === 'CONFIRMED' ? 'green' : s === 'CANCELLED' ? 'red' : 'blue'}>{s}</Tag>,
          },
          {
            title: '管理',
            width: 220,
            render: (_, r) => (
              <Space>
                <Button
                  onClick={() => {
                    Modal.info({
                      title: `訂單明細：${r.order_no}`,
                      width: 720,
                      content: (
                        <div>
                          <div style={{ marginBottom: 8 }}>
                            <strong>收件：</strong>
                            {r.customer_name} / {r.customer_phone} / {r.pickup_store_address}
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <strong>品項：</strong>
                          </div>
                          <ul style={{ paddingLeft: 18 }}>
                            {r.items.map((it) => (
                              <li key={it.id}>
                                {it.product_name_snapshot} × {it.quantity}（{formatTwd(it.unit_price_snapshot)}）= {formatTwd(it.line_total)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ),
                      okText: '關閉',
                    });
                  }}
                >
                  看明細
                </Button>
                <Select
                  value={r.status}
                  style={{ width: 120 }}
                  disabled={updating === r.order_no}
                  onChange={async (next) => {
                    setUpdating(r.order_no);
                    try {
                      await adminUpdateOrderStatus(r.order_no, next as any);
                      message.success('狀態已更新');
                      await reload(trimmed || undefined);
                    } catch {
                      message.error('更新失敗');
                    } finally {
                      setUpdating(null);
                    }
                  }}
                  options={[
                    { value: 'NEW', label: 'NEW' },
                    { value: 'CONFIRMED', label: 'CONFIRMED' },
                    { value: 'CANCELLED', label: 'CANCELLED' },
                  ]}
                />
              </Space>
            ),
          },
        ]}
      />
    </Space>
  );
}


