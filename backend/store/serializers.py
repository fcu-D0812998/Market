from __future__ import annotations

from decimal import Decimal

from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import Order, OrderItem, Product, ProductVariant, ShopSettings, Tag


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


class ProductVariantWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ["id", "name", "price", "image_url", "is_active", "order"]


class ProductWriteSerializer(serializers.ModelSerializer):
    tag_names = serializers.ListField(child=serializers.CharField(), required=False)
    variants = ProductVariantWriteSerializer(many=True, required=False)

    class Meta:
        model = Product
        fields = ["id", "name", "price", "is_active", "image_url", "description", "tag_names", "variants"]

    def validate_tag_names(self, value):
        cleaned = []
        for v in value:
            v = (v or "").strip()
            if v:
                cleaned.append(v)
        return cleaned

    def create(self, validated_data):
        tag_names = validated_data.pop("tag_names", [])
        variants_data = validated_data.pop("variants", [])
        product = super().create(validated_data)
        if tag_names:
            tags = [Tag.objects.get_or_create(name=n)[0] for n in tag_names]
            product.tags.set(tags)
        # 建立變體
        for variant_data in variants_data:
            ProductVariant.objects.create(product=product, **variant_data)
        return product

    def update(self, instance, validated_data):
        tag_names = validated_data.pop("tag_names", None)
        variants_data = validated_data.pop("variants", None)
        product = super().update(instance, validated_data)
        if tag_names is not None:
            tags = [Tag.objects.get_or_create(name=n)[0] for n in tag_names]
            product.tags.set(tags)
        # 更新變體（簡化：刪除舊的，建立新的）
        if variants_data is not None:
            ProductVariant.objects.filter(product=product).delete()
            for variant_data in variants_data:
                ProductVariant.objects.create(product=product, **variant_data)
        return product


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


class ShopSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopSettings
        fields = ["line_oa_id", "bank_name_code", "bank_account", "updated_at"]


class LoginSerializer(serializers.Serializer):
    """登入序列化器（資安：不返回密碼）"""

    username = serializers.CharField(required=True, max_length=150)
    password = serializers.CharField(required=True, write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        if username and password:
            # 使用 Django 內建的 authenticate（會自動處理密碼雜湊驗證）
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError("使用者名稱或密碼錯誤")
            if not user.is_active:
                raise serializers.ValidationError("此帳號已被停用")
            attrs["user"] = user
        else:
            raise serializers.ValidationError("請提供使用者名稱和密碼")

        return attrs


class UserSerializer(serializers.Serializer):
    """使用者資訊序列化器（資安：不返回敏感資訊）"""

    id = serializers.IntegerField()
    username = serializers.CharField()


def get_product_price(product: Product, variant_id: int | None) -> Decimal:
    """統一的價格計算邏輯：如果有 variant_id 且存在，使用 variant 價格，否則使用 product 價格"""
    if variant_id:
        variant = product.variants.filter(id=variant_id, is_active=True).first()
        return variant.price if variant else product.price
    return product.price


def get_product_name(product: Product, variant_id: int | None) -> str:
    """統一的商品名稱邏輯：如果有 variant_id 且存在，組合名稱，否則使用 product 名稱"""
    if variant_id:
        variant = product.variants.filter(id=variant_id, is_active=True).first()
        return f"{product.name} - {variant.name}" if variant else product.name
    return product.name


def calculate_total(items: list[dict], products_by_id: dict[int, Product]) -> Decimal:
    """計算訂單總金額"""
    total = Decimal("0")
    for it in items:
        product = products_by_id[it["product_id"]]
        qty = int(it["quantity"])
        price = get_product_price(product, it.get("variant_id"))
        total += price * qty
    return total


