import { Button, Card, InputNumber, Modal, Radio, Space, Tag as AntTag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type { Product, ProductVariant } from '../lib/api';
import { formatTwd } from '../lib/money';
import { useCart } from '../store/cart';

export function ProductDetailPage() {
  const { id } = useParams();
  const cart = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    void (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}/`);
        if (!res.ok) throw new Error('failed');
        const data = (await res.json()) as Product;
        setProduct(data);
        // 如果有規格，預設選擇第一個啟用的規格
        if (data.variants && data.variants.length > 0) {
          const firstActive = data.variants.find((v) => v.is_active) || data.variants[0];
          if (firstActive) {
            setSelectedVariant(firstActive);
          } else {
            // 如果沒有啟用的規格，選擇第一個
            setSelectedVariant(data.variants[0]);
          }
        } else {
          setSelectedVariant(null);
        }
      } catch (e) {
        message.error('載入商品失敗');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    if (product.variants && product.variants.length > 0) {
      // 有規格：開啟 Modal 選擇規格和數量
      if (!selectedVariant) {
        message.warning('請先選擇規格');
        return;
      }
      setModalOpen(true);
    } else {
      // 無規格：直接加入購物車
      cart.add(product, 1);
      message.success('已加入購物車');
    }
  };

  const handleConfirmAdd = () => {
    if (!product || !selectedVariant) return;
    cart.add(product, quantity, selectedVariant.id);
    message.success('已加入購物車');
    setModalOpen(false);
    setQuantity(1);
  };

  if (!product && !loading) {
    return (
      <Card>
        <Space direction="vertical">
          <Typography.Text>找不到商品</Typography.Text>
          <Link to="/">回商品列表</Link>
        </Space>
      </Card>
    );
  }

  const currentPrice = selectedVariant ? selectedVariant.price : product?.price || '0';

  return (
    <>
      <Card loading={loading}>
        {product ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Link to="/">← 回商品列表</Link>
            {product.image_url ? (
              <img alt={product.name} src={product.image_url} style={{ width: '100%', maxHeight: 360, objectFit: 'cover' }} />
            ) : null}
            <Typography.Title level={3} style={{ margin: 0 }}>
              {product.name}
            </Typography.Title>
            <Typography.Text strong style={{ fontSize: 18 }}>
              {formatTwd(currentPrice)}
            </Typography.Text>
            {product.variants && product.variants.length > 0 && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Text strong>規格：</Typography.Text>
                <Radio.Group
                  value={selectedVariant?.id}
                  onChange={(e) => {
                    const variant = product.variants?.find((v) => v.id === e.target.value);
                    if (variant) {
                      setSelectedVariant(variant);
                    }
                  }}
                >
                  <Space direction="vertical">
                    {product.variants
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
              </Space>
            )}
            <div>
              {product.tags.map((t) => (
                <AntTag key={t.id}>{t.name}</AntTag>
              ))}
            </div>
            {product.description ? <Typography.Paragraph>{product.description}</Typography.Paragraph> : null}
            <Button type="primary" onClick={handleAddToCart} htmlType="button">
              加入購物車
            </Button>
          </Space>
        ) : null}
      </Card>

      <Modal
        title="選擇規格和數量"
        open={modalOpen}
        onOk={handleConfirmAdd}
        onCancel={() => {
          setModalOpen(false);
          setQuantity(1);
        }}
        okText="確認加入"
        cancelText="取消"
      >
        {product && selectedVariant && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Typography.Text strong>商品：</Typography.Text>
              <Typography.Text>{product.name}</Typography.Text>
            </div>
            <div>
              <Typography.Text strong>規格：</Typography.Text>
              <Typography.Text>{selectedVariant.name}</Typography.Text>
            </div>
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
          </Space>
        )}
      </Modal>
    </>
  );
}
