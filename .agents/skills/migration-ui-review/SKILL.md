---
name: migration-ui-review
description: Develop or verify Laravel Migration Visualizer React and ERD behavior, including snapshot selection, before/after comparison, synchronized view state, table details and browser evidence. Use for this project's UI changes or focused visual review, not unrelated websites.
---

# Migration UI development and verification

Locate the Laravel Migration Visualizer repository. Read AGENTS.md, the relevant README section and the affected milestone's teaching note from the repository root. Use the actual components and tests as the current implementation; historical screenshots and conversation backups are background. For parser or schema contract changes, also read the repo's migration-core-review skill.

Keep domain rules in migration-core. React consumes the existing ProjectAnalysis, snapshots and SchemaDiff through props; state owns input drafts, selection, filters, layout and view. Do not reparse PHP or replay migrations inside a visualization hook. Explain the affected component, props and state in Traditional Chinese using the existing backend-oriented teaching style.

## Snapshot and interaction checks

Select cases that exercise the changed behavior rather than repeating every historical check:

- Known empty schema and unknown null snapshots need different UI. A failed project must not display lastValidSchema as its final schema; a missing comparison side must not be copied from the other side.
- Before/after graphs each read their own schema. Shared layout and GraphView synchronize interaction only; do not combine the two schemas or infer semantic rename. Diff labels follow core changes, including removed items that exist only before.
- Filtering preserves core order and original selection identity. Table search filters the focus list, not the schema or edges. Changing snapshot resets the appropriate view; test that focus and details follow the active snapshot.
- Details read the selected table from the current side. Preserve explicit false, 0 and null; absent optional properties remain unspecified. A table missing on one side needs an absence message. Use safe own-property checks and React text escaping for names and comments.
- Editing input invalidates analysis and exports. Draft edits and restore affect browser copies only. Export the core result rather than UI labels, filtered subsets or layout metadata; never enable final-schema download for unknown final state.

## Verification and evidence

Run relevant web tests plus typecheck/build as appropriate to the change. Use an available, documented browser tool to exercise the affected user flow and inspect the rendered result. Include keyboard/focus or zoom/pan behavior when those interactions changed; check console warnings/errors. Use supported browser APIs rather than assuming the local desktop tool exists in cloud.

Save a screenshot when visual verification matters and report the observed result and artifact location. Distinguish a rendered button, completed browser download, and a file inspected on disk: evidence for one does not establish the others. If browser automation is unavailable, report that omission and complete independent checks; static rendering tests are not interactive browser proof.

Do not turn review into unrelated redesign, deployment, timeline work or additional excluded features. Report concrete regressions with a trigger, wrong result and source location; report test/build/browser outcomes and remaining limits. Use milestone-delivery for an authorized GitHub delivery rather than duplicating its workflow here.
