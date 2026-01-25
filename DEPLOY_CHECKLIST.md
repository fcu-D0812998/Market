# 部署前檢查清單

## ✅ 必要檔案檢查

- [x] `backend/requirements.txt` - Python 依賴
- [x] `backend/Procfile` - 後端啟動命令
- [x] `backend/build.sh` - 後端建置腳本（可選）
- [x] `render.yaml` - Render 部署配置（可選，但推薦）
- [x] `README_DEPLOY.md` - 部署說明文件

## ✅ 設定檔檢查

### 後端 (backend/config/settings.py)

- [x] `SECRET_KEY` 從環境變數讀取
- [x] `DEBUG` 從環境變數讀取（預設 False）
- [x] `ALLOWED_HOSTS` 從環境變數讀取
- [x] `STATIC_ROOT` 設定為 `staticfiles`
- [x] `WhiteNoise` middleware 已加入
- [x] `CORS_ALLOWED_ORIGINS` 支援動態設定
- [x] `SESSION_COOKIE_SECURE` 根據 DEBUG 自動設定
- [x] `CSRF_COOKIE_SECURE` 根據 DEBUG 自動設定

### 前端

- [x] `vite.config.ts` 支援環境變數 `VITE_API_URL`
- [x] `src/lib/api.ts` 使用 `VITE_API_URL` 作為 API 基礎 URL
- [x] `package.json` build 腳本正確

## ✅ 資料庫 Migration

- [x] 所有 migration 檔案已建立
- [x] `0006_remove_product_has_variants.py` 已建立

## ✅ 安全性檢查

- [x] `SECRET_KEY` 不會被 commit 到 Git（使用環境變數）
- [x] 生產環境 `DEBUG = False`
- [x] `SESSION_COOKIE_SECURE = True`（生產環境）
- [x] `CSRF_COOKIE_SECURE = True`（生產環境）
- [x] `ALLOWED_HOSTS` 正確設定

## 📝 部署步驟

1. **推送到 GitHub**
   ```bash
   git add .
   git commit -m "準備部署到 Render"
   git push origin main
   ```

2. **在 Render 建立服務**
   - 使用 `render.yaml`（推薦）：New → Blueprint
   - 或手動建立：參考 `README_DEPLOY.md`

3. **設定環境變數**
   - 後端：`SECRET_KEY`, `DEBUG`, `DATABASE_URL`, `FRONTEND_URL`
   - 前端：`VITE_API_URL`

4. **執行 Migration**
   - Render 會自動執行，或手動在 Shell 執行：
     ```bash
     python manage.py migrate
     ```

5. **建立管理員帳號**
   ```bash
   python manage.py createsuperuser
   ```

6. **測試部署**
   - 訪問前端 URL
   - 測試 API 連線
   - 測試登入功能

## ⚠️ 注意事項

1. **免費方案限制**
   - 服務閒置 15 分鐘會進入睡眠狀態
   - 首次訪問會較慢（冷啟動）
   - 每月 750 小時運行時間

2. **資料庫**
   - 使用 **Internal Database URL**（不是 External）
   - 免費方案資料庫也會在閒置後睡眠

3. **環境變數**
   - `FRONTEND_URL` 和 `VITE_API_URL` 必須互相對應
   - 確保使用 HTTPS URL

4. **靜態檔案**
   - WhiteNoise 會自動處理靜態檔案
   - 確保 `collectstatic` 有執行

