# market 雛型（React + Vite + Ant Design + Django）

## 需求
- Node.js（已驗證可用）
- Python 3（已驗證可用）

## 後端啟動（Django）

### 設定 Neon 資料庫連線

在 `backend/` 目錄建立 `.env` 檔案（或設定環境變數 `DATABASE_URL`）：

```powershell
# 方式 1：建立 .env 檔案（推薦）
cd C:\Users\user\Desktop\market\backend
echo DATABASE_URL=postgresql://neondb_owner:npg_5VlzdbvJnw0Z@ep-rough-brook-a1765u5a-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require > .env

# 方式 2：每次啟動前設定環境變數
$env:DATABASE_URL="postgresql://neondb_owner:npg_5VlzdbvJnw0Z@ep-rough-brook-a1765u5a-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

**注意**：如果沒有設定 `DATABASE_URL`，會自動使用本機 SQLite（`db.sqlite3`）。

### 建立管理員使用者（資安：必須先建立才能登入後台）

```powershell
cd C:\Users\user\Desktop\market\backend
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py create_admin <使用者名稱> <密碼>
```

**範例**：
```powershell
.\.venv\Scripts\python manage.py create_admin admin MySecurePassword123!
```

**資安提醒**：
- 密碼會自動使用 PBKDF2 雜湊儲存（不會明文儲存）
- 建議使用強密碼：至少 12 個字元，包含大小寫字母、數字和特殊符號
- 生產環境請定期更換密碼

### 啟動後端

```powershell
cd C:\Users\user\Desktop\market\backend
.\.venv\Scripts\python manage.py runserver 127.0.0.1:8000
```

常用 API：
- `http://127.0.0.1:8000/api/products/`（公開）
- `http://127.0.0.1:8000/api/orders/`（公開）
- `http://127.0.0.1:8000/api/admin/login/`（後台登入）

## 前端啟動（Vite）

```powershell
cd C:\Users\user\Desktop\market\frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

打開：
- `http://127.0.0.1:5173/`

後台（獨立頁面，需要登入）：
- `http://127.0.0.1:5173/admin.html#/login`（登入頁面）
- `http://127.0.0.1:5173/admin.html#/products`（商品管理，需登入）
- `http://127.0.0.1:5173/admin.html#/orders`（訂單管理，需登入）
- `http://127.0.0.1:5173/admin.html#/tags`（標籤管理，需登入）
- `http://127.0.0.1:5173/admin.html#/settings`（商店設定，需登入）

## 頁面
- `/`：商品列表（含標籤篩選、搜尋、加入購物車）
- `/cart`：購物車
- `/checkout`：結帳（姓名/手機/7-11門市地址手填）
- `/complete/:orderNo`：下單完成（顯示訂單編號、轉帳資訊、LINE 按鈕）
- `/admin.html#/products`：後台商品管理（新增/編輯/上下架/標籤）
- `/admin.html#/orders`：後台訂單管理（搜尋、明細、狀態更新）

第一次使用建議流程：
1. **建立管理員帳號**（後端）：
   ```powershell
   cd C:\Users\user\Desktop\market\backend
   .\.venv\Scripts\python manage.py create_admin admin <你的密碼>
   ```

2. **登入後台**（前端）：
   - 打開 `http://127.0.0.1:5173/admin.html#/login`
   - 輸入剛才建立的使用者名稱和密碼

3. **設定商店資訊**：
   - 登入後會自動跳轉到商品管理
   - 點擊上方選單「設定」，設定 LINE OA ID 與轉帳資訊

4. **新增商品**：
   - 點擊「商品管理」，開始新增商品（前台就會看到）

## 資安說明

### 已實作的資安措施

1. **密碼安全**：
   - 使用 Django 內建的 PBKDF2 密碼雜湊（不會明文儲存）
   - 密碼強度驗證（至少 8 個字元，包含大小寫字母、數字）

2. **Session 安全**：
   - `SESSION_COOKIE_HTTPONLY = True`：防止 JavaScript 存取 Session Cookie
   - `SESSION_COOKIE_SAMESITE = "Lax"`：防止 CSRF 攻擊
   - Session 過期時間：24 小時（可設定）

3. **CSRF 保護**：
   - Django 內建 CSRF Token 驗證
   - 前端自動取得並在請求中帶上 CSRF Token

4. **認證保護**：
   - 所有 `/api/admin/*` 端點都需要認證
   - 未登入時會自動重定向到登入頁面

5. **資料庫**：
   - 使用 Django 內建的 `User` 模型（不需要額外欄位）
   - 密碼欄位自動使用 PBKDF2 雜湊

### 生產環境注意事項

⚠️ **重要**：部署到生產環境前，請務必：

1. 將 `DEBUG = False`
2. 將 `SECRET_KEY` 改為隨機字串（不要使用預設值）
3. 將 `SESSION_COOKIE_SECURE = True`（需要 HTTPS）
4. 將 `CSRF_COOKIE_SECURE = True`（需要 HTTPS）
5. 設定 `ALLOWED_HOSTS` 為實際的網域
6. 使用 HTTPS（SSL/TLS 憑證）
7. 定期更新密碼
8. 考慮實作登入失敗次數限制（防止暴力破解）


