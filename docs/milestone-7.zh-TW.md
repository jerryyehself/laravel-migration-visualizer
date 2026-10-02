# Milestone 7：常見欄位與 helpers

本階段讓一般 Laravel migration 更容易直接分析。Core 0.5.0 支援 enum、rememberToken、soft deletes、時區時間型別，以及對應移除 helpers。核心保持純 TypeScript，React 只增加範例入口。

## 從 component、state、props 理解分層

Component 是畫面單位，例如 ProjectWorkbench 負責輸入，ProjectResults 負責結果。State 是會變動的畫面資料：檔案副本、目前選取項目、分析結果。Props 是父 component 傳入的資料或 callback，例如 result 與 onSelect。

按「載入欄位 helper 範例」只是改變 files state。按「分析專案」呼叫 core 的 analyzeProject，再把結果傳給 ProjectResults。useState 不處理 enum、Blueprint 或回滾規則；這些規則要能在沒有 React 的 Node 程式中同樣使用。

## Helper 是操作的縮寫

```php
$t->rememberToken();
$t->softDeletesTz('archived_at', 3);
$t->timestampsTz(6);
```

正規化後是四個 addColumn：remember_token 為 nullable string、length 100；archived_at 為 nullable timestampTz、precision 3；created_at 與 updated_at 為 nullable timestampTz、precision 6。每個操作保留原 PHP 呼叫的來源位置。

移除 helpers 轉成既有 dropColumn，因此不用建立另一套 replay 規則。dropTimestamps/Tz 產生兩個 dropColumn；第二欄不存在、欄位被索引或外鍵引用，都會讓整份 migration 失敗。第一個 drop 的部分結果不會進入可信快照。

對照 [Laravel 12.x Blueprint 原始碼](https://github.com/laravel/framework/blob/12.x/src/Illuminate/Database/Schema/Blueprint.php) 確認 helper 展開、預設名稱與參數。本工具仍是文件化的子集，不模擬 Laravel 全部 runtime。

## 新 API 與公開 JSON

| API | 支援參數與輸出 |
|---|---|
| enum(name, values) | 非空、不重複的靜態字串陣列；允許空字串值；allowedValues 保留順序 |
| rememberToken() | remember_token，string(100)，nullable |
| softDeletes / softDeletesTz | 可省略欄位名稱 deleted_at、precision；nullable timestamp / timestampTz |
| timestampTz / dateTimeTz / timeTz | 欄位名稱、可選 precision，預設不 nullable |
| timestampsTz | 可選 precision；created_at、updated_at 兩個 nullable timestampTz |
| dropRememberToken() | 移除 remember_token |
| dropSoftDeletes / dropSoftDeletesTz | 可選欄位名稱，預設 deleted_at |
| dropTimestamps / dropTimestampsTz | 移除 created_at、updated_at |

Column 新增可選 allowedValues: string[]；沒有 enum 的舊 schema 仍有效。AtomicOperation 的種類與每表 indexes/foreignKeys 必要欄位不變。

```json
{"name":"status","type":"enum","nullable":false,"allowedValues":["","active","paused"],"default":""}
```

快照會複製陣列，所以不同快照的 allowedValues 不會是同一個物件。Diff 按長度與每個位置的值比較，不能用 JavaScript 的陣列 identity 比較：內容相同應無變化，交換順序則是 columnChanged。Enum rename 仍是結構上的移除與新增；不推測語意。

## 限制

- Enum 不支援 PHP enum case、數字選項、變數、keyed array、展開陣列、空陣列或重複值。default 仍只記錄 scalar，不驗證是否屬於選項或符合真實資料庫規則。
- 時間 precision 沿用既有契約：省略為 0，明確 null、負數、小數不接受；不讀 Laravel runtime 預設 precision，不做 DB precision 上限驗證。
- 單欄 helper 可使用已支援 modifier；timestamps/Tz 兩欄 helper 不支援 chained modifiers。所有移除 helper 都不支援 modifiers。
- Tz 保留型別資訊，不代表某個資料庫一定提供同樣的時區儲存行為。
- 沒有 change()、morphs、set、down()、timeline、ERD、AI、SQL parser、runtime execution 或 semantic refactoring detection。

## 驗證

268／268 tests（263 core + 5 browser import）通過，M7 新增 44 個測試。包含正規化與診斷、enum 有序比較與隔離、helper 回滾、索引／外鍵保護，以及三檔成功／中途失敗 golden。Golden 的 schema 預期由 helper 契約獨立指定，沒有從 analyzer 錄製。

npm run typecheck、npm run build、npm run demo:project、npm run demo:tables、npm run demo:helpers 全部通過。demo:helpers 使用建置後公開套件並納入 CI。瀏覽器確認成功 3/3、失敗 1/3、後序未知快照，以及 enum/時區欄位顯示；console 無 warn/error。

M7 分支接在 M6 上，實作與驗證完成不代表已合併。GitHub 狀態見 [交付紀錄](github-milestones.md)。
