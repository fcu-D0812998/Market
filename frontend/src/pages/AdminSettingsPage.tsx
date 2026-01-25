import { Button, Card, Form, Input, Space, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

import { adminGetSettings, adminUpdateSettings } from '../lib/api';

export function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const s = await adminGetSettings();
        form.setFieldsValue(s);
      } catch {
        message.error('載入設定失敗（請確認後端已啟動）');
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        後台：商店設定
      </Typography.Title>

      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            setSaving(true);
            try {
              await adminUpdateSettings({
                line_oa_id: values.line_oa_id,
                bank_name_code: values.bank_name_code,
                bank_account: values.bank_account,
              });
              message.success('已儲存');
            } catch {
              message.error('儲存失敗');
            } finally {
              setSaving(false);
            }
          }}
        >
          <Form.Item label="LINE 官方帳號 ID" name="line_oa_id" rules={[{ required: true, message: '請輸入 LINE OA ID（例如 @032emqnn）' }]}>
            <Input placeholder="@032emqnn" />
          </Form.Item>
          <Form.Item label="銀行名稱/代碼" name="bank_name_code">
            <Input placeholder="例如：台灣銀行 004" />
          </Form.Item>
          <Form.Item label="轉帳帳號" name="bank_account">
            <Input placeholder="例如：123-456-789-012" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" htmlType="submit" loading={saving}>
              儲存
            </Button>
          </div>
        </Form>
      </Card>
    </Space>
  );
}


