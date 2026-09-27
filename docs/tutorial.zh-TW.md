# 從後端思維認識這個專案

## 1. 先理解 core / UI 分層

你可以把 migration-core 想成後端的 domain/service layer：收到 PHP 字串，回傳分析結果。它不知道按鈕、網頁或 React 是什麼。apps/web 是呈現層：接收輸入、呼叫 core、顯示結果。

```text
使用者輸入 PHP
    ↓
App（React component）
    ↓ 呼叫普通 TypeScript 函式
analyzeMigration
    ↓
php-parser → AST → AtomicOperation[]
    ↓ 檢查 complete
applyOperations(previousState, operations)
    ↓
SchemaState → AnalysisView 顯示 JSON
```

分層的好處是：即使之後換成 Angular 或命令列工具，parser 與 schema 規則也能沿用。目前測試直接呼叫 core，不需要開瀏覽器。

## 2. Component：一個負責畫面的小函式

Component 是 React 的畫面單位。本專案有 App 和 AnalysisView。

```tsx
function AnalysisView({ result }: { result: AnalysisResult }) {
  return <h2>{result.operations.length} 個操作</h2>;
}
```

`<h2>...</h2>` 這種寫在 TypeScript 裡的標記叫 JSX。它描述畫面應該長什麼樣；副檔名因此使用 `.tsx`。大括號表示插入 JavaScript 運算結果。

App 管理整個工作台，AnalysisView 呈現分析結果。元件不必對應一個頁面，也可以只是表單或結果區塊。

## 3. Props：父元件傳入的參數

```tsx
<AnalysisView result={result} />
```

這裡的 result 是 props。你可以把它想成呼叫函式時傳入的參數。App 擁有資料，AnalysisView 接收資料；子元件不直接改寫父元件傳來的 result。

Props 的 TypeScript 型別可以讓開發工具提早發現錯誤，例如不小心傳入字串而不是 AnalysisResult。

## 4. State：畫面記得的資料

```tsx
const [source, setSource] = useState(fixture);
```

`source` 是這一次畫面使用的 PHP 內容，`setSource` 用來更新它。`fixture` 是初始內容。

```tsx
<textarea value={source} onChange={event => setSource(event.target.value)} />
```

使用者打字 → onChange 取得新文字 → setSource 更新 state → React 重新呼叫元件，讓畫面符合新資料。不要用 `source = ...` 代替 setter；React 需要知道 state 改變了。

本專案還有 result state，記得最後一次按「分析」的結果。編輯文字時會清掉舊結果，避免把舊分析誤認成新輸入的結果。

`useState` 是一種 hook，讓元件使用 React 的狀態能力。Hook 適合 UI 生命週期與互動，不需要用它包住每一個 domain function。

## 5. AST：先讀懂語法結構

對 PHP 字串直接使用正規表達式，很容易被註解、換行、字串和 method chain 混淆。php-parser 將程式轉成 AST，也就是保留語法結構的樹。

例如 `$table->string('name')->nullable()` 是巢狀的 method call。normalize.ts 將巢狀呼叫攤成有順序的 chain，再辨識第一個 column API 與後續 modifiers。這裡讀取的是語法結構，沒有執行 PHP。

AST 的形狀由第三方套件決定，因此只讓 parser.ts / normalize.ts 接觸它，其他程式依賴我們自己的型別。

## 6. AtomicOperation：統一成自己的語言

```php
$table->string('name', 120)->nullable();
```

在 createTable 操作之後，這行會正規化成：

```json
{
  "kind": "addColumn",
  "table": "users",
  "column": { "name": "name", "type": "string", "length": 120, "nullable": true },
  "source": { "file": "example.php", "line": 8, "column": 12 }
}
```

`kind` 決定是哪一種操作。TypeScript 看到 kind 是 addColumn，就知道可以讀取 column。這叫 discriminated union：不同操作有各自必要的欄位，不必塞滿一堆可能不存在的參數。

Atomic 指操作的粒度。例如 timestamps 是 Laravel 的便利 API，但我們會拆成 created_at 與 updated_at 兩次新增欄位，之後比較 schema 時就能使用一致的模型。

## 7. SchemaState：依序把操作套用成狀態

`emptySchema()` 是空白起點。`applyOperations(state, operations)` 根據順序建立、增加、刪除或重新命名欄位，回傳新 state。

這個 SchemaState 是 domain 資料，不是 React 的 useState。兩者只是都使用 state 一詞：前者描述資料庫結構，後者是 React 記住畫面資料的機制。

純函式不修改傳入的 state。這讓你能保留舊版本、比較前後結果，也讓測試比較可靠。若第二份 migration 修改第一份建立的 users，必須把第一份的狀態傳入；只給空白 schema 當然找不到 users。

## 8. 如何讀測試

先讀 tests/fixtures/001_create_users.php，再對照 .golden.json。這就是「輸入這份 PHP，必須得到這份資料」的規格。

Unit tests 處理更小的問題：nullable(false) 有沒有保留 false？遇到 default(env(...)) 是否拒絕猜測？重複欄位會不會報錯？Replay 失敗會不會污染原本的狀態？

建議閱讀順序：types.ts → fixtures → core.test.ts → schema.ts → parser.ts → normalize.ts → apps/web/src/main.tsx。先理解公開資料，再看如何產生資料，最後看如何呈現。

下一次擴充 column API 時，先定義預期 operation 與測試，再修改 normalizer；通常不必更動 React。這就是分層真正帶來的好處。
