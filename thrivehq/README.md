# ThriveHQ — ADHD-Friendly Coaching App

A Progressive Web App (PWA) for ThriveHQ external clients. Features Brain Pulse assessments, resources, and ADHD-friendly coaching support.

## Setup

### 1. Create Supabase Database
Run the SQL schema in your Supabase dashboard:
```bash
# See sql/schema.sql for full schema
```

### 2. Update Supabase Credentials
Edit `js/supabase.js` with your Supabase project details:
```javascript
const SUPABASE_URL = 'your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 3. Deploy
Push to GitHub and enable GitHub Pages hosting.

## Features (Phase 1)

- ✅ Magic link authentication
- ✅ Brain Pulse dashboard (Capacity, Wellbeing, Strengths, Execution)
- ✅ Assessment detail pages with coaching focus
- ✅ Resources hub
- ✅ Account/profile page
- ✅ PWA-installable (mobile + desktop)
- ✅ Offline support via service worker
- ✅ Teal color theme

## Future Phases

- Group chat functionality
- Historical assessment tracking
- Client-initiated assessments
- Session calendar integration
- Notifications

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript (vanilla)
- **Backend:** Supabase (PostgreSQL + Auth)
- **Hosting:** GitHub Pages
- **PWA:** Service Worker + Manifest

## File Structure

```
coach4u-thrivehq/
├── index.html                 # Login page
├── dashboard.html             # Home dashboard
├── brain-pulse-detail.html    # Assessment detail
├── resources.html             # Resources hub
├── account.html               # Account/profile
├── css/
│   └── style.css              # Teal theme styles
├── js/
│   ├── supabase.js            # Supabase config
│   ├── auth.js                # Authentication
│   └── app.js                 # Main app logic
├── manifest.json              # PWA metadata
├── sw.js                      # Service worker
└── README.md
```

## Color Scheme

- **Primary:** Navy `#003366`
- **Accent (Teal):** `#0D9488`
- **Capacity:** Teal `#0D9488`
- **Wellbeing:** Light Teal `#5DADE2`
- **Strengths:** Rose `#B19CD9`
- **Execution:** Purple `#7851A9`
