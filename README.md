# శ్రీ శ్రీ శ్రీ వరధాంజనేయ స్వామి వారి దేవాలయం
**Sri Sri Sri Varadhan Janeya Swamy Temple**

A bilingual (Telugu / English) static single-page website for the Sri Sri Sri Varadhan Janeya Swamy Temple in Danapuram, L. B. Nagar, Hyderabad-74, Telangana.

---

## Current Features (As Implemented)

- **Language toggle (Telugu/English)**
  - Updates all text using `data-telugu` and `data-english`
  - Updates navigation labels, gallery image captions (`alt`), and `<title>`
  - Switches document language (`<html lang="te|en">`)
- **Sticky responsive header** with:
  - Temple branding
  - Language switch buttons
  - Mobile menu toggle (shown on small screens)
- **Scrolling upcoming events banner** (auto-scroll marquee that pauses on hover/focus)
- **Hero section** with welcome text and quick action buttons
- **Sections**: About, Pooja & Services, Festivals, Gallery, Location
- **Active nav highlighting on scroll** using Intersection Observer
- **Gallery lightbox**:
  - Opens on image click
  - Closes via close button, backdrop click, or `Esc`
  - Returns focus to last clicked gallery item
- **Location support**:
  - "Open in Google Maps" external link
  - Embedded map iframe
- **Responsive design** with breakpoints for tablet and mobile layouts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, gradients, `clamp()`, `backdrop-filter`, Grid/Flexbox, media queries) |
| Scripting | Vanilla JavaScript (DOM API, Intersection Observer) |
| Fonts | Google Fonts: Noto Sans Telugu, Noto Serif Telugu |

No build step, package manager, or framework is required.

---

## Project Structure

```text
app/
├── index.html
├── README.md
├── assets/
│   └── images/
│       ├── t1.jpg
│       ├── t2.jpg
│       ├── t3.jpg
│       └── t4.jpg
├── css/
│   └── style.css
└── js/
    └── main.js
```

---

## Run Locally

### Option 1: Open directly

Open `index.html` in a browser.

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

### Option 2: Serve locally (recommended)

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Then open `http://localhost:8080/index.html`.

---

## Content Update Guide

### 1. Update bilingual text

In `index.html`, content uses this pattern:

```html
<p data-telugu="తెలుగు వచనం" data-english="English text">తెలుగు వచనం</p>
```

Update both language attributes. Keep the visible text aligned with the default language (currently Telugu).

### 2. Update navigation labels

If you add a new section/nav link:

1. Add `<section id="your-section">...</section>` in `<main>`.
2. Add matching nav link with `data-section="your-section"` in `<nav id="primaryNav">`.
3. Add Telugu and English labels inside `navLabels` in `js/main.js`.

### 3. Update page titles per language

Edit `pageTitles` in `js/main.js`.

### 4. Add gallery images

1. Add image file under `assets/images/`.
2. Add a new gallery button in `index.html`:

```html
<button class="gallery-item" type="button" role="listitem">
  <img
    src="assets/images/t5.jpg"
    alt="Description"
    data-telugu-alt="తెలుగు వివరణ"
    data-english-alt="English description"
    loading="lazy"
  />
</button>
```

### 5. Update map details

In `index.html` Location section:

- Update external map link (`<a class="map-link" href="...">`)
- Update embedded map iframe `src`

---

## Browser Compatibility

Tested for modern browsers that support:

- CSS custom properties
- `backdrop-filter`
- Intersection Observer API

Internet Explorer is not supported.

---

## Temple Information

| Field | Value |
|---|---|
| Deity | Sri Anjaneya Swamy (Hanuman) |
| Address | Danapuram, L. B. Nagar, Hyderabad-74, Telangana |
| Phone | 040-12345678 |
| Maps Link | https://maps.app.goo.gl/aPE5P6qyGQTjuyRh7 |

---

## License

This project is intended for temple trust and devotee use. All rights reserved © 2026 Sri Sri Sri Varadhan Janeya Swamy Temple.
