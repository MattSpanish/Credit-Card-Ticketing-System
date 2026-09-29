# Agent Instructions & Project Rules

## Versioning Rules (MANDATORY ON EVERY UPDATE)
Always apply this semantic versioning convention automatically for every update without needing user reminders:

1. **Minor changes / bug fixes / small tweaks**:
   - Increase the **last** number (Patch: `x.y.Z + 1`).
   - Example: `2.8.3` $\rightarrow$ `2.8.4`.

2. **Major changes / substantial new feature additions**:
   - Increase the **second** number (Minor: `x.Y + 1.0`).
   - Example: `2.8.4` $\rightarrow$ `2.9.0`.

3. **Extensive changes / massive overhaul in a single update**:
   - Increase the **first** number (Major: `X + 1.0.0`).
   - Example: `2.9.0` $\rightarrow$ `3.0.0`.

---

### Files to Update During a Version Bump:
- **`package.json`**: `"version": "X.Y.Z"`
- **`src/App.jsx`**:
  - Sidebar logo badge: `<span className="logo-version">vX.Y.Z</span>`
  - Sidebar logo container tooltip: `<div className="logo" title="Tickets vX.Y.Z">`
  - `ANNOUNCEMENTS_DATA`: Add the new release record with `version: "vX.Y.Z"`, `isLatest: true`, and set previous release to `isLatest: false`.
  - Fallback version strings in `showUpdateModal` and `handleConfirmUpdateModal`
- **`CLAUDE.md`** & **`README.md`** (if referenced)
