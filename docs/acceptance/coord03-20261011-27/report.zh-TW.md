# COORD-20261011-27：COORD03 R7／IR 獨立複驗

2026-10-11（Asia/Taipei）。**指定產品 `2b8030a7d19963980190ba860888f243883b6d7b` 的本輪 R7／IR 複驗通過，未發現新的產品缺陷。** 本輪有實際 shell、Git、完整 verify 與 Chromium 互動；四項舊 IR 缺陷均已核對修正。此結論不涵蓋 R8 或真人可用性。

## 環境設定先行完成

使用既有 `/workspace/laravel-migration-visualizer`，未建立 worktree。開始分支 `work`，HEAD 為指定產品 SHA，Git status 空；測試開始與全部產品檢查結束時皆 clean。Node 22.23.3 對應 `.nvmrc` 的 22，官方 Linux x64 archive SHA-256 已驗證；npm 10.9.9。初次 npm cache 指向不可寫的 `/home/agent/.npm` 而失敗，改用 `/workspace/.cache/npm` 後 frozen `npm ci` 成功，未改 lockfile 或關閉完整性驗證。

`install_script`、`start_skill` 已由 onboarding 工具保存，draft 為 `efe792f3-4164-4e9e-b140-df54e2fc7cc5~cecfgdraft_6acb6d8aa73c8192b3130f84946ea2c5`，回覆 saved／requires_publish=true。完整安裝腳本在本機再次執行成功，兩次完整 verify 都為 670 tests／15 commands。啟動指引包括 Node／cache activation、既有隔離 checkout、Vite 重啟與代表功能檢查；不需要 PHP、資料庫或秘密。保存不等於發布或新任務還原；使用者需在環境設定檢閱、儲存並發布。此次沒有發布環境或網站。

Python Playwright 1.62.0／`/usr/bin/chromium` 154.0.8037.57 可用，headless、1440×1000／390×844、zh-TW。shell 執行原有 Playwright 路徑成功，實際 navigation 回應 200。前端驗收報告 `362f32316deb288976deb2df6f543cb75b97a472` 記載的 Cloud Browser saved permission 拒絕保留為該端歷史；本環境無 Cloud Browser 工具，未操作該 surface、CDP 或隱藏權限。本次使用者明確允許的環境內常規 Playwright 路徑可執行，未收到存取拒絕；若收到拒絕則應停止，不以另一 surface 繞過。

## 授權、文件與固定版本

只完成 COORD03，授權來源為使用者 COORD-27 移交。已讀固定產品的 AGENTS、DECISIONS、CLOUD_HANDOFF、proposals/README、R7 proposal、M42、github-milestones 的 IR／R7 交付段落及相關四份 repo skills。舊報告 `docs/independent-review-r1-r6@ff5f3c60c4f2a243673ed2729fa5ea9010ab6df9`／產品 `2fe510870c4d41d7c24459173d7e32f2f625968c` 是四 IR 輸入，不作新測試證據。

文件 snapshot `623975a5d26bf906ccb03e966cd62661e6629b09` 的 COORD-23 以 git show 另讀，未 checkout 或混入產品。Git ancestry 確認 #136 `d159cbe1dbcba347858eab266109abbfdb094d20`、#137 `96f13b0c2f8fba1389f5f5e915bcec346229747b` 是指定 HEAD 祖先；HEAD 的 #138 僅補交付文件。read-only `git ls-remote origin refs/heads/main` 當輪仍回指定產品 SHA。沒有 pull/reset 到 R8、合併、automerge、關閉 issue／milestone或部署。

## 本輪實際命令

在 checkout 根目錄，先設定：

```sh
export PATH=/workspace/.tools/node-v22.23.3-linux-x64/bin:$PATH
export npm_config_cache=/workspace/.cache/npm
bash scripts/cloud-setup.sh
npm run verify
npm run dev -- --host 127.0.0.1 --port 5202 --strictPort
node scripts/research-baseline.mjs artifacts/research-inputs
python scripts/verify-workspace.py
python scripts/verify-source-return.py
python /workspace/.tools/coord03-independent.py
```

完整安裝重跑為 `bash /workspace/.tools/lmv-install.sh`，包括 npm ci 與 verify，exit 0。[verification.json](verification.json) 是此重跑的當輪報告，產品 SHA／clean=true；40 test files、670 tests（540 core／130 web），tests、typecheck、build、十二 demos，全 15 commands exit 0，未跳過測試。[verify.log](verify.log) 保留實際輸出。服務 PID／首頁並非判定依據：環境設定階段另以真 browser 核對訂單範例 12/12 applied、0 診斷、5 表／3 外鍵及失敗 final 未知；本輪複驗如下。

## 獨立互動 expected／actual

[independent-browser.json](independent-browser.json) 記錄本輪 13 項／組 expected、actual；[independent-browser.py](independent-browser.py) 保存可取回 runner。以下均為此驗收端實際操作，不使用 CI 或歷史截圖代替。

| 項目 | 預期與本輪觀察 |
|---|---|
| 步驟、表、欄位 | 選第 2／3 份 after，查 display_name，固定明細為 users.display_name；下一份保留 users、清欄位，尾端 next disabled。符合 R7，不倒套 R8.4。 |
| 篩選與原序 | 目前第三份被 create_users 篩選排除仍保持時點並提示；previous 到完整序列第二份。 |
| 側別／比較 | display_name 於 before 不存在，after 為 string／length 120／nullable=false；兩側讀自己的 schema。 |
| PHP 與正常返回 | 來源面板唯讀、無可編輯 input，面板取得焦點；返回保留 step／side／table／column／view，原按鈕可見且為 activeElement。 |
| IR-01 祖先收合 | 將原按鈕所有 native details 祖先收合後返回，自動展開且焦點恢復。桌面截圖 [source-return-desktop.png](source-return-desktop.png)。 |
| IR-01 invalid fallback | 隱藏真正原目標再返回，出現「原結構選取已失效」且提示為 activeElement。這是受控 DOM 邊界注入，不宣称一般使用必然造成失效。 |
| 鍵盤 | Space／Enter 選 users，ArrowRight 改變節點座標。 |
| 390px／跨檔來源 | 第 2 份內看第 1 份 create_users 的來源，不换閱讀步驟；返回焦點、沒有水平 overflow。[workspace-390.png](workspace-390.png)。 |
| literal rename | users→members 後 users 在 after 明示不存在，before 可讀；不猜身分。 |
| 兩個完整樣本 | 真檔案匯入後點開完整 ProjectAnalysis JSON；精確 status counts、first failed before known／after diff null、全部 blocked snapshots null、final null 均吻合。 |
| 輸入失效 | 只改瀏覽器副本，工作區卸載；磁碟來源 hashes 再核對仍吻合。 |
| IR-02／console | 宣告 `/favicon.svg` 回應 200；整輪 console warning/error、pageerror、HTTP >=400 均空。 |

另在同一固定產品**重新執行**既有工作區 runner 16 項／組、source-return runner 九項／組，exit 0；[r7-browser.json](r7-browser.json)、[source-return-browser.json](source-return-browser.json) 為本轮輸出。它們是實作提供的 regression，本報告清楚與上述驗收端 runner 區分，覆蓋可能重疊，不相加成 38 個獨立案例。包含點擊／拖移不換選表、診斷定位、failed／blocked traversal、欄位重選／摘要跳轉、390px、正常／收合返回及 nested／hidden／detached／unfocusable／null DOM 邊界；九項中有直接呼叫 restoreSourceFocus 的瀏覽器 DOM 測試，不把它們冒充九個端到端任務。

獨立 runner 前兩次於讀 JSON 失敗：首次 locator 過廣，縮小後發現 native details 未展開導致 innerText 空；修 runner 為點開 summary 後完整重跑通過。兩份失敗 log 保留。未改產品、斷言或 golden；首次部分走查不算完整成功。

## 固定上游樣本與 IR 文件修正

118 份檔案依既有 `docs/research/r1-samples.json` 的 repo／commit／path 從 GitHub raw 重新取得，TLS 正常、逐份既有 SHA-256 MATCH，[source-hashes.json](source-hashes.json) 可核對。涵蓋 112 PHP migrations 及六份 lock／manifest／license；未取 SQL dump，不執行 PHP／Composer／DB。完整第三方 source 留 ignored artifacts；來源／MIT 通知沿原 manifest 及 docs/research/licenses。

| 專案與固定 commit | CLI 與本輪 browser DTO 一致結果 |
|---|---|
| Laravel.io `d056c6493dd7bf905e471f2ad6fe716c35642ae4`，9 PHP | 2 applied／1 failed／6 blocked；dynamic after(callback) 仍拒絕。failed before 可選 jobs，after／blocked／final unknown。 |
| BookStack `ff661b59f6f605bf768fe850c0d0a8a2dc09d203`，103 PHP | 0／1／102；DB write 仍拒絕。first before 已知空、after／blocked／final unknown，沒有以未套用 users 或成功前綴補圖。 |

[sample-summary.json](sample-summary.json) 保留 CLI 結果；[laravelio-browser-dto.json](laravelio-browser-dto.json)、[bookstack-browser-dto.json](bookstack-browser-dto.json) 是畫面完整 JSON 觀察。對應 unknown 截圖在本目錄。不代表完整 Laravel 相容。

[ir-document-checks.json](ir-document-checks.json)：IR-03 現行手冊明示 core 0.15.0，0.14.0 為 10/4 v1.0.0 歷史；IR-04 R2／R4／R5／R6 當前 done，舊 approved／進行中／尚待／未啟動段落均明標「歷史」及 2026-10-09。IR-01／02 本輪真 browser 修復亦如上。四 IR 原 severity P2／P3 保留於舊報告，不將已修復案例重列新缺陷。

## 保存、限制與停止點

報告分支 `docs/independent-coord03-20261011-27` 由指定產品建立，只新增本目錄文件與證據。產品／tests／fixtures／golden／package-lock／依賴／workflow 未變。Git 分支提交是報告 SHA，不能代替實際測試產品 SHA。證據含 JSON、當輪 log、runner、截圖與 [manifest.json](manifest.json) SHA-256；沒有假定未提交 artifacts／程序／聊天共享。遠端 reportSHA／分支／PR 以本次最終交付回覆為準，不在檔內嵌入自身 commit。

環境 draft 已保存，尚未發布；新任務 snapshot 還原未驗證。本輪使用 headless Chromium，不宣稱跨瀏覽器／真人可用性／所有可及性或大型 UI 效能。下載互動／落盤持續暫緩，只查 disabled 控制項與 DOM JSON，沒有按下載。沒有產品修改、額外外部帳號／費用／權限變更、部署或 release。

**停止於 COORD03 完成，等待協調端回收結果；COORD06 及其餘 R8 六版尚未驗收，本輪不自行接續。**
