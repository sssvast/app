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
- **Booking webhook integration**:
  - Sends booking details on form submit to a configurable endpoint
  - Supports Google Apps Script backend for Google Sheets storage and WhatsApp notifications
  - Uses Google Sheets as the shared booking source of truth when sheet updates are enabled
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
│   ├── data/
│   │   ├── content.json
│   │   ├── gallery.json
│   │   └── sevas.json
│   └── images/
│       ├── t1.jpg
│       ├── t2.jpg
│       ├── t3.jpg
│       └── t4.jpg
├── integrations/
│   └── google-apps-script/
│       └── Code.gs
├── css/
│   └── style.css
└── js/
    └── main.js
```

---

## Run Locally

Serve the site locally (required for JSON-driven content like `sevas.json`, `content.json`, and `gallery.json`).

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Then open `http://localhost:8080/index.html`.

---

## Content Update Guide

### 1. Update site text, titles, nav, banner, sections, location, and footer

All of this is loaded from `assets/data/content.json`.

Main blocks:

- `page`: Telugu/English browser title text
- `nav`: Telugu/English labels for each nav section id
- `hero`: hero kicker/title text
- `banner`: marquee label + event items (`showUntil` optional as `YYYY-MM-DD`)
- `sections.about.paragraphs`: About section content
- `sections.pooja.items`: Pooja list items
- `sections.location`: map intro text, map button text, map URL, coordinates, zoom
- `audio`: background music settings (`musicSrc`, `autoplay`, `loop`, `volume`)
- `integrations`: booking webhook config (`bookingWebhookUrl`, `bookingWebhookTimeoutMs`, `enableSheetUpdate`, `enableWhatsappMessage`)
- `footer`: bilingual footer text

Banner item with end-date example:

```json
{
  "telugu": "ఉగాది పండుగ - 2026 మార్చి 19",
  "english": "Ugadi Festival - March 19, 2026",
  "showUntil": "2026-03-19"
}
```

`showUntil` is inclusive. After that date, the banner item is hidden automatically.

Background music example:

```json
"audio": {
  "musicSrc": "assets/audio/temple-background.mp3",
  "autoplay": true,
  "loop": true,
  "volume": 0.2
}
```

Place your music file inside `assets/audio/` and update `audio.musicSrc` accordingly.

Booking integration example:

```json
"integrations": {
  "bookingWebhookUrl": "https://script.google.com/macros/s/REPLACE_WITH_DEPLOYMENT_ID/exec",
  "bookingWebhookTimeoutMs": 12000,
  "enableSheetUpdate": true,
  "enableWhatsappMessage": true
}
```

### 2. Update seva cards, booking rules, and booking messages

All booking-related configuration is loaded from `assets/data/sevas.json`.

Top-level keys:

- `bookingRules`
- `bookingMessages`
- `sevas`

Each seva item shape:

```json
{
  "id": "unique-seva-id",
  "telugu": "తెలుగు పేరు",
  "english": "English Name",
  "timingTelugu": "ఉదయం 8:00",
  "timingEnglish": "8:00 AM",
  "price": 500,
  "dailySlots": 20,
  "blockedDates": ["2026-04-14", "2026-08-15"]
}
```

Notes:

- Keep each `id` unique.
- Use numeric values for `price` and `dailySlots`.
- `blockedDates` uses `YYYY-MM-DD` values.
- When a blocked date is selected, the date field shows the tooltip text: `Seva not performed`.
- When `integrations.bookingWebhookUrl` and `integrations.enableSheetUpdate` are enabled, `dailySlots` is enforced on the Apps Script side so bookings stay consistent across devices.
- If the live availability lookup is temporarily unavailable, the UI can fall back to browser-local counts, but the backend still rechecks slots before accepting the booking.

Booking message placeholders supported in `bookingMessages`:

- `{sevaName}`
- `{sevaTiming}`
- `{availableSlots}`
- `{dailySlots}`
- `{totalAmount}`
- `{regularAdvanceDays}`
- `{regularWindowDays}`
- `{tuesdayWindowDays}`
- `{nextRequestDate}`
- `{bookingRef}` (booking reference number — available when sheet storage is enabled)

### 3. Update gallery without code changes

Gallery images are loaded from `assets/data/gallery.json`.

Each item shape:

```json
{
  "src": "assets/images/t5.jpg",
  "teluguAlt": "తెలుగు వివరణ",
  "englishAlt": "English description"
}
```

Add the image file to `assets/images/` and add an entry to `gallery.json`.

### 4. Recommended local run mode

Prefer running with a local server (`python -m http.server 8080` or `npx serve .`) so the browser can fetch JSON reliably.

### 5. Booking integrations (Google Sheets + WhatsApp)

To store bookings in Google Sheets and send WhatsApp notifications on every submit:

1. Create a Google Spreadsheet (this will store all bookings).
2. Open Google Apps Script and paste `integrations/google-apps-script/Code.gs`.
3. In `integrations/google-apps-script/Code.gs`, set `BOOKING_SPREADSHEET_ID` to your spreadsheet id.
4. In Apps Script, set Script Properties:
  - `BOOKING_SPREADSHEET_ID` (optional fallback if inline id is left blank).
  - `WHATSAPP_CLOUD_TOKEN`: Meta WhatsApp Cloud API token.
  - `WHATSAPP_PHONE_NUMBER_ID`: WhatsApp Cloud phone number id.
  - `WHATSAPP_TO_NUMBER`: destination WhatsApp number in international format (e.g., `9198xxxxxxx`).
5. Deploy Apps Script as Web App:
  - Execute as: Me
  - Who has access: Anyone
6. Copy the deployed Web App URL.
7. Set `integrations.bookingWebhookUrl` in `assets/data/content.json` to that URL.
8. Set `integrations.enableSheetUpdate` and `integrations.enableWhatsappMessage` in `assets/data/content.json` as needed.
9. Redeploy the Apps Script web app after backend changes.
10. Submit a booking from the site.
11. (Optional) Set up automatic WhatsApp confirmation on status change: in the Apps Script editor run the `installBookingStatusTrigger()` function once. This installs an installable trigger that fires when a cell is edited in the spreadsheet — when the **Status** column (column 13) is changed to `Confirmed`, a WhatsApp message is sent to the devotee's number automatically.

Behavior:

- A sheet tab is created per seva date (`YYYY-MM-DD`) automatically when `enableSheetUpdate` is true.
- Each booking appends a row into that date sheet when sheet updates are enabled.
- The `Slot` column stores the slot number submitted from the booking form.
- Live availability can be queried by seva id and date from the Apps Script web app.
- When sheet updates are enabled, slot availability is rechecked under a server lock before appending the row, which prevents overbooking across devices.
- If sheet updates are disabled, slot availability falls back to browser-local storage and is not shared across devices.
- WhatsApp send is attempted only when `enableWhatsappMessage` is true and WhatsApp Script Properties are configured.
- Each booking row includes a unique **Booking Reference** (format: `BKYYMMDDHHMMSSmmm`) and a **Status** column that defaults to `Submitted`.
- **Booking status lifecycle**: `Submitted` → `Reviewed` → `Confirmed`. The temple admin updates the Status cell directly in the sheet. No redeployment needed for status updates.
- When the installable trigger is active, changing a booking's Status to `Confirmed` automatically sends a WhatsApp message to the devotee confirming their booking.

---

## Admin Portal (`admin.html`)

A standalone admin page that shows all seva bookings grouped by date with their current status.

### Access control

- Protected by Google Sign-In (Google Identity Services).
- Only the Google account `svanjaneya.temple@gmail.com` is allowed in.
- Every data request is verified server-side: the Apps Script backend calls the Google tokeninfo API to validate the ID token before returning any booking data.

### Setup steps

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Click **Create credentials → OAuth 2.0 Client ID**.
3. Application type: **Web application**.
4. Under **Authorised JavaScript origins**, add the URL you serve the site from (e.g. `http://localhost:8080`).
5. Copy the generated Client ID.
6. Open `admin.html` and paste the Client ID into the `ADMIN_GOOGLE_CLIENT_ID` constant near the top of the `<script>` section.
7. Redeploy the Apps Script web app so the new `admin-bookings` endpoint is live.
8. Open `admin.html` in your browser and sign in with `svanjaneya.temple@gmail.com`.

### What it shows

- Summary cards: total bookings, total amount, counts by status.
- Date accordion (newest date first): each section lists all bookings for that date.
- Booking table columns: #, Ref, Devotee, Gotram, Phone, Seva, Timing, Slot, Amount, Status.
- Status badges are colour-coded: **Submitted** (amber), **Reviewed** (blue), **Confirmed** (green).

### Updating a booking's status

Update the **Status** cell directly in the Google Sheet. If `installBookingStatusTrigger()` has been run, changing a status to `Confirmed` automatically sends a WhatsApp message to the devotee.

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
