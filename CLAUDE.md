# Claude Code Project Memory

## Git Workflow
- Always push changes directly to `main` branch
- Commit with clear, descriptive messages
- Push after every commit — do not batch pushes
- Bump version number with EVERY change (patch: 0.5.x) in `CLAUDE.md`
- For large file changes: split into small focused files (each under ~8KB) to avoid push timeouts

## Project Overview
- Coach4U business strategy portal — PWA with Supabase authentication
- Hosted on GitHub Pages at `/external-Coach4u-app/`
- Uses magic link (OTP) sign-in via Supabase

## Design System (v1.3)
- Primary (navy): `#1B3664`
- Primary dark: `#0D1F3C` — hover states, dark headers
- Secondary / accent: `#5684C4` — buttons, active borders, links
- Text: `#2D2D2D`
- Border: `#DDDDDD`
- Font headings: Inter 700 (via Google Fonts)
- Font body: Montserrat 400/500/600 (via Google Fonts)
- Touch targets: 44px minimum height on mobile
- Card border-radius: 12px
- IMPORTANT: Do NOT use old colours (`#003366`, `#0D9488`, `#FF6B35`)

## File Structure
```
business/
├── index.html              — slim ~300 lines (panels only, no modals)
├── css/
│   ├── base.css            — header overrides, vision banner, sub-nav, panel
│   ├── alignment.css       — team alignment & GWC
│   ├── org.css             — org chart / accountability chart
│   ├── rocks.css           — rocks / quarterly priorities
│   ├── scorecard.css       — scorecard table & cell popover
│   ├── meeting.css         — L10 meeting
│   ├── issues.css          — kanban / issues board
│   ├── ai.css              — AI coach FAB + floating sidebar
│   └── misc.css            — badges, forms, timer, group overview, responsive
└── js/
    ├── modals.js           — all modals + AI coach UI injected by JS
    └── app.js              — main app logic

css/
└── style.css               — shared design system (variables, reset, cards, buttons, forms, modals, toast)

js/
├── auth.js                 — authentication (magic link, redirects)
├── supabase.js             — Supabase client config
└── ai.js                   — AI coach (Claude API)
```

## Key Rules
- `business/index.html` loads: `css/style.css` (shared) + all 9 `business/css/*.css` files
- Modals are NOT in index.html — they are injected by `business/js/modals.js`
- Panel visibility: `.panel { display: block }` + `.panel.hidden { display: none }` (business override)
- Shared CSS uses opposite pattern: `.panel { display: none }` + `.panel.active { display: block }`

## Supabase
- URL: `https://uoixetfvboevjxlkfyqy.supabase.co`
- Anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaXhldGZ2Ym9ldmp4bGtmeXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDY2ODAsImV4cCI6MjA5MDQyMjY4MH0.ZXYJVdvcj70aGMH1FAixIr0hNCaCDSYLEL93hHVCGDU`

## Current Version
v0.5.4

## Recent Changes (v0.5.4)
- Updated to v1.3 design system (`#1B3664`, `#5684C4`, `#2D2D2D`, `#DDDDDD`)
- Split `business/css/style.css` into 9 focused files (avoids push timeouts)
- Extracted all modals + AI coach UI into `business/js/modals.js`
- Slimmed `business/index.html` from ~600 to ~300 lines
- Deleted unused `growth/` module and `Prototypes-coach4Uexternal/` folder
- Deleted old monolithic `business/css/style.css`

## Current Status
- **Business app**: WORKING — VTO, org chart, rocks, scorecard, meetings, issues, team alignment
- **Mobile**: Responsive at 390px and 768px breakpoints

## Outstanding Tasks
1. Test business app in browser after v1.3 CSS rollout
2. Update `index.html` (login page) to v1.3 colours and fonts
3. Update `css/style.css` shared design system if not yet on v1.3
4. Add sign-out button to authenticated pages
