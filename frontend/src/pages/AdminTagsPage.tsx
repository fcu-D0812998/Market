import { Button, Card, Form, Input, Modal, Space, Table, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import type { Tag } from '../lib/api';
import { adminCreateTag, adminDeleteTag, adminListTags } from '../lib/api';

export function AdminTagsPage() {
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<{ name: string }>();

  const trimmed = useMemo(() => search.trim(), [search]);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await adminListTags();
      setTags(res);
    } catch (e) {
      message.error('載入標籤失敗（請確認後端已啟動）');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    if (!trimmed) return tags;
    return tags.filter((t) => t.name.includes(trimmed));
  }, [tags, trimmed]);

  const openCreate = () => {
    form.resetFields();
    setOpen(true);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        後台：標籤管理
      </Typography.Title>

      <Card>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜尋標籤名稱..." allowClear style={{ maxWidth: 360 }} />
          <Button type="primary" onClick={openCreate}>
            新增標籤
          </Button>
        </Space>
      </Card>

      <Table
        rowKey={(r) => String(r.id)}
        loading={loading}
        dataSource={filtered}
        pagination={{ pageSize: 20 }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 70 },
          { title: '標籤名稱', dataIndex: 'name' },
          {
            title: '操作',
            width: 120,
            render: (_, r) => (
              <Button
                danger
                onClick={() => {
                  Modal.confirm({
                    title: '確定刪除標籤？',
                    content: `刪除標籤「${r.name}」後，使用此標籤的商品將不再顯示此標籤。`,
                    okText: '刪除',
                    cancelText: '取消',
                    okButtonProps: { danger: true },
                    onOk: async () => {
                      try {
                        await adminDeleteTag(r.id);
                        message.success('已刪除');
                        await reload();
                      } catch {
                        message.error('刪除失敗');
                      }
                    },
                  });
                }}
              >
                刪除
              </Button>
            ),
          },
        ]}
      />

      <Modal
        title="新增標籤"
        open={open}
        okText="建立"
        cancelText="取消"
        confirmLoading={saving}
        onCancel={() => setOpen(false)}
        onOk={async () => {
          const values = await form.validateFields();
          setSaving(true);
          try {
            await adminCreateTag({ name: values.name });
            message.success('已建立');
            setOpen(false);
            await reload();
          } catch (e) {
            message.error('建立失敗（標籤名稱可能已存在）');
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="標籤名稱" name="name" rules={[{ required: true, message: '請輸入標籤名稱' }]}>
            <Input placeholder="例：新品、熱賣、限時優惠" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

