from django.contrib import admin
from .models import Tag, Product, ProductVariant, Order, OrderItem, ShopSettings

# 自訂 Django Admin 標題
admin.site.site_header = '阿立小舖 後台管理'
admin.site.site_title = '後台管理'
admin.site.index_title = '管理首頁'


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """標籤管理"""
    list_display = ['id', 'name']
    search_fields = ['name']
    ordering = ['name']


class ProductVariantInline(admin.TabularInline):
    """商品規格 - 內嵌在商品編輯頁面"""
    model = ProductVariant
    extra = 1
    fields = ['name', 'price', 'image_url', 'is_active', 'order']
    ordering = ['order', 'id']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """商品管理"""
    list_display = ['id', 'name', 'price', 'is_active', 'get_tags', 'get_variants_count']
    list_filter = ['is_active', 'tags']
    search_fields = ['name', 'description']
    list_editable = ['is_active']
    filter_horizontal = ['tags']
    inlines = [ProductVariantInline]
    ordering = ['-id']
    
    fieldsets = [
        ('基本資訊', {
            'fields': ['name', 'price', 'is_active']
        }),
        ('圖片與描述', {
            'fields': ['image_url', 'description']
        }),
        ('分類標籤', {
            'fields': ['tags']
        }),
    ]
    
    @admin.display(description='標籤')
    def get_tags(self, obj):
        return ', '.join([tag.name for tag in obj.tags.all()])
    
    @admin.display(description='規格數量')
    def get_variants_count(self, obj):
        return obj.variants.count()


class OrderItemInline(admin.TabularInline):
    """訂單項目 - 內嵌在訂單編輯頁面"""
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'product_name_snapshot', 'unit_price_snapshot', 'quantity', 'line_total']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """訂單管理"""
    list_display = ['order_no', 'customer_name', 'customer_phone', 'total_amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['order_no', 'customer_name', 'customer_phone']
    list_editable = ['status']
    readonly_fields = ['order_no', 'customer_name', 'customer_phone', 'pickup_store_address', 
                       'total_amount', 'created_at', 'updated_at']
    inlines = [OrderItemInline]
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = [
        ('訂單資訊', {
            'fields': ['order_no', 'status', 'total_amount', 'created_at', 'updated_at']
        }),
        ('顧客資訊', {
            'fields': ['customer_name', 'customer_phone', 'pickup_store_address']
        }),
    ]
    
    def has_add_permission(self, request):
        # 訂單只能由前台建立，後台不能手動新增
        return False


@admin.register(ShopSettings)
class ShopSettingsAdmin(admin.ModelAdmin):
    """店舖設定"""
    list_display = ['singleton_key', 'line_oa_id', 'bank_name_code', 'updated_at']
    readonly_fields = ['singleton_key', 'updated_at']
    
    fieldsets = [
        ('LINE 官方帳號', {
            'fields': ['line_oa_id'],
            'description': '設定 LINE 官方帳號 ID，用於顧客聯繫'
        }),
        ('轉帳資訊', {
            'fields': ['bank_name_code', 'bank_account'],
            'description': '設定銀行轉帳資訊，顯示在訂單完成頁面'
        }),
        ('系統資訊', {
            'fields': ['singleton_key', 'updated_at'],
            'classes': ['collapse']
        }),
    ]
    
    def has_add_permission(self, request):
        # 只能有一筆設定，不能新增
        return not ShopSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # 不能刪除設定
        return False
