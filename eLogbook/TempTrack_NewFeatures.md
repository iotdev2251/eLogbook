# TempTrack 新功能紀錄

本檔案記錄專案新增的功能（中文說明）。

---

## [2026-06-01] 儀表板與感測資料

### Gateway 顯示
- 每個 Beacon 顯示目前連接的 **Gateway 名稱**（及 MAC，若有）
- REST API 與 WebSocket 即時更新皆包含 `gateway_name`、`gateway_mac_addr`

### 儀表板操作
- **搜尋框**：可依 Beacon 名稱或 Gateway 名稱即時篩選
- **固定排序**：依 Beacon 名稱字母順排列，Socket 更新時不再跳動
- **品牌**：介面統一為 **TempTrack**

### 外觀
- **淺色主題**為預設（白底）
- 跟隨系統設定：夜間自動切換**深色模式**（`prefers-color-scheme`）

### 溫度／電量顯示
- 依 Beacon 廣播封包類型智慧解析（Minew 溫濕度 / Info / Legacy）
- 不合理數值（例如誤判的 58.8°C）改顯示 **「—」**，避免誤導
- 僅在收到有效溫度封包時更新讀數

---

## [2026-05-22] 使用者認證與版面

- **Beacon 橫向列表**：單行顯示名稱、狀態、Gateway、溫度、電量、RSSI、最後更新時間
- **帳號系統**：JWT + Bcrypt 登入
- **角色**：`admin` / `viewer`
- **受保護頁面**：需登入才能看 Dashboard
- **Settings**：管理員可新增／刪除使用者

---

## [2026-06-02] Dashboard 首頁三分區

- **首頁命名更新**：主選單 `Dashboard` 改為 `Real Time Status`
- **新首頁架構**：首頁重構為三個 Dashboard 區塊
- **Dashboard 1**：新增溫度 Line Chart（X 軸為溫度、Y 軸為 Beacon 名稱）
- **Dashboard 2 / 3**：建立空白預留框，等待後續定義

---

## [2026-06-02] 導航與圖表軸向調整

- **Dashboard 首頁**（`/`）：三個 dashboard 區塊；圖表 1 為 X=Beacon 名稱、Y=溫度
- **Real Time Status**（`/real-time`）：還原即時 Beacon 列表（搜尋、統計卡、橫向資料列）