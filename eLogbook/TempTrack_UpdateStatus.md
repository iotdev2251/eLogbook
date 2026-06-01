# TempTrack 修改與部署紀錄

本檔案記錄每次程式修改內容與在 Ubuntu 伺服器上的更新方式。

---

## [2026-06-01] 溫度解析修正、UI 與部署結構調整

### 修改內容

1. **Beacon 列表**
   - 取消 Socket 更新時的動態跳位（移除 framer-motion layout 動畫）
   - 固定依 Beacon 名稱排序（`nickname` → `name` → `mac`），同名再依 MAC
   - 「Live Beacon Status」旁新增搜尋框（可依 Beacon 或 Gateway 名稱篩選）

2. **介面品牌與主題**
   - 系統名稱由 `eLogbook` 改為 `TempTrack`
   - 預設白底；依系統 `prefers-color-scheme` 在晚上自動切換深色模式

3. **溫度／電量（MFR 解析）**
   - 新增 `nodeapp/app/mqtt/mfr-parser.js`、`nodeapp/app/beacon/sensor-values.js`
   - 依 Minew HT / Info / Legacy 封包類型分別解析，拒絕不合理溫度（10°C～45°C）
   - 修正多數 Beacon 固定顯示 **58.8°C + 21%** 的錯誤（舊資料與錯誤 offset）
   - `88ECCCD…` 支援 legacy；`88ECCC…` 加強 HT 封包搜尋

4. **資料庫**
   - `migration_lock.toml` 改為 `postgresql`（修正 Prisma P3019）

5. **Docker / 專案結構**
   - 倉庫扁平化：`docker-compose.yml` 在專案根目錄（不再多一層 `eLogbook/eLogbook`）
   - 容器內前端 build 輸出至 `/app/public`（修正 UI 不更新問題）
   - `.gitignore` 修正：不再誤忽略 `nodeapp/` 目錄

6. **腳本**
   - `scripts/deploy.sh`、`install_docker.sh` 設為可執行（100755）

### Ubuntu 更新步驟

```bash
cd ~/eLogbook

# 若曾遇 Permission denied，先停容器並改回目錄擁有權
docker compose down
sudo chown -R $USER:$USER nodeapp/public nodeapp/node_modules 2>/dev/null

# 同步最新程式
git fetch origin
git reset --hard origin/main
git log -1 --oneline

# 重建並啟動（會重新 build 前端）
docker compose up --build -d

# 查看日誌
docker compose logs -f app
```

瀏覽器請 **Ctrl+F5** 或無痕模式開啟。

### 預設登入帳號

- 帳號：`admin`
- 密碼：`admin123`  
（若無法登入：`docker compose exec app sh -lc "cd /app && npx prisma db seed"`）

### 相關 Git Commit（由舊到新）

- `72731e7` — 儀表板搜尋、白／深色主題、固定名稱排序
- `93a7ca6` — Docker 前端 build 路徑修正
- `29e639f` / `19855cc` / `53f54a1` — MFR 溫度／電量解析修正

---

## [2026-05-22] 認證與版面（歷史紀錄）

- **狀態**：已完成（見當時 commit）
- **內容**：Beacon 橫向卡片、JWT 登入、Settings 使用者管理
- **部署**：`npm install`、`npx prisma migrate deploy`、`npx prisma db seed`
