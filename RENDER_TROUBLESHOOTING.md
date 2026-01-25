# Render 部署問題排查指南

## 問題：找不到 requirements.txt

### 可能原因和解決方案

#### 1. Root Directory 設定問題

**檢查步驟：**
1. 進入 Render Dashboard → 後端服務設定
2. 找到 "Root Directory" 欄位
3. **確認設定為：`backend`**（不是留空，也不是 `/backend`）

**如果 Root Directory 設定了 `backend`：**
- Build Command 應該是：
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate --no-input
  ```
- **不需要** `cd backend`

**如果 Root Directory 留空：**
- Build Command 必須包含 `cd backend`：
  ```bash
  cd backend && pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate --no-input
  ```

#### 2. 檢查檔案是否在正確位置

確認以下檔案存在：
- ✅ `backend/requirements.txt` - 存在
- ✅ `backend/manage.py` - 存在
- ✅ `backend/config/wsgi.py` - 存在

#### 3. 檢查 Build Logs

在 Render Dashboard 中：
1. 進入服務頁面
2. 點擊 "Logs" 標籤
3. 查看 "Build Logs"
4. 確認：
   - 是否有 `cd backend` 的輸出
   - 當前工作目錄是什麼
   - 是否有列出檔案

#### 4. 測試命令

在 Build Command 中加入除錯命令：
```bash
cd backend && pwd && ls -la && pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate --no-input
```

這會顯示：
- 當前目錄
- 目錄中的檔案列表
- 確認 requirements.txt 是否存在

---

## 推薦設定（兩種方案）

### 方案 A：使用 Root Directory（推薦）

**在 Render Dashboard 設定：**
- Root Directory: `backend`
- Build Command:
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate --no-input
  ```
- Start Command:
  ```bash
  gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
  ```

### 方案 B：不使用 Root Directory

**在 Render Dashboard 設定：**
- Root Directory: （留空）
- Build Command:
  ```bash
  cd backend && pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate --no-input
  ```
- Start Command:
  ```bash
  cd backend && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
  ```

---

## 檢查清單

在 Render Dashboard 確認：

- [ ] Root Directory 設定正確（`backend` 或留空）
- [ ] Build Command 與 Root Directory 設定匹配
- [ ] Start Command 與 Root Directory 設定匹配
- [ ] 環境變數已設定（SECRET_KEY, DATABASE_URL 等）
- [ ] Python 版本設定為 3.11.0
- [ ] 服務已重新部署

---

## 如果還是不行

1. **刪除並重新建立服務**
   - 刪除現有服務
   - 重新建立，確保所有設定正確

2. **檢查 GitHub Repository**
   - 確認 `backend/requirements.txt` 已 commit 並 push
   - 在 GitHub 上確認檔案存在

3. **聯繫 Render 支援**
   - 提供 Build Logs
   - 說明問題和已嘗試的解決方案

