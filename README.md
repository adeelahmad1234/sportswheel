# SportsWheel

A minimalistic, aesthetically pleasing sports stats web app. Spin two slot-machine-style wheels — one for year, one for team — then land in a "guess the roster" game for that team's season, with the full stats table one tap away under an "Answers" toggle.

Covers NBA, NHL, and MLB with live data pulled straight from ESPN, the official NHL API, and MLB Stats API. NFL is present in the UI but shown as "Coming Soon" since no free API provides real per-player NFL stats.

## Features

- Cylindrical drum-style slot machine spinners (year + team) with true infinite scroll
- Conference/division filtering per league
- "Guess the Roster" game — type player names/last names to reveal jersey number, name, and position; optional hints and a countdown timer
- Full sortable, searchable stats table ("Answers" view), color-coded against your guesses
- Three themes: light (default), dark, and navy
- Mobile-first responsive layout

## Tech Stack

- React 18 + Vite
- Tailwind CSS v4
- Framer Motion

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Data Sources

- **NBA / NFL** — ESPN public API
- **NHL** — official NHL API (`api-web.nhle.com`), proxied through corsproxy.io for CORS
- **MLB** — MLB Stats API (`statsapi.mlb.com`)

All APIs used are free and require no API keys.
