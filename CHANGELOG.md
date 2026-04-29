# Changelog

## v0.5.4 — 2026-04-29

### Design system alignment (v1.3)
- Updated brand colours across all pages: primary navy `#1B3664`, blue-teal `#5684C4`, body text `#2D2D2D`, borders `#DDDDDD`
- Added Inter Bold and Montserrat Regular (Google Fonts) to all pages
- Updated `manifest.json` `theme_color` to `#1B3664`
- Inlined all module CSS — removed external `<link rel="stylesheet">` from business and growth pages
- Added missing `<head>` meta block to `business/index.html` (manifest, theme-color, favicons, PWA tags)
- Inlined Supabase client initialisation in every page
- Added `.sign-out-btn` to business and growth authenticated pages
- Standardised login form IDs to `signInForm`, `login-btn`, `message`
- Removed em-dash from login success message
- Removed exclamation mark from auth alert message
- Fixed `offline.html` footer copy to use correct practice description
- Removed duplicate `ai.js` load from `growth/index.html`
- Removed duplicate `apple-mobile-web-app-capable` meta tag from `growth/index.html`
- Bumped service worker cache version to `coach4u-v0.5.3`
- Updated version badge in `business/index.html` to v0.5.4

## v0.5.3 — prior

- Built complete ThriveHQ external PWA app (Phase 1)
- Added ThriveHQ to `/thrivehq/` with separate Supabase project
- Configured PWA manifest and service worker for `/external-Coach4u-app/thrivehq/` path
- Magic link authentication with Supabase integration
- Brain Pulse dashboard with 4 sections
- Resources hub, account page, and offline support

## v0.5.2 — prior

- Standardised typography: consolidated font sizes to 7 standard steps
- Bumped service worker cache version

## v0.5.1 — prior

- Fixed critical bug: `business/index.html` loading wrong `app.js`
- Nav pills now functional
- Removed error toasts from load functions
- Redesigned header layout
- Nav tabs styled as true pills
