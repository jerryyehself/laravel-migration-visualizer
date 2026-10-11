# COORD-20261011-26：COORD03 R7／IR 獨立驗收（受阻，未通過）

2026-10-11（Asia/Taipei）。產品 SHA：`2b8030a7d19963980190ba860888f243883b6d7b`。本輪 shell／Git／依賴／verify 可用；真瀏覽器存取被權限設定封鎖，**COORD03 尚未完成，不判定驗收通過**。不是產品失敗，也沒有新的已確認產品缺陷。七版隊列只承接一次，停留第一版；R8各批維持pending，未執行其他版本。

## 範圍與基準

核准及角色沿本次使用者COORD-26派工：只獨立複驗R7／IR，不能修改產品、代核准、合併、結案或發布。舊報告產品2fe5108／文件ff5f3c6只作IR缺陷输入。snapshot `623975a5d26bf906ccb03e966cd62661e6629b09` 的COORD-23以git show另讀，未checkout或混入產品。已讀AGENTS、DECISIONS、CLOUD_HANDOFF、proposal入口、R7、M42、IR交付／舊報告及repo三份相關skills；部分長tool輸出有截斷，不宣稱完整逐字對話已取得。

新scratch起初不是Git repo，沒有既有產品工作可覆寫。另clone後detach固定SHA；verify開始clean=true、驗收後產品git status為空。报告另建worktree與獨立docs分支，不改產品checkout。IR #136 merge d159cbe、R7 #137 merge 96f13b0已用merge-base ancestry核對exit=0；固定產品文件commit本身是#138。

## 獨立命令結果

`pwd`／`git --version`成功；初始`git status`exit128（未連接repo）。`git ls-remote`成功，HEAD為指定SHA。clone、detach、`npm ci`成功；Node v24.19.0、npm 11.9.0。

`npm run verify`在指定SHA clean=true重跑，exit0：40 test files、670 tests（540 core／130 web），typecheck、build與12 demos，全15commands exit0。參見verification.json及verify.log；不引用實作自測或CI作本輪結果。

第一次Vite指定0.0.0.0遇`uv_interface_addresses` ERR_SYSTEM_ERROR，exit1；改用正常loopback host 127.0.0.1成功，Vite7.3.6 port5202 --strictPort --force。未修改依賴／網路設定／憑證。這個server啟動成功不代表browser可讀。

## 真瀏覽器阻礙與重現

公開cua inventory可見Chrome cdp與about:blank，取得browser文檔後新增tab，呼叫`tab.goto('http://127.0.0.1:5202')`。預期：載入指定版工作台；實際：安全政策回覆user denied permission，禁止以CDP、其他瀏覽器surface或間接路徑達成同一動作。使用者後續明確授權開放後，只重試同一入口一次；實際仍回覆saved user permission setting blocks this action。完整原文見browser-results.json。未改用Python/另一browser繞過。

舊報告ff5f3c6可核對：舊端使用VM內預裝Python Playwright／usr/bin/chromium，1440×1000；是真browser，非SSR。Personal Context查詢未取得指定舊對話逐字內容，沒有把其他搜尋結果冒充該對話。

環境阻礙B-01（非產品severity）：必要browser入口被saved preference封鎖；需要允許Cloud Browser存取此loopback URL後繼續固定版。本輪沒有成功載入產品頁面、console觀察或截圖；manifest screenshots=[]是誠實缺項，不使用歷史artifact替代。

## Expected／actual與未驗矩陣

| 項目 | Expected | 本輪actual |
|---|---|---|
| R7 workspace／step／table／欄位／側別同步 | 完整排序含failed/blocked；literal表名、每側真schema；換步驟清欄位 | 未執行browser，pending |
| 唯讀來源與返回 | 不改步驟／側別／表／view；收合ancestor展開、焦點恢復；失效fallback | IR-01僅核對程式存在，pending |
| 桌面鍵盤、點擊／拖移與390px | 操作可完成、焦點正確、無overflow | 未執行，pending |
| fresh console／favicon | 無warning/error；icon不404 | IR-02僅核對HTML宣告及svg檔案，pending |
| core版本 | 當前0.15.0與歷史release0.14.0區分 | IR-03文件核對通過 |
| proposal措辭 | R2/4/5/6舊狀態明標歷史、當前done明確 | IR-04文件核對通過，見ir-checks.json |
| 固定真實樣本UI可信度 | 2/1/6及0/1/102；unknown不能補成prefix | CLI來源另核對；browser未執行 |

R7允許切步驟清欄位與重設view，未倒套R8.4契約。下載互動／落盤依原授權暫緩。沒有PHP／DB／SQLdump執行、產品或golden修改、部署、merge/automerge、issue/milestone變更、跨對話傳訊。

## 保存與停止點

所有本輪JSON／log／來源helper由manifest列出SHA-256；截圖未產生。固定樣本原始bytes留ignored artifacts，不將完整第三方PHP加入產品fixture。報告只在`docs/independent-coord03-20261011-26`保存；不得把docs提交或verify通過當成COORD03完成。解除browser存取後沿同一SHA續驗，回收03完成結果前不接06。
