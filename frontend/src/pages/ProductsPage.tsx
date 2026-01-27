import { Button, Card, Checkbox, Col, Input, Row, Space, Tag as AntTag, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { AddToCartModal } from '../components/AddToCartModal';
import { listProducts, listTags, type Product, type Tag } from '../lib/api';
import { formatTwd } from '../lib/money';

export function ProductsPage() {
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedProduct(null);
    message.success('已加入購物車');
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

      <AddToCartModal
        open={modalOpen}
        product={selectedProduct}
        onClose={handleModalClose}
      />
    </Space>
  );
}
