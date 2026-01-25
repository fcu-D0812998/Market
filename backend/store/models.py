from django.db import models


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self) -> str:
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=0)
    is_active = models.BooleanField(default=True)
    tags = models.ManyToManyField(Tag, related_name="products", blank=True)
    image_url = models.URLField(blank=True, default="")
    description = models.TextField(blank=True, default="")

    def __str__(self) -> str:
        return self.name


class ProductVariant(models.Model):
    """商品規格（例如：紅色、藍色、綠色）"""
    product = models.ForeignKey(Product, related_name="variants", on_delete=models.CASCADE)
    name = models.CharField(max_length=50, default="")  # 規格名稱，例如：紅色、藍色
    price = models.DecimalField(max_digits=10, decimal_places=0)  # 這個規格的價格
    image_url = models.URLField(blank=True, default="")  # 這個規格的圖片（可選）
    is_active = models.BooleanField(default=True)  # 是否啟用
    order = models.PositiveIntegerField(default=0)  # 排序

    class Meta:
        ordering = ["order", "id"]
        unique_together = [["product", "name"]]  # 同一商品不能有重複的規格名稱

    def __str__(self) -> str:
        return f"{self.product.name} - {self.name}"


class Order(models.Model):
    class Status(models.TextChoices):
        NEW = "NEW", "新訂單"
        CONFIRMED = "CONFIRMED", "已確認"
        CANCELLED = "CANCELLED", "已取消"

    order_no = models.CharField(max_length=32, unique=True, db_index=True)
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=30)
    pickup_store_address = models.TextField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.order_no


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.SET_NULL)
    product_name_snapshot = models.CharField(max_length=200)
    unit_price_snapshot = models.DecimalField(max_digits=10, decimal_places=0)
    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=10, decimal_places=0)

    def __str__(self) -> str:
        return f"{self.order.order_no} - {self.product_name_snapshot} x {self.quantity}"


class ShopSettings(models.Model):
    """
    Singleton settings row for the shop.
    This is stored in DB so admin can edit without code changes.
    """

    singleton_key = models.CharField(max_length=20, unique=True, default="default")

    line_oa_id = models.CharField(max_length=50, default="@032emqnn")
    bank_name_code = models.CharField(max_length=100, blank=True, default="")
    bank_account = models.CharField(max_length=100, blank=True, default="")

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return "ShopSettings"
