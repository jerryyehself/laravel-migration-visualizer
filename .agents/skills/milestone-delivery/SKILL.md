---
name: milestone-delivery
description: Deliver a Laravel Migration Visualizer milestone with verified tests, Chinese teaching notes, GitHub milestone/issues and an accurate PR handoff. Use for milestone completion or retrospective GitHub tracking in this repository.
---

# Milestone delivery

Locate the Laravel Migration Visualizer repository and read `AGENTS.md`, `docs/github-milestones.md`, and the relevant milestone document. Resolve paths from the repository root. Inspect branch, status and base commit before staging; retain unrelated user work. Read the current user's scope and authorization rather than assuming that a previous milestone authorizes new features or a merge.

Deliver a concrete change that a reviewer can assess:

- Confirm the promised core/UI behavior and its public JSON contract. Record breaking changes and supported-API limits in README and the milestone's Chinese teaching note.
- Run the applicable verification from AGENTS.md. For a core milestone, this normally includes npm test, npm run typecheck, npm run build and npm run demo:project. Check built-package behavior when exports/contracts change; inspect the browser when UI behavior changes. Report the commands actually run and their results, with failures or omissions. Test counts are observations, not a fixed acceptance target.
- Explain the design in Traditional Chinese, including why rules live in core and how React consumes them. Keep documented commands and handoff expectations consistent with the delivered version.
- Inspect git diff, including newly created files, before committing. Use a feature branch and PR for new work; preserve the existing PR for review fixes in the same scope.

For authorized GitHub tracking, inspect existing milestones/issues/PRs before creating records. Prefer updating the matching record over duplicates. Describe behavior and validation for someone who has not read the chat. Link the relevant issues and milestone; use closing keywords only for work the PR actually completes. Attach every created or actively updated PR to the Codex chat using the available artifact tool.

Historical milestones that went directly to main should link their actual commits and validation as retrospective records. Do not fabricate historical PRs or merge already delivered code again. A new milestone remains open while its implementation PR is awaiting merge; distinguish implemented, pushed, CI passed and merged. Merge or approval requires the user's authorization for that action.

After pushing, inspect CI for the PR's current head SHA; an earlier green run does not validate a new commit. If it is still running, report that accurately and continue bounded checks when practical. Avoid claiming that skill installation, cloud execution or browser verification succeeded without evidence.

Finish with concise bullets: shipped behavior, main files, test/build results, known limits, commit/PR links and remaining work. Include git diff highlights or a folder tree when requested. Do not let the tracking workflow expand the milestone's product scope.
