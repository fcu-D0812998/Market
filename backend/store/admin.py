from django.contrib import admin

from .models import Order, OrderItem, Product, Tag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    search_fields = ["name"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "price", "is_active"]
    list_filter = ["is_active", "tags"]
    search_fields = ["name", "description"]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = [
        "product",
        "product_name_snapshot",
        "unit_price_snapshot",
        "quantity",
        "line_total",
    ]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["order_no", "customer_name", "customer_phone", "total_amount", "status", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["order_no", "customer_phone", "customer_name"]
    inlines = [OrderItemInline]

# Register your models here.
