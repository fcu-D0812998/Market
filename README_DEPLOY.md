# Render 部署指南

## 部署步驟

### 1. 準備 GitHub Repository

確保你的程式碼已經推送到 GitHub：

```bash
git add .
git commit -m "準備部署到 Render"
git push origin main
```

### 2. 在 Render 建立服務

#### 方式 A：使用 render.yaml（推薦）

1. 登入 [Render Dashboard](https://dashboard.render.com/)
2. 點擊 "New" → "Blueprint"
3. 連接你的 GitHub repository
4. Render 會自動讀取 `render.yaml` 並建立所有服務

#### 方式 B：手動建立服務

##### 2.1 建立 PostgreSQL 資料庫

1. 點擊 "New" → "PostgreSQL"
2. 設定：
   - **Name**: `market-db`
   - **Plan**: Free
   - **Database**: `market`
   - **User**: `market_user`
3. 記下 **Internal Database URL**（格式：`postgresql://user:password@host:port/database`）

##### 2.2 建立後端服務

1. 點擊 "New" → "Web Service"
2. 連接你的 GitHub repository
3. 設定：
   - **Name**: `market-backend`
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: 
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate --no-input
     ```
   - **Start Command**: 
     ```bash
     gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
     ```
4. 環境變數設定：
   - `SECRET_KEY`: 點擊 "Generate" 自動產生
   - `DEBUG`: `False`
   - `DATABASE_URL`: 從步驟 2.1 的資料庫複製 **Internal Database URL**
   - `ALLOWED_HOSTS`: 留空（Render 會自動設定）
   - `FRONTEND_URL`: 先留空，等前端部署後再填入

##### 2.3 建立前端服務

1. 點擊 "New" → "Static Site"
2. 連接你的 GitHub repository
3. 設定：
   - **Name**: `market-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: 
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory**: `dist`
4. 環境變數設定：
   - `VITE_API_URL`: 填入後端服務的 URL（例如：`https://market-backend.onrender.com`）

##### 2.4 更新後端環境變數

回到後端服務設定，更新：
- `FRONTEND_URL`: 填入前端服務的 URL（例如：`https://market-frontend.onrender.com`）

### 3. 執行資料庫 Migration

後端服務部署後，Render 會自動執行 migration。如果沒有自動執行，可以：

1. 在 Render Dashboard 開啟後端服務
2. 點擊 "Shell" 標籤
3. 執行：
   ```bash
   python manage.py migrate
   ```

### 4. 建立管理員帳號

1. 在後端服務的 Shell 中執行：
   ```bash
   python manage.py createsuperuser
   ```
2. 輸入管理員帳號、Email 和密碼

### 5. 驗證部署

1. 訪問前端 URL，確認頁面正常載入
2. 測試 API 連線（檢查瀏覽器開發者工具的 Network 標籤）
3. 測試登入功能

## 環境變數說明

### 後端環境變數

| 變數名稱 | 說明 | 範例值 |
|---------|------|--------|
| `SECRET_KEY` | Django 密鑰（必須） | 自動產生 |
| `DEBUG` | 除錯模式 | `False` |
| `DATABASE_URL` | 資料庫連線字串 | `postgresql://...` |
| `ALLOWED_HOSTS` | 允許的主機 | Render 自動設定 |
| `FRONTEND_URL` | 前端 URL | `https://market-frontend.onrender.com` |

### 前端環境變數

| 變數名稱 | 說明 | 範例值 |
|---------|------|--------|
| `VITE_API_URL` | 後端 API URL | `https://market-backend.onrender.com` |

## 常見問題

### 1. CORS 錯誤

如果遇到 CORS 錯誤，檢查：
- 後端的 `FRONTEND_URL` 是否正確設定
- 前端的 `VITE_API_URL` 是否正確設定

### 2. 靜態檔案 404

確保：
- `STATIC_ROOT` 設定正確
- `collectstatic` 命令有執行
- WhiteNoise middleware 已加入

### 3. 資料庫連線失敗

檢查：
- `DATABASE_URL` 是否正確
- 資料庫服務是否已啟動
- 是否使用 **Internal Database URL**（不是 External）

### 4. Session/Cookie 問題

確保：
- `SESSION_COOKIE_SECURE = True`（生產環境）
- `CSRF_COOKIE_SECURE = True`（生產環境）
- 前端和後端都使用 HTTPS

## 更新部署

當你推送新的程式碼到 GitHub 時，Render 會自動重新部署。你也可以在 Dashboard 手動觸發部署。

## 監控和日誌

- 在 Render Dashboard 可以查看服務日誌
- 免費方案有 750 小時/月的運行時間限制
- 服務閒置 15 分鐘後會進入睡眠狀態（首次訪問會較慢）

