# Milestone 29：dropMorphs 與完整多型欄位生命週期

Core 0.14.0 支援獨立 `dropMorphs('taggable', indexName?)`。依序展開一般 dropIndex、dropColumn(taggable_type)、dropColumn(taggable_id)，三個 operation 共用 source；沿用既有 JSON 型別與 replay。Numeric／nullable numeric／UUID／nullable UUID 建立的 pair 都可移除，亦可移除符合命名的手動欄位與索引，不要求 helper 身分紀錄。

核對 [固定 Laravel 12 Blueprint::dropMorphs](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Blueprint.php#L622)：先以 indexName 或 type/id 慣例 dropIndex，再 dropColumn(type,id)。第二參數省略、null、字串 0 依 PHP ?: 使用慣例；其他非空字串指定 index name。空字串／false 保守拒絕，這是分析器政策，不宣稱 Laravel 同樣拒絕。

## 失敗、限制與教學

- 不搜尋自訂索引名稱。自訂名稱的新增 helper 必須在移除時明確提供該名稱；未知 index 失敗，不略過。
- 只移除一般 index；其他 index／unique／primary 與 outgoing／incoming foreign key 的引用保護不變。需要先明確移除額外約束。
- 不驗證「原先是否由某 helper 建立」或猜 semantic identity；replay 驗證每個命令的實際索引型別、名稱及欄位存在。不能將 diff 當命令順序。
- 一至二個靜態參數；動態／空名稱、array、額外參數、方法鏈與 change 均拒絕，該 statement 無部分 operations。
- Runtime morphs／nullableMorphs、ULID、after、connection prefix、PHP／SQL／DB execution 仍未加入。

`applyOperations` 在複製的 schema 上套用整份 migration。即使第一組 pair 已刪除，第二組找不到 index 或欄位，lastValidSchema 仍保留兩組完整欄位與索引。Index 刪除後，type 已刪但 id 受到其他引用保護的情境也一樣回滾。first failed 的 before 保留，after/diff 為 null；later blocked 快照為 null，finalSchema 為 null。這是分析可信度的原子邊界，不代表真實資料庫 DDL 都有交易保證。

Component 是畫面單位，props 是父層提供的 core 分析結果與 callback，state 是選取快照等畫面資料。Core 計算移除有效性；React 用既有 props 顯示 columnRemoved／indexRemoved 與快照。沒有新增 hooks 的 schema 規則或猜測的多型 ERD edges。

## 測試與交付

28 個新回歸在實作前 18 failed／10 passed，實作後全部通過。涵蓋三操作順序／source、四種新增 helper 的移除、慣例/null/zero/custom names、拒絕、自訂名稱缺失、三種額外索引、其他雙向外鍵、第二欄缺失、特殊名稱、不可變快照／diff，以及混合 numeric／UUID 多檔 success／blocked golden。

Fixtures 自行撰寫；golden 從明確欄位／索引狀態獨立建立，未錄製 analyzer output。Built-package demo:morphs 確認新增兩種型別、混合移除與整檔回滾。

本地完整 591 tests（502 core + 89 web）、typecheck、build 與十個 demo 通過。三個 milestone 合計新增 65 個 tests；沒有 UI 改動或新增瀏覽器互動驗收。主要檔案：normalize.ts、drop-morphs.test.ts、fixtures/drop-morphs、examples/morphs.mjs、版本與文件。實際 PR／CI／合併證據見 [交付紀錄](github-milestones.md)。
