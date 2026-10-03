# Milestone 28：明確的 UUID morph helpers

Core 0.13.0 新增 `uuidMorphs`／`nullableUuidMorphs`，type 欄為 string length 255、id 欄保留 domain 的 uuid 型別；不加 unsigned、length 或 DB char(36) 推測。兩欄 nullable 狀態一致，複合 index 順序為 type、id，沒有 foreignKey。公開 JSON 型別不變。

參數與 M27 共用：一個非空靜態名稱、可選非空 index name，省略／null 依慣例命名；不接受第三參數 after、動態值、modifiers 或 change。通用 morphs／nullableMorphs 與 ULID helpers 仍未支援。固定 string 長度與無 connection prefix 的限制不變。

核對 [固定 Laravel 12 Blueprint 的 uuidMorphs](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Blueprint.php#L1618) 與 nullableUuidMorphs（L1637），按 source 的 string、uuid、index 順序正規化。不執行 PHP／SQL，不把 uuid domain 型別說成所有 driver 的實際 DDL。

## 教學：共用流程而不混淆型別

M27 的 name／nullable／index／source 驗證與展開流程可共用，只有 id definition 在 numeric 與 UUID 間不同。Numeric id 有 unsigned，UUID id 沒有；測試直接確認沒有多餘 metadata。這種共享仍放在 core，像後端 service 的共用規則。

Component 負責畫面；props 提供分析結果與 callback；state 保存目前選取的快照或表。React 不需要知道 helper 如何展開，從 core 取得 uuid 欄位與複合 index。無法確定多型目標時，不繪製猜測的 FK 連線。

整檔原子 replay、nullable snapshots 與結構 diff 均沿用：第二欄碰撞、同檔後續 failure 不能洩漏部分 type/id/index；first failed 的 before 可用、after/diff 為 null，later blocked 快照為 null，finalSchema 為 null。快照、index arrays 與 diff 不共用可變 payload。

## 驗證

13 個新測試在實作前 9 failed／4 passed，實作後全部通過；覆蓋兩種 helper、命名、來源、拒絕、numeric／UUID 混用、第二欄碰撞、特殊名字、隔離與多檔 success／blocked golden。Golden 從獨立規格的 UUID 欄位建立，未錄製 analyzer output；fixtures 為本專案自行撰寫。

本地 561 tests（472 core + 89 web）、typecheck、build 與十個 demo 通過；demo:morphs 同時驗證建置後 numeric 與 UUID 套件行為。無 UI 修改／新增瀏覽器驗收。主要變更為 normalize.ts、uuid-morphs.test.ts、fixtures/uuid-morphs、examples/morphs.mjs、版本與文件；GitHub 狀態見 [交付紀錄](github-milestones.md)。
