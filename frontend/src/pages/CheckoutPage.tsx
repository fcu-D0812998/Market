import { Button, Card, Form, Input, Modal, Space, Typography, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createOrder } from '../lib/api';
import { formatTwd } from '../lib/money';
import { useCart } from '../store/cart';

export function CheckoutPage() {
  const cart = useCart();
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  if (cart.items.length === 0) {
    return (
      <Card>
        <Typography.Text>購物車是空的，無法結帳。</Typography.Text>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        結帳
      </Typography.Title>

      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Typography.Text type="secondary">合計（不含運費）</Typography.Text>
          <Typography.Text strong style={{ fontSize: 18 }}>
            {formatTwd(cart.totalAmount)}
          </Typography.Text>
        </Space>
      </Card>

      <Card title="收件資訊（7-11 門市/地址手填）">
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            // 顯示確認對話框
            Modal.confirm({
              title: '確認下單',
              content: '確定要下單嗎？下單後將無法取消。',
              okText: '確定下單',
              cancelText: '取消',
              okButtonProps: { type: 'primary', danger: false },
              onOk: async () => {
                setSubmitting(true);
                try {
                  const order = await createOrder({
                    customer_name: values.customer_name,
                    customer_phone: values.customer_phone,
                    pickup_store_address: values.pickup_store_address,
                    items: cart.items.map((it) => ({
                      product_id: it.product.id,
                      quantity: it.quantity,
                      variant_id: it.variantId || undefined,
                    })),
                  });
                  cart.clear();
                  nav(`/complete/${order.order_no}`, { state: order });
                } catch (e) {
                  message.error('下單失敗（請確認後端已啟動）');
                } finally {
                  setSubmitting(false);
                }
              },
            });
          }}
        >
          <Form.Item label="姓名" name="customer_name" rules={[{ required: true, message: '請輸入姓名' }]}>
            <Input placeholder="王小明" />
          </Form.Item>
          <Form.Item label="手機" name="customer_phone" rules={[{ required: true, message: '請輸入手機' }]}>
            <Input placeholder="09xxxxxxxx" />
          </Form.Item>
          <Form.Item
            label="7-11 地區/門市"
            name="pickup_store_address"
            rules={[{ required: true, message: '請輸入 7-11 地區及門市名稱' }]}
          >
            <Input.TextArea rows={3} placeholder="例：台北市XX門市 " />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => nav('/cart')}>回購物車</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              下單
            </Button>
          </div>
        </Form>
      </Card>
    </Space>
  );
}


