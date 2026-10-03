---
name: migration-core-review
description: Develop or review the Laravel Migration Visualizer analysis core, checking PHP normalization, immutable schema replay, project snapshots, structural diff and golden contracts. Use in this repository for core changes or their React integration.
---

# Migration core development and review

Locate the Laravel Migration Visualizer repository in the active workspace. Read its `AGENTS.md` and the relevant supported-API section of `README.md`; read the current milestone's Chinese design document when the change touches its contract. Resolve these paths from the repository root, not the installed skill directory. If this is a different project, do not apply this repository's contracts.

Keep PHP AST interpretation, filename ordering, replay, diff and diagnostics in `packages/migration-core`. Core receives filenames and source strings; filesystem access and React state belong to callers. Components receive analysis results and callbacks through props; hooks must not duplicate schema rules.

When adding a Blueprint API, trace a concrete PHP example through AST → AtomicOperation → replay → snapshots/diff. Verify ambiguous Laravel behavior against the relevant framework version's source, especially omitted arguments versus explicit null/false and fluent versus standalone commands. Unsupported syntax must produce a diagnostic rather than a complete but guessed schema. The model describes a documented subset; it does not promise database execution compatibility.

Protect these existing invariants unless the user deliberately changes the contract:

- Replay clones input and applies each migration atomically. A failed file does not leak partial operations into the trusted schema.
- The first failed file retains schemaBefore but has null schemaAfter/diff; subsequent files continue syntax analysis with null snapshots/diff. finalSchema is null; lastValidSchema is only the successful prefix.
- Empty schema and unknown schema are different. The UI must preserve that distinction.
- Tables require an indexes map. Indexes determine derived column.primary; index column order matters. Rename updates references without inventing a new index identity. Structural diff does not infer semantic renames.
- Identifiers such as __proto__ and constructor must behave as ordinary names. Snapshots and diff payloads must not alias mutable inputs.
- External initialSchema must meet the current public contract. Do not silently upgrade old JSON or imply runtime validation when none exists.

For a bug, add a behavioral regression that fails before the fix. For a new API, cover its result and a meaningful unsupported/failure case. Use cross-file fixtures when trust boundaries or snapshots change. Golden JSON is independently reasoned expected behavior; inspect changes instead of blindly recording new output.

Run checks appropriate to the change; the full delivery commands are in AGENTS.md. Review the actual diff and report actionable findings with a trigger, wrong result and source location. Distinguish a correctness bug from an explicitly documented limitation. Do not post a GitHub review or approve/merge a PR merely because a local review passed.

Explain decisions in Traditional Chinese for a backend developer new to React. Connect the domain rule to the result; explain component (rendering unit), state (UI data that changes), and props (parent-provided data/callbacks) when those concepts first matter. Avoid expanding into deferred product features without a new requirement.

## Source-pinned compatibility samples

When introducing upstream Laravel samples, keep the original PHP bytes and record repository, pinned commit, source URLs, hashes and license provenance next to the fixtures. Verify the hashes offline; build the expected inventory or golden contract independently from the PHP rather than recording analyzer output. Separate official samples from locally authored scenarios.

Compare supported behavior with the relevant pinned framework source, and document the sample's coverage. Passing a small corpus does not establish full Laravel or database compatibility. Current-time modifiers are intent metadata, not evaluated timestamps or scalar SQL strings; unsupported combinations need explicit diagnostics. Verify new metadata through immutable replay, snapshots and structural diff, including a meaningful failure case and a built-package example when the public contract changes.
