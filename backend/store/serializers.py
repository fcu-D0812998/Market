from __future__ import annotations

from decimal import Decimal

from rest_framework import serializers

from .models import Order, OrderItem, Product, ProductVariant, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ["id", "name", "price", "image_url", "is_active", "order"]


class ProductSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    has_variants = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "price", "is_active", "has_variants", "image_url", "description", "tags", "variants"]

    def get_has_variants(self, obj: Product) -> bool:
        """從 variants 推導，而非從資料庫欄位讀取"""
        return obj.variants.exists()




class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=999)
    variant_id = serializers.IntegerField(required=False, allow_null=True)


class OrderCreateSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=100)
    customer_phone = serializers.CharField(max_length=30)
    pickup_store_address = serializers.CharField()
    items = OrderItemCreateSerializer(many=True, allow_empty=False)


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name_snapshot",
            "unit_price_snapshot",
            "quantity",
            "line_total",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_no",
            "customer_name",
            "customer_phone",
            "pickup_store_address",
            "total_amount",
            "status",
            "created_at",
            "updated_at",
            "items",
        ]




def _get_variant(product: Product, variant_id: int | None) -> ProductVariant | None:
    """統一的 variant 查找邏輯：消除重複查詢"""
    if not variant_id:
        return None
    return product.variants.filter(id=variant_id, is_active=True).first()


def get_product_price(product: Product, variant_id: int | None) -> Decimal:
    """統一的價格計算邏輯：如果有 variant_id 且存在，使用 variant 價格，否則使用 product 價格"""
    variant = _get_variant(product, variant_id)
    return variant.price if variant else product.price


def get_product_name(product: Product, variant_id: int | None) -> str:
    """統一的商品名稱邏輯：如果有 variant_id 且存在，組合名稱，否則使用 product 名稱"""
    variant = _get_variant(product, variant_id)
    return f"{product.name} - {variant.name}" if variant else product.name


def calculate_total(items: list[dict], products_by_id: dict[int, Product]) -> Decimal:
    """計算訂單總金額"""
    total = Decimal("0")
    for it in items:
        product = products_by_id[it["product_id"]]
        qty = int(it["quantity"])
        price = get_product_price(product, it.get("variant_id"))
        total += price * qty
    return total


