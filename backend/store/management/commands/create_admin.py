"""
建立管理員使用者的命令（資安：使用 Django 內建的 User 模型）
用法：python manage.py create_admin <username> <password>
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()


class Command(BaseCommand):
    help = "建立管理員使用者（資安：密碼會自動使用 PBKDF2 雜湊）"

    def add_arguments(self, parser):
        parser.add_argument("username", type=str, help="使用者名稱")
        parser.add_argument("password", type=str, help="密碼（建議至少 8 個字元，包含大小寫字母和數字）")

    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]

        # 檢查使用者是否已存在
        if User.objects.filter(username=username).exists():
            raise CommandError(f"使用者 '{username}' 已存在")

        # 建立使用者（Django 會自動使用 PBKDF2 雜湊密碼）
        user = User.objects.create_user(username=username, password=password)
        user.is_staff = True  # 允許使用 Django Admin
        user.is_superuser = False  # 不需要 superuser 權限
        user.save()

        self.stdout.write(
            self.style.SUCCESS(f"✓ 成功建立管理員使用者：{username}")
        )
        self.stdout.write(
            self.style.WARNING(
                "⚠ 資安提醒：請妥善保管密碼，生產環境請使用強密碼（至少 12 個字元，包含大小寫字母、數字和特殊符號）"
            )
        )

