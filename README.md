# Election PWA (Mobile-Friendly)

This is the Bahamas Election Calendar packaged as a mobile-friendly Progressive Web App (PWA) suitable for GitHub Pages.

## What changed
- Split into `index.html`, `styles.css`, and `app.js`
- Added responsive (mobile) layout rules
- Added `manifest.webmanifest` + `service-worker.js` for install/offline support
- Added placeholder icons in `/icons`

## GitHub Pages
1. Push these files to your repository root.
2. In GitHub: Settings → Pages → Deploy from branch → `main` → `/(root)`.
3. Open the Pages URL on your phone and use “Add to Home Screen”.

## Notes
If you change filenames or move files into subfolders, update the paths in:
- `manifest.webmanifest`
- `service-worker.js`
