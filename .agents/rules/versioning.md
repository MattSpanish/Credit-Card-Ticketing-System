---
description: Semantic versioning rules to apply automatically on every update
---

# Versioning Rules

Apply this versioning convention automatically for every update without waiting for explicit user reminders:

1. **Minor changes / small tweaks / bug fixes**:
   - Increase the **last** number of the version number (`x.y.Z`).
   - Example: `2.8.3` -> `2.8.4`.

2. **Major changes / new feature sets**:
   - Increase the **second** number of the version number (`x.Y.0`).
   - Example: `2.8.4` -> `2.9.0`.

3. **A lot of changes in a single update / extensive overhaul**:
   - Increase the **first** number of the version number (`X.0.0`).
   - Example: `2.9.0` -> `3.0.0`.

### Required locations to update on every version bump:
- `package.json` (`"version": "X.Y.Z"`)
- `src/App.jsx` (`<span className="logo-version">vX.Y.Z</span>`, `<div className="logo" title="Tickets vX.Y.Z">`, `ANNOUNCEMENTS_DATA`, and fallback strings in `showUpdateModal`)
- `CLAUDE.md` and documentation files
