from django.urls import path

from .views import (
    AdminLoginView,
    AdminLogoutView,
    AdminMeView,
    AdminOrderUpdateView,
    AdminProductDetailView,
    AdminProductListCreateView,
    AdminSettingsView,
    AdminTagDetailView,
    AdminTagListCreateView,
    OrderCreateView,
    OrderDetailView,
    OrderListView,
    ProductDetailView,
    ProductListView,
    TagListView,
    csrf_token_view,
)

urlpatterns = [
    # CSRF Token API（資安：前端需要此 Token）
    path("csrf-token/", csrf_token_view, name="csrf-token"),
    # 公開 API（不需要認證）
    path("tags/", TagListView.as_view(), name="tags-list"),
    path("products/", ProductListView.as_view(), name="products-list"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="products-detail"),
    path("orders/", OrderListView.as_view(), name="orders-list"),
    path("orders/create/", OrderCreateView.as_view(), name="orders-create"),
    path("orders/<str:order_no>/", OrderDetailView.as_view(), name="orders-detail"),
    # 後台認證 API
    path("admin/login/", AdminLoginView.as_view(), name="admin-login"),
    path("admin/logout/", AdminLogoutView.as_view(), name="admin-logout"),
    path("admin/me/", AdminMeView.as_view(), name="admin-me"),
    # 後台管理 API（需要認證）
    path("admin/tags/", AdminTagListCreateView.as_view(), name="admin-tags-list-create"),
    path("admin/tags/<int:pk>/", AdminTagDetailView.as_view(), name="admin-tags-detail"),
    path("admin/products/", AdminProductListCreateView.as_view(), name="admin-products-list-create"),
    path("admin/products/<int:pk>/", AdminProductDetailView.as_view(), name="admin-products-detail"),
    path("admin/settings/", AdminSettingsView.as_view(), name="admin-settings"),
    path("admin/orders/<str:order_no>/", AdminOrderUpdateView.as_view(), name="admin-orders-update"),
]


