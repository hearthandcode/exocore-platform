# Contributing

Thanks for taking a look at this early project.

## Before opening a change

1. Read the [architecture posture](docs/ARCHITECTURE.md), [governance posture](docs/GOVERNANCE.md), and [public/private boundary](docs/PUBLIC-PRIVATE-BOUNDARY.md).
2. Keep the orientation shell small. Do not add record storage, filesystem access, model calls, analytics, adapters, networking, or automation as a convenience feature.
3. Make a focused branch and explain the user-visible boundary your change preserves.
4. Run the relevant checks before opening a pull request.

```bash
npm ci
npm run check
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

## Good first contributions

- clarity and accessibility improvements to the public orientation surface
- documentation corrections that distinguish a proposal from an implemented capability
- reproducibility and dependency improvements
- issue reports that describe a concrete loss of agency, provenance, or returnability in another tool

## Please do not submit

- credentials, personal data, private workspace material, or copied session records
- broad refactors disguised as a small change
- features that introduce a new authority boundary without a reviewable design and recovery story
