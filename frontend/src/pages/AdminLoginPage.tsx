import { Button, Card, Form, Input, Space, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../store/auth';

export function AdminLoginPage() {
  const { user, loading, login } = useAuth();
  const nav = useNavigate();
  const [form] = Form.useForm();

  // 如果已經登入，重定向到商品管理
  useEffect(() => {
    if (!loading && user) {
      nav('/products', { replace: true });
    }
  }, [user, loading, nav]);

  const onFinish = async (values: { username: string; password: string }) => {
    const success = await login(values.username, values.password);
    if (success) {
      nav('/products', { replace: true });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography.Text>載入中...</Typography.Text>
      </div>
    );
  }

  if (user) {
    return null; // 會在 useEffect 中重定向
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Typography.Title level={3} style={{ margin: 0 }}>
              後台登入
            </Typography.Title>
            <Typography.Text type="secondary">請輸入您的帳號密碼</Typography.Text>
          </div>

          <Form form={form} layout="vertical" onFinish={onFinish} size="large">
            <Form.Item
              name="username"
              rules={[{ required: true, message: '請輸入使用者名稱' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="使用者名稱" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '請輸入密碼' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密碼" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                登入
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}

