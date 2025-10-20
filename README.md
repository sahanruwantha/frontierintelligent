# Frontier Intelligent — Static demo site
This repository contains a single-page, animated, responsive website implemented with HTML, CSS, and JavaScript. It is a static demo intended to showcase a modern, animated landing page for the company "Frontier Intelligent".

Preview

Open `index.html` directly in a modern browser, or run a simple static server from the project root.

Using Python 3:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Files added
- `index.html` — main site with semantic sections (hero, features, about, team, contact)
- `styles.css` — styling, responsive layout and animations
- `script.js` — interactivity: typing headline, nav toggle, tilt cards, canvas background
- `logo.svg` — simple brand mark used in the header

Notes and next steps
- This is intentionally static (no backend). For production, add server-side contact handling, form validation, and accessibility audits.
- Consider optimizing images, adding a favicon, and preparing build tooling (minification, bundling) for deployment.

License

You can use and adapt this demo freely for prototyping and design exploration.