# శ్రీ శ్రీ శ్రీ వరధాంజనేయ స్వామి వారి దేవాలయం
**Sri Sri Sri Varadhan Janeya Swamy Temple**

A bilingual (Telugu / English) single-page website for the Sri Sri Sri Varadhan Janeya Swamy Temple located in Danapuram, L.B. Nagar, Hyderabad, Telangana.

---

## Features

- **Bilingual support** — Toggle between Telugu and English; all text, navigation labels, image captions, and the page title update instantly.
- **Sticky responsive header** — Stays visible while scrolling; collapses into a hamburger menu on smaller screens.
- **Upcoming events banner** — Scrolling ticker to highlight upcoming temple events.
- **Hero section** — Welcome banner with quick links to key sections.
- **About** — Brief history and description of the temple.
- **Pooja & Services** — Lists available ritual services (Archana, Abhishekam, Hanuman Chalisa Recitation, Special Poojas).
- **Festivals** — Lists major festivals celebrated at the temple (Ugadi, Navaratri, Shivaratri).
- **Photo Gallery** — Responsive image grid with a keyboard-accessible lightbox viewer.
- **Location** — Embedded Google Maps street-view iframe for easy directions.
- **Footer** — Address and contact information.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, `clamp()`, `backdrop-filter`, CSS Grid/Flexbox) |
| Scripting | Vanilla JavaScript (Intersection Observer, DOM API) |
| Fonts | [Noto Sans Telugu](https://fonts.google.com/noto/specimen/Noto+Sans+Telugu) & [Noto Serif Telugu](https://fonts.google.com/noto/specimen/Noto+Serif+Telugu) via Google Fonts |

No build tools, npm packages, or external JavaScript frameworks are required.

---

## Project Structure

```
app/
├── main.html   # Single-page application entry point
├── t1.jpg      # Temple front view
├── t2.jpg      # Sanctum sanctorum (Garbhagudi)
├── t3.jpg      # Festival celebration
├── t4.jpg      # Devotees at temple
└── README.md
```

---

## Getting Started

Because the site is a plain HTML file, no build step is needed.

### Open locally

Simply open `main.html` in any modern browser:

```
# Windows
start main.html

# macOS
open main.html

# Linux
xdg-open main.html
```

### Serve with a local server (recommended for production-like testing)

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Then visit `http://localhost:8080/main.html`.

---

## Adding or Updating Content

All content is contained within `main.html`. Each piece of bilingual text uses `data-telugu` and `data-english` attributes that the language-switch script reads at runtime.

### Change bilingual text

```html
<!-- Example pattern used throughout the file -->
<p data-telugu="తెలుగు వచనం" data-english="English text">తెలుగు వచనం</p>
```

Edit both attribute values and the visible inner text (which should match the default language, Telugu).

### Add a gallery image

1. Place your image file (e.g., `t5.jpg`) in the `app/` folder.
2. Add a new `<button>` block inside the `<div class="gallery">` element:

```html
<button class="gallery-item" type="button" role="listitem">
  <img src="t5.jpg" alt="Description"
       data-telugu-alt="తెలుగు వివరణ"
       data-english-alt="English description"
       loading="lazy" />
</button>
```

### Add a navigation section

1. Add a new `<section id="your-section">` in `<main>`.
2. Add a corresponding `<a>` tag in `<nav id="primaryNav">` with `data-section="your-section"`.
3. Add the label entries to both language objects inside `navLabels` in the `<script>` block.

---

## Browser Support

Works in all modern browsers that support:
- CSS custom properties
- `backdrop-filter`
- Intersection Observer API

Internet Explorer is not supported.

---

## Temple Information

| | |
|---|---|
| **Deity** | Sri Anjaneya Swamy (Hanuman) |
| **Address** | Danapuram, L.B. Nagar, Hyderabad-74, Telangana |
| **Phone** | 040-12345678 |

---

## License

This project is intended for the use of the temple trust and its devotees. All rights reserved © 2026 Sri Sri Sri Varadhan Janeya Swamy Temple.
