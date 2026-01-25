# Render 手動設定指南（如果 Blueprint 不工作）

如果 Blueprint 沒有正確讀取 render.yaml，請按照以下步驟手動設定：

## 後端服務設定

### 基本設定
- **Name**: `market-backend`
- **Root Directory**: （留空，或填 `backend`）
- **Environment**: Python 3
- **Region**: 選擇最近的區域

### Build Command
```bash
cd backend && pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate --no-input
```

### Start Command
```bash
cd backend && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

### 環境變數
| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.11.0` |
| `SECRET_KEY` | 點擊 "Generate" 自動產生 |
| `DEBUG` | `False` |
| `DATABASE_URL` | 從資料庫服務複製 Internal Database URL |
| `FRONTEND_URL` | 前端服務的完整 URL（部署前端後填入） |
| `ALLOWED_HOSTS` | （留空，Render 會自動設定） |

---

## 前端服務設定

### 基本設定
- **Name**: `market-frontend`
- **Root Directory**: （留空，或填 `frontend`）
- **Environment**: Node
- **Region**: 選擇最近的區域

### Build Command
```bash
cd frontend && npm install && npm run build
```

### Publish Directory
```
frontend/dist
```

### 環境變數
| Key | Value |
|-----|-------|
| `NODE_VERSION` | `20.x` |
| `VITE_API_URL` | 後端服務的完整 URL（例如：`https://market-backend.onrender.com`） |

---

## 資料庫服務設定

### 基本設定
- **Name**: `market-db`
- **Database**: `market`
- **User**: `market_user`
- **Plan**: Free

### 取得 Internal Database URL
1. 進入資料庫服務頁面
2. 找到 "Connections" 區塊
3. 複製 **Internal Database URL**（不是 External）
4. 格式：`postgresql://user:password@host:port/database`

---

## 設定順序

1. **建立資料庫服務**
   - 記下 Internal Database URL

2. **建立後端服務**
   - 設定 Build Command 和 Start Command（如上）
   - 設定環境變數（除了 FRONTEND_URL）

3. **建立前端服務**
   - 設定 Build Command 和 Publish Directory（如上）
   - 設定 VITE_API_URL（填入後端 URL）

4. **更新後端環境變數**
   - 設定 FRONTEND_URL（填入前端 URL）

---

## 重要提醒

- Build Command 必須包含 `cd backend` 或 `cd frontend`
- 所有 URL 必須包含 `https://` 協議
- DATABASE_URL 必須使用 Internal Database URL
- 環境變數名稱大小寫敏感

