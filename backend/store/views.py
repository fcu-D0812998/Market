from __future__ import annotations

from random import randint

from django.contrib.auth import login, logout
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order, OrderItem, Product, ShopSettings, Tag
from .serializers import (
    LoginSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    ProductSerializer,
    ProductWriteSerializer,
    ShopSettingsSerializer,
    TagSerializer,
    UserSerializer,
    calculate_total,
    get_product_name,
    get_product_price,
)


# ========== 認證相關 View ==========


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def csrf_token_view(request):
    """
    取得 CSRF Token（資安：前端需要此 Token 才能發送 POST/PUT/DELETE 請求）
    GET /api/csrf-token/
    """
    from django.middleware.csrf import get_token
    token = get_token(request)
    return Response({"csrfToken": token})


class AdminLoginView(APIView):
    """
    後台登入 API（資安：使用 Session 認證）
    POST /api/admin/login/
    Body: { "username": "...", "password": "..." }
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        # 使用 Django 的 login() 建立 Session（資安：自動處理 Session 安全）
        login(request, user)

        return Response(
            {
                "message": "登入成功",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class AdminLogoutView(APIView):
    """
    後台登出 API
    POST /api/admin/logout/
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"message": "已登出"}, status=status.HTTP_200_OK)


class AdminMeView(APIView):
    """
    檢查當前登入狀態 API
    GET /api/admin/me/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "authenticated": True,
                "user": UserSerializer(request.user).data,
            }
        )


# ========== 公開 API ==========


class TagListView(generics.ListAPIView):
    queryset = Tag.objects.order_by("name")
    serializer_class = TagSerializer


class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).prefetch_related("tags", "variants").order_by("id")

        # tags=tag1,tag2
        tags_param = self.request.query_params.get("tags", "").strip()
        if tags_param:
            tag_names = [t.strip() for t in tags_param.split(",") if t.strip()]
            if tag_names:
                qs = qs.filter(tags__name__in=tag_names).distinct()

        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

        return qs


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True).prefetch_related("tags", "variants")
    serializer_class = ProductSerializer


# ========== 後台管理 API（需要認證）==========


class AdminTagListCreateView(generics.ListCreateAPIView):
    """
    後台標籤管理（資安：需要認證）
    - GET: list all tags
    - POST: create tag
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Tag.objects.order_by("name")
    serializer_class = TagSerializer


class AdminTagDetailView(generics.RetrieveDestroyAPIView):
    """
    後台標籤管理（資安：需要認證）
    - GET: retrieve a tag
    - DELETE: delete tag
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Tag.objects.all()
    serializer_class = TagSerializer


class AdminProductListCreateView(generics.ListCreateAPIView):
    """
    後台商品管理（資安：需要認證）
    - GET: list all products (including inactive)
    - POST: create product (supports tag_names)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Product.objects.all().prefetch_related("tags", "variants").order_by("id")

    def get_serializer_class(self):
        if self.request.method == "GET":
            return ProductSerializer
        return ProductWriteSerializer


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    後台商品管理（資安：需要認證）
    - GET: retrieve a product
    - PATCH/PUT: update (supports tag_names)
    - DELETE: delete product
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Product.objects.all().prefetch_related("tags", "variants")
    serializer_class = ProductWriteSerializer

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        return Response(ProductSerializer(obj).data)


class AdminOrderUpdateView(APIView):
    """
    後台訂單管理（資安：需要認證）
    Body: { "status": "NEW" | "CONFIRMED" | "CANCELLED" }
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, order_no: str):
        status_value = (request.data.get("status") or "").strip()
        if status_value not in {Order.Status.NEW, Order.Status.CONFIRMED, Order.Status.CANCELLED}:
            return Response({"detail": "status 不合法"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(order_no=order_no)
        except Order.DoesNotExist:
            return Response({"detail": "找不到訂單"}, status=status.HTTP_404_NOT_FOUND)

        order.status = status_value
        order.save(update_fields=["status", "updated_at"])
        data = OrderSerializer(order).data
        data.update(_extras_for_order(order))
        return Response(data)


class AdminSettingsView(APIView):
    """
    後台商店設定（資安：需要認證）
    GET: current settings
    PATCH: update fields { line_oa_id, bank_name_code, bank_account }
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        s = _get_settings()
        return Response(ShopSettingsSerializer(s).data)

    def patch(self, request):
        s = _get_settings()
        serializer = ShopSettingsSerializer(s, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        _clear_settings_cache()  # 清除緩存，下次查詢時重新載入
        return Response(serializer.data)


class ApiRootView(APIView):
    def get(self, request):
        return Response(
            {
                "message": "Market API is running.",
                "endpoints": {
                    "tags": "/api/tags/",
                    "products": "/api/products/",
                    "orders_list": "/api/orders/",
                    "orders_create": "/api/orders/create/",
                    "admin_login": "/api/admin/login/",
                    "admin_logout": "/api/admin/logout/",
                    "admin_me": "/api/admin/me/",
                    "admin_products": "/api/admin/products/",
                    "admin_orders_update": "/api/admin/orders/<order_no>/",
                    "admin_settings": "/api/admin/settings/",
                },
            }
        )


def _line_chat_url(line_oa_id: str) -> str:
    return f"https://line.me/R/ti/p/{line_oa_id}"


# 模組級緩存：避免每次請求都查詢資料庫
_settings_cache: ShopSettings | None = None


def _get_settings() -> ShopSettings:
    global _settings_cache
    if _settings_cache is None:
        _settings_cache, _ = ShopSettings.objects.get_or_create(singleton_key="default")
    return _settings_cache


def _clear_settings_cache() -> None:
    """清除設定緩存（在設定更新時調用）"""
    global _settings_cache
    _settings_cache = None


def _extras_for_order(order: Order) -> dict:
    s = _get_settings()
    chat_url = _line_chat_url(s.line_oa_id)
    return {
        "transfer": {
            "bank_name_code": s.bank_name_code,
            "bank_account": s.bank_account,
            "amount": str(order.total_amount),
        },
        "line": {
            "oa_id": s.line_oa_id,
            "chat_url": chat_url,
            "add_friend_url": chat_url,
        },
    }


def _generate_order_no() -> str:
    """生成訂單編號，格式：MKT-YYYYMMDD-HHMMSS-RAND"""
    now = timezone.localtime()
    return f"MKT-{now:%Y%m%d-%H%M%S}-{randint(1000, 9999)}"


def _validate_order_items(items: list[dict], products_by_id: dict[int, Product]) -> tuple[list[int], Decimal]:
    """驗證訂單項目並計算總金額，返回 (missing_product_ids, total_amount)"""
    product_ids = sorted({it["product_id"] for it in items})
    missing = [pid for pid in product_ids if pid not in products_by_id]
    total_amount = calculate_total(items, products_by_id)
    return missing, total_amount


def _create_order_items(order: Order, items: list[dict], products_by_id: dict[int, Product]) -> None:
    """建立訂單項目"""
    order_items: list[OrderItem] = []
    for it in items:
        product = products_by_id[it["product_id"]]
        qty = int(it["quantity"])
        variant_id = it.get("variant_id")
        unit_price = get_product_price(product, variant_id)
        product_name = get_product_name(product, variant_id)
        line_total = unit_price * qty
        order_items.append(
            OrderItem(
                order=order,
                product=product,
                product_name_snapshot=product_name,
                unit_price_snapshot=unit_price,
                quantity=qty,
                line_total=line_total,
            )
        )
    OrderItem.objects.bulk_create(order_items)


class OrderCreateView(APIView):
    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        items = data["items"]
        product_ids = sorted({it["product_id"] for it in items})
        products = list(Product.objects.filter(id__in=product_ids, is_active=True))
        products_by_id = {p.id: p for p in products}

        missing, total_amount = _validate_order_items(items, products_by_id)
        if missing:
            return Response(
                {"detail": f"找不到商品或已下架: {missing}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # 使用資料庫唯一約束保證訂單編號唯一性，衝突時重試（最多 5 次）
            max_retries = 5
            for attempt in range(max_retries):
                order_no = _generate_order_no()
                try:
                    order = Order.objects.create(
                        order_no=order_no,
                        customer_name=data["customer_name"],
                        customer_phone=data["customer_phone"],
                        pickup_store_address=data["pickup_store_address"],
                        total_amount=total_amount,
                        status=Order.Status.NEW,
                    )
                    break
                except IntegrityError:
                    if attempt == max_retries - 1:
                        return Response(
                            {"detail": "無法生成唯一訂單編號，請稍後再試"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        )

            _create_order_items(order, items, products_by_id)

        resp = OrderSerializer(order).data
        resp.update(_extras_for_order(order))
        return Response(resp, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        qs = Order.objects.prefetch_related("items").order_by("-created_at")
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(Q(order_no__icontains=search) | Q(customer_phone__icontains=search))
        return qs


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    lookup_field = "order_no"
    queryset = Order.objects.prefetch_related("items").all()

    def retrieve(self, request, *args, **kwargs):
        order = self.get_object()
        data = OrderSerializer(order).data
        data.update(_extras_for_order(order))
        return Response(data)
