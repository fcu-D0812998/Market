import { Button, Card, Divider, Form, Input, InputNumber, Modal, Space, Switch, Table, Tag, Typography, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useState } from 'react';

import type { Product, ProductVariant } from '../lib/api';
import { adminCreateProduct, adminDeleteProduct, adminListProducts, adminUpdateProduct } from '../lib/api';
import { formatTwd } from '../lib/money';

type ProductFormValues = {
  name: string;
  price: number;
  is_active: boolean;
  has_variants: boolean;
  image_url?: string;
  description?: string;
  tag_names?: string;
};

type LocalVariant = {
  name: string;
  price: number;
  image_url: string;
  is_active: boolean;
};

function splitTags(input?: string): string[] {
  if (!input) return [];
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function AdminProductsPage() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<ProductFormValues>();
  const hasVariants = Form.useWatch('has_variants', form) || false;
  const [localVariants, setLocalVariants] = useState<LocalVariant[]>([]);

  const trimmed = useMemo(() => search.trim(), [search]);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await adminListProducts();
      setProducts(res);
    } catch (e) {
      message.error('載入商品失敗（請確認後端已啟動）');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    if (!trimmed) return products;
    return products.filter((p) => p.name.includes(trimmed));
  }, [products, trimmed]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true, has_variants: false, price: 0 });
    setLocalVariants([]);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    form.resetFields();
    // 轉換變體資料
    const variantsData: LocalVariant[] = (p.variants || []).map((v) => ({
      name: v.name,
      price: Number(v.price),
      image_url: v.image_url || '',
      is_active: v.is_active,
    }));
    form.setFieldsValue({
      name: p.name,
      price: Number(p.price),
      is_active: p.is_active,
      has_variants: p.has_variants || false,
      image_url: p.image_url,
      description: p.description,
      tag_names: p.tags.map((t) => t.name).join(', '),
    });
    setLocalVariants(variantsData);
    setOpen(true);
  };

  const addVariant = () => {
    const basePrice = Number(form.getFieldValue('price')) || 0;
    setLocalVariants([...localVariants, { name: '', price: basePrice, image_url: '', is_active: true }]);
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = [...localVariants];
    updated[index] = { ...updated[index], [field]: value };
    setLocalVariants(updated);
  };

  const removeVariant = (index: number) => {
    setLocalVariants(localVariants.filter((_, i) => i !== index));
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        後台：商品管理
      </Typography.Title>

      <Card>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜尋商品名稱..." allowClear style={{ maxWidth: 360 }} />
          <Button type="primary" onClick={openCreate}>
            新增商品
          </Button>
        </Space>
      </Card>

      <Table
        rowKey={(r) => String(r.id)}
        loading={loading}
        dataSource={filtered}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 70 },
          {
            title: '商品',
            render: (_, r) => (
              <Space>
                {r.image_url ? (
                  <img src={r.image_url} alt={r.name} style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                ) : null}
                <div>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div style={{ color: '#888' }}>{formatTwd(r.price)}</div>
                  {r.has_variants && <div style={{ color: '#1890ff', fontSize: 12 }}>有規格</div>}
                </div>
              </Space>
            ),
          },
          {
            title: '標籤',
            render: (_, r) => (
              <Space wrap>
                {r.tags.map((t) => (
                  <Tag key={t.id}>{t.name}</Tag>
                ))}
              </Space>
            ),
          },
          {
            title: '上架',
            dataIndex: 'is_active',
            width: 100,
            render: (v, r) => (
              <Switch
                checked={v}
                onChange={async (checked) => {
                  try {
                    await adminUpdateProduct(r.id, { is_active: checked });
                    message.success('已更新');
                    await reload();
                  } catch {
                    message.error('更新失敗');
                  }
                }}
              />
            ),
          },
          {
            title: '操作',
            width: 220,
            render: (_, r) => (
              <Space>
                <Button onClick={() => openEdit(r)}>編輯</Button>
                <Button
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: '確定刪除商品？',
                      content: '刪除後前台將不再顯示此商品。',
                      okText: '刪除',
                      cancelText: '取消',
                      okButtonProps: { danger: true },
                      onOk: async () => {
                        try {
                          await adminDeleteProduct(r.id);
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
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? '編輯商品' : '新增商品'}
        open={open}
        okText={editing ? '儲存' : '建立'}
        cancelText="取消"
        confirmLoading={saving}
        onCancel={() => setOpen(false)}
        width={800}
        onOk={async () => {
          const values = await form.validateFields();
          setSaving(true);
          try {
            const payload: any = {
              name: values.name,
              price: Number(values.price),
              is_active: Boolean(values.is_active),
              has_variants: Boolean(values.has_variants),
              image_url: values.image_url || '',
              description: values.description || '',
              tag_names: splitTags(values.tag_names),
            };

            if (values.has_variants) {
              // 驗證規格
              if (localVariants.length === 0) {
                message.error('請至少新增一個規格');
                setSaving(false);
                return;
              }
              for (const variant of localVariants) {
                if (!variant.name.trim()) {
                  message.error('規格名稱不能為空');
                  setSaving(false);
                  return;
                }
              }
              // 準備變體資料
              payload.variants = localVariants.map((v, idx) => ({
                name: v.name,
                price: v.price,
                image_url: v.image_url || '',
                is_active: v.is_active,
                order: idx,
              }));
            }

            if (editing) {
              await adminUpdateProduct(editing.id, payload);
              message.success('已儲存');
            } else {
              await adminCreateProduct(payload);
              message.success('已建立');
            }
            setOpen(false);
            await reload();
          } catch (e) {
            message.error('儲存失敗');
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form form={form} layout="vertical" initialValues={{ is_active: true, has_variants: false }}>
          <Form.Item label="商品名稱" name="name" rules={[{ required: true, message: '請輸入商品名稱' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="價格（TWD）" name="price" rules={[{ required: true, message: '請輸入價格' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="上架" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="啟用規格" name="has_variants" valuePropName="checked">
            <Switch
              onChange={(checked) => {
                if (!checked) {
                  setLocalVariants([]);
                }
              }}
            />
          </Form.Item>
          <Form.Item label="圖片網址（image_url）" name="image_url">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="標籤（用逗號分隔）" name="tag_names">
            <Input placeholder="例：新品, 熱賣" />
          </Form.Item>

          {hasVariants && (
            <>
              <Divider>規格設定</Divider>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {localVariants.map((variant, vIdx) => (
                  <Card key={vIdx} size="small" title={`規格 ${vIdx + 1}`} extra={<Button danger icon={<DeleteOutlined />} onClick={() => removeVariant(vIdx)} size="small">刪除</Button>}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <span style={{ width: 60 }}>名稱：</span>
                        <Input
                          placeholder="規格名稱（例如：紅色、藍色）"
                          value={variant.name}
                          onChange={(e) => updateVariant(vIdx, 'name', e.target.value)}
                          style={{ width: 200 }}
                        />
                      </Space>
                      <Space>
                        <span style={{ width: 60 }}>價格：</span>
                        <InputNumber
                          min={0}
                          value={variant.price}
                          onChange={(v) => updateVariant(vIdx, 'price', v ?? 0)}
                          prefix="NT$"
                          style={{ width: 200 }}
                        />
                        <Switch
                          checked={variant.is_active}
                          onChange={(checked) => updateVariant(vIdx, 'is_active', checked)}
                          checkedChildren="啟用"
                          unCheckedChildren="停用"
                        />
                      </Space>
                      <Space>
                        <span style={{ width: 60 }}>圖片：</span>
                        <Input
                          placeholder="圖片網址（可選）"
                          value={variant.image_url}
                          onChange={(e) => updateVariant(vIdx, 'image_url', e.target.value)}
                          style={{ width: 400 }}
                        />
                      </Space>
                    </Space>
                  </Card>
                ))}
                <Button icon={<PlusOutlined />} onClick={addVariant} type="dashed" block>
                  新增規格
                </Button>
              </Space>
            </>
          )}
        </Form>
      </Modal>
    </Space>
  );
}
