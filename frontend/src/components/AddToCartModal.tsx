import { InputNumber, Modal, Radio, Space, Typography } from 'antd';
import { useState, useEffect } from 'react';

import type { Product, ProductVariant } from '../lib/api';
import { formatTwd } from '../lib/money';
import { useCart } from '../store/cart';

interface AddToCartModalProps {
    open: boolean;
    product: Product | null;
    onClose: () => void;
}

export function AddToCartModal({ open, product, onClose }: AddToCartModalProps) {
    const cart = useCart();
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [quantity, setQuantity] = useState(1);

    // 當 product 改變時，重設狀態
    useEffect(() => {
        if (product) {
            const firstActive = product.variants?.find((v) => v.is_active) || product.variants?.[0] || null;
            setSelectedVariant(firstActive);
            setQuantity(1);
        }
    }, [product]);

    const handleConfirm = () => {
        if (!product) return;
        if (product.variants && product.variants.length > 0 && !selectedVariant) {
            return; // 需要選擇規格
        }
        cart.add(product, quantity, selectedVariant?.id);
        onClose();
    };

    const handleCancel = () => {
        setQuantity(1);
        onClose();
    };

    const currentPrice = selectedVariant ? selectedVariant.price : product?.price || '0';

    return (
        <Modal
            title="選擇規格和數量"
            open={open}
            onOk={handleConfirm}
            onCancel={handleCancel}
            okText="確認加入"
            cancelText="取消"
        >
            {product && (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                        <Typography.Text strong>商品：</Typography.Text>
                        <Typography.Text>{product.name}</Typography.Text>
                    </div>
                    {product.variants && product.variants.length > 0 ? (
                        <div>
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
                        </div>
                    ) : null}
                    <div>
                        <Typography.Text strong>價格：</Typography.Text>
                        <Typography.Text>{formatTwd(currentPrice)}</Typography.Text>
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
                            {formatTwd(Number(currentPrice) * quantity)}
                        </Typography.Text>
                    </div>
                </Space>
            )}
        </Modal>
    );
}
