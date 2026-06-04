# Edmonton Fabric User Group — Raffle Spinner

A visually appealing slot-machine-style raffle spinner built for the Edmonton Fabric User Group. Upload a CSV or Excel file of participants, pick the name column, and spin to draw winners — complete with sound effects, confetti, and a color scheme inspired by the [Global Fabric Community](https://globalfabric.community/).

<p align="center">
  <img src="public/edm-fabric-usergroup-raffle-spinner_main.png" alt="Raffle Spinner - Main Screen" width="600" />
  <br />
  <img src="public/edm-fabric-usergroup-raffle-spinner_winner.png" alt="Raffle Spinner - Winner Screen" width="600" />
</p>

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- **Slot machine animation** — Names scroll vertically with natural deceleration easing
- **Sound effects** — Procedural tick sounds during spin and a fanfare on winner reveal (Web Audio API, no external files)
- **Confetti celebration** — Multi-burst confetti explosion when a winner is drawn
- **CSV & Excel support** — Upload `.csv`, `.xlsx`, or `.xls` files; pick which column contains names
- **Multi-winner draws** — Previous winners are removed from the pool automatically
- **Winner history sidebar** — Track all drawn winners in order
- **Keyboard shortcuts** — `Space` to spin, `Escape` to dismiss the winner overlay
- **Global Fabric Community themed** — Dark navy UI with signature green accents and gold winner highlights
- **Fully client-side** — No backend or server required; runs entirely in the browser

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later (LTS recommended)
- npm (included with Node.js)

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/<your-org>/edm-fabric-usergroup_raffle-spinner.git
cd edm-fabric-usergroup_raffle-spinner
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Vite will print a local URL (default **http://localhost:5173**). Open it in your browser — the app hot-reloads as you edit files.

To stop the dev server, press `Ctrl+C` in the terminal.

### 4. Build for production

```bash
npm run build
```

The optimized output will be in the `dist/` folder. You can preview the production build with:

```bash
npm run preview
```

If you'll be hosting under a sub-path (e.g. GitHub Pages project sites), set `BASE_PATH` when building so asset URLs resolve correctly:

```bash
BASE_PATH=/raffle-spinner/ npm run build      # macOS / Linux
$env:BASE_PATH='/raffle-spinner/'; npm run build  # Windows PowerShell
```

---

## Customizing for Your Event

All event-specific text lives in **three constants** at the top of [`src/App.jsx`](src/App.jsx). Update these for each new event — nothing else needs to change.

```jsx
// src/App.jsx
const EVENT_NAME    = 'Edmonton Fabric User Group';
const EVENT_TAGLINE = 'Global Fabric Day Raffle';
const EVENT_DATE    = '2026-06-27'; // YYYY-MM-DD
```

| Constant | What it controls | Example |
|---|---|---|
| `EVENT_NAME` | Large title in the header | `Edmonton Fabric User Group` |
| `EVENT_TAGLINE` | Short description before the date | `Global Fabric Day Raffle` |
| `EVENT_DATE` | ISO date (`YYYY-MM-DD`). Rendered as `Saturday, Jun 27, 2026` | `2026-06-27` |

The header subtitle is composed as: **`{EVENT_TAGLINE} · {formatted EVENT_DATE}`**.

### Changing logos

The header shows two logos sourced from `public/`:

- **Left:** `public/edm_fabusergroup.png` — your local user group
- **Right:** `public/global-fabric-community-logo.svg` — links to <https://globalfabric.community/>

Replace either file (keep the same filename) or edit the `<img>` tags in `src/App.jsx` to point at different assets.

### Changing the theme

Color variables live in [`src/index.css`](src/index.css) under `:root` (the `--gfc-*` palette). Backwards-compatible `--fabric-*` aliases mean existing component CSS keeps working when you swap the palette.

---

## Usage

1. **Upload a file** — Drag and drop (or click to browse) a `.csv` or `.xlsx` file containing participant names.
2. **Select the name column** — If the file has multiple columns, pick the one that contains participant names.
3. **Spin!** — Click the **SPIN** button or press `Space` to draw a winner.
4. **Celebrate** — The winner is revealed with confetti and a fanfare sound effect.
5. **Draw again** — Click **Continue** (or press `Escape`), then spin again. Previous winners are automatically removed from the pool.
6. **Reset** — Click **Reset Raffle** to put all participants back in the pool, or **Load New File** to start over with a different file.

A sample file is included at `public/test-participants.csv` for testing.

---

## Project Structure

```
raffle-spinner/
├── public/
│   ├── edm_fabusergroup.png       # Edmonton Fabric User Group logo
│   └── test-participants.csv      # Sample participant list for testing
├── src/
│   ├── components/
│   │   ├── ColumnSelector.jsx     # Dropdown to pick the name column
│   │   ├── FileUpload.jsx         # Drag-and-drop file upload zone
│   │   ├── SlotMachine.jsx        # Core slot machine animation
│   │   ├── WinnerDisplay.jsx      # Winner celebration overlay with confetti
│   │   └── WinnerHistory.jsx      # Sidebar listing all drawn winners
│   ├── hooks/
│   │   ├── useAudio.js            # Web Audio API sound effects (tick, fanfare)
│   │   └── useRaffle.js           # Raffle state management
│   ├── utils/
│   │   └── fileParser.js          # CSV/Excel file parser (PapaParse + read-excel-file)
│   ├── App.jsx                    # Main app shell and layout
│   ├── App.css                    # Fabric-themed component styles
│   ├── index.css                  # Global reset and CSS variables
│   └── main.jsx                   # React entry point
├── package.json
└── vite.config.js
```

---

## Tech Stack

| Technology | Purpose | Documentation |
|---|---|---|
| [React 19](https://react.dev/) | UI framework | [React Docs](https://react.dev/learn) |
| [Vite 8](https://vite.dev/) | Build tool & dev server | [Vite Guide](https://vite.dev/guide/) |
| [Framer Motion](https://www.framer.com/motion/) | Animation library | [Framer Motion Docs](https://www.framer.com/motion/introduction/) |
| [PapaParse](https://www.papaparse.com/) | CSV file parsing | [PapaParse Docs](https://www.papaparse.com/docs) |
| [read-excel-file](https://gitlab.com/nicedoc/read-excel-file) | Excel (.xlsx) file parsing | [read-excel-file README](https://gitlab.com/nicedoc/read-excel-file#readme) |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Confetti particle effects | [canvas-confetti README](https://github.com/catdad/canvas-confetti#readme) |
| [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) | Procedural sound effects | [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API) |

---

## Input File Format

The app accepts **CSV** (`.csv`) and **Excel** (`.xlsx`, `.xls`) files. The file should have a header row. Example:

| Name | Email | Company |
|---|---|---|
| Alice Johnson | alice@example.com | Contoso |
| Bob Smith | bob@example.com | Fabrikam |
| Carol Williams | carol@example.com | Northwind |

After uploading, you'll be prompted to select which column contains the participant names.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Spin the raffle (when ready) |
| `Escape` | Dismiss the winner overlay |

---

## Deploying

Since this is a fully static app with no backend, you can deploy the `dist/` folder to any static hosting service:

- **Azure Static Web Apps** — `npm run build`, then deploy `dist/`
- **GitHub Pages** — Use a GitHub Action to build and deploy
- **Netlify / Vercel** — Connect your repo and set build command to `npm run build` with output directory `dist`

---

## License

MIT
