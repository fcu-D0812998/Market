import { Button, Card, Checkbox, Col, Input, InputNumber, Modal, Radio, Row, Space, Tag as AntTag, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { listProducts, listTags, type Product, type ProductVariant, type Tag } from '../lib/api';
import { formatTwd } from '../lib/money';
import { useCart } from '../store/cart';

export function ProductsPage() {
  const cart = useCart();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  const filteredParams = useMemo(() => ({ tags: selectedTags, search: search.trim() || undefined }), [selectedTags, search]);

  useEffect(() => {
    void (async () => {
      try {
        const t = await listTags();
        setTags(t);
      } catch (e) {
        message.error('載入標籤失敗');
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const p = await listProducts(filteredParams);
        setProducts(p);
      } catch (e) {
        message.error('載入商品失敗（請確認後端已啟動）');
      } finally {
        setLoading(false);
      }
    })();
  }, [filteredParams]);

  const handleAddToCart = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      // 有規格：開啟 Modal 選擇規格和數量
      const firstActive = product.variants.find((v) => v.is_active) || product.variants[0];
      setSelectedProduct(product);
      setSelectedVariant(firstActive || null);
      setQuantity(1);
      setModalOpen(true);
    } else {
      // 無規格：直接加入購物車
      cart.add(product, 1);
      message.success('已加入購物車');
    }
  };

  const handleConfirmAdd = () => {
    if (!selectedProduct) return;
    if (selectedProduct.variants && selectedProduct.variants.length > 0 && !selectedVariant) {
      message.warning('請選擇規格');
      return;
    }
    cart.add(selectedProduct, quantity, selectedVariant?.id);
    message.success('已加入購物車');
    setModalOpen(false);
    setSelectedProduct(null);
    setSelectedVariant(null);
    setQuantity(1);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        商品
      </Typography.Title>

      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Typography.Text strong>搜尋</Typography.Text>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="輸入商品名稱..." allowClear />
          </Col>
          <Col xs={24} md={16}>
            <Typography.Text strong>標籤篩選</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Checkbox.Group
                value={selectedTags}
                options={tags.map((t) => ({ label: t.name, value: t.name }))}
                onChange={(vals) => setSelectedTags(vals as string[])}
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {products.map((p) => (
          <Col key={p.id} xs={24} sm={12} md={8}>
            <Card
              loading={loading}
              cover={
                p.image_url ? (
                  <img alt={p.name} src={p.image_url} style={{ height: 200, objectFit: 'cover' }} />
                ) : undefined
              }
              actions={[
                <Button
                  type="primary"
                  onClick={() => handleAddToCart(p)}
                  key="add"
                  htmlType="button"
                >
                  加入購物車
                </Button>,
                <Link to={`/products/${p.id}`} key="detail">
                  查看
                </Link>,
              ]}
            >
              <Typography.Title level={5} style={{ marginTop: 0 }}>
                {p.name}
              </Typography.Title>
              <Typography.Text strong>{formatTwd(p.price)}</Typography.Text>
              <div style={{ marginTop: 8 }}>
                {p.tags.map((t) => (
                  <AntTag key={t.id}>{t.name}</AntTag>
                ))}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {!loading && products.length === 0 ? <Typography.Text type="secondary">沒有符合條件的商品</Typography.Text> : null}

      <Modal
        title="選擇規格和數量"
        open={modalOpen}
        onOk={handleConfirmAdd}
        onCancel={() => {
          setModalOpen(false);
          setSelectedProduct(null);
          setSelectedVariant(null);
          setQuantity(1);
        }}
        okText="確認加入"
        cancelText="取消"
      >
        {selectedProduct && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Typography.Text strong>商品：</Typography.Text>
              <Typography.Text>{selectedProduct.name}</Typography.Text>
            </div>
            {selectedProduct.variants && selectedProduct.variants.length > 0 && (
              <>
                <div>
                  <Typography.Text strong>規格：</Typography.Text>
                  <Radio.Group
                    value={selectedVariant?.id}
                    onChange={(e) => {
                      const variant = selectedProduct.variants?.find((v) => v.id === e.target.value);
                      if (variant) {
                        setSelectedVariant(variant);
                      }
                    }}
                  >
                    <Space direction="vertical">
                      {selectedProduct.variants
                        .filter((v) => v.is_active)
                        .map((v) => (
                          <Radio key={v.id} value={v.id}>
                            <Space>
                              <span>{v.name}</span>
                              <span style={{ color: '#888' }}>{formatTwd(v.price)}</span>
                            </Space>
                          </Radio>
                        ))}
                    </Space>
                  </Radio.Group>
                </div>
                {selectedVariant && (
                  <>
                    <div>
                      <Typography.Text strong>價格：</Typography.Text>
                      <Typography.Text>{formatTwd(selectedVariant.price)}</Typography.Text>
                    </div>
                    <div>
                      <Typography.Text strong>數量：</Typography.Text>
                      <InputNumber
                        min={1}
                        max={999}
                        value={quantity}
                        onChange={(v) => setQuantity(v || 1)}
                        style={{ width: 120 }}
                      />
                    </div>
                    <div>
                      <Typography.Text strong>小計：</Typography.Text>
                      <Typography.Text style={{ fontSize: 18, color: '#ff4d4f' }}>
                        {formatTwd(Number(selectedVariant.price) * quantity)}
                      </Typography.Text>
                    </div>
                  </>
                )}
              </>
            )}
          </Space>
        )}
      </Modal>
    </Space>
  );
}


