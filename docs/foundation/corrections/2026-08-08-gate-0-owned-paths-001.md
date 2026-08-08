# Gate 0 correction 001: repository lint configuration ownership

- **Corrects:** `EXO-FOUNDATION-20260808-O1`
- **Reason:** The governing development report selects ESLint and the repository had no ESLint configuration. The foundation verification route therefore needs one repo-level configuration path.
- **Added owned path:** `eslint.config.js`
- **Scope effect:** tooling verification only. No feature, canary, intake, runtime authority, provider, deployment, or Hub path is added.
- **Verification:** configuration is exercised by `npm run lint`; dependency versions and licenses are recorded at Evaluation.
- **Papertrail:** The original Orientation Checkpoint remains unchanged. This correction is additive and must be read with it.
