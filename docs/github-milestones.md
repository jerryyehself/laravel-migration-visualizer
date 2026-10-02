# GitHub 里程碑與交付紀錄

Milestone 1～3 的 GitHub 紀錄為事後補登，實作日期與驗證以各 commit / 文件為準。前三階段直接提交 main，沒有歷史 PR；完成 issues 連結原 commit，不重新合併既有變更。

| 階段 | GitHub Milestone | 工作項目 | 交付 |
|---|---|---|---|
| 1：單檔核心 | [M1](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/1) | [完成紀錄 #1](https://github.com/jerryyehself/laravel-migration-visualizer/issues/1) | 6959b46；42 tests |
| 2：專案分析 | [M2](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/2) | [完成紀錄 #2](https://github.com/jerryyehself/laravel-migration-visualizer/issues/2) | 78c17f3；71 tests |
| 3：多檔 UI | [M3](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/3) | [完成紀錄 #3](https://github.com/jerryyehself/laravel-migration-visualizer/issues/3) | 7fba001；76 tests |
| 4：索引分析 | [M4](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/4) | [core #4](https://github.com/jerryyehself/laravel-migration-visualizer/issues/4)、[replay/tests #5](https://github.com/jerryyehself/laravel-migration-visualizer/issues/5)、[UI/docs #6](https://github.com/jerryyehself/laravel-migration-visualizer/issues/6) | [PR #7](https://github.com/jerryyehself/laravel-migration-visualizer/pull/7) 已合併；c778163；121 tests |
| 5：外鍵分析 | [M5](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/5) | [core #8](https://github.com/jerryyehself/laravel-migration-visualizer/issues/8)、[replay/tests #9](https://github.com/jerryyehself/laravel-migration-visualizer/issues/9)、[UI/docs #10](https://github.com/jerryyehself/laravel-migration-visualizer/issues/10) | [PR #11](https://github.com/jerryyehself/laravel-migration-visualizer/pull/11) 已合併；be77f18；186 tests |
| 6：資料表生命週期 | [M6](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/6) | [core #12](https://github.com/jerryyehself/laravel-migration-visualizer/issues/12)、[tests #13](https://github.com/jerryyehself/laravel-migration-visualizer/issues/13)、[UI/docs #14](https://github.com/jerryyehself/laravel-migration-visualizer/issues/14) | [PR #15](https://github.com/jerryyehself/laravel-migration-visualizer/pull/15) 已合併；40bb301；224 tests |
| 7：欄位 helpers | [M7](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/7) | [core #16](https://github.com/jerryyehself/laravel-migration-visualizer/issues/16)、[tests #17](https://github.com/jerryyehself/laravel-migration-visualizer/issues/17)、[UI/docs #18](https://github.com/jerryyehself/laravel-migration-visualizer/issues/18) | [PR #19](https://github.com/jerryyehself/laravel-migration-visualizer/pull/19) 已合併；cf8f222；268 tests |
| 8：分析結果匯出 | [M8](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/8) | [下載 #20](https://github.com/jerryyehself/laravel-migration-visualizer/issues/20)、[tests/docs #21](https://github.com/jerryyehself/laravel-migration-visualizer/issues/21) | [PR #22](https://github.com/jerryyehself/laravel-migration-visualizer/pull/22) 已合併；fa3862e；274 tests；使用者實測下載成功 |

| 9：結果搜尋／篩選 | [M9](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/9) | [UI #24](https://github.com/jerryyehself/laravel-migration-visualizer/issues/24)、[tests/docs #25](https://github.com/jerryyehself/laravel-migration-visualizer/issues/25) | [PR #26](https://github.com/jerryyehself/laravel-migration-visualizer/pull/26) 待審查；283 tests；core 0.5.0 不變 |

後續新工作使用功能分支與 PR；實作完成與「已合併」分開記錄。M4～M8 已合併並關閉對應 issues／milestones。M5～M8 開發時使用堆疊分支，合併時依序改以 main 為 base、確認差異與最新 head CI；合併後 main 包含完整功能。

M9 已實作並推送，合併前 issues／milestone 保持開啟。
