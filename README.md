# Balasangham State Conference – Stay & Accommodation Tracker
### ബാലസംഘം സംസ്ഥാന സമ്മേളനം – താമസ വിവര പോർട്ടൽ

[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline_Ready-E91E63?logo=pwa&logoColor=white)](https://vite-pwa-org.netlify.app/)
[![Vitest](https://img.shields.io/badge/Vitest-27_Passed-729B1B?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-11_Passed-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)

> **8th Balasangham State Conference**  
> **November 27, 28, 29, 2026 • Nileshwaram, Palayi, Kasaragod, Kerala**  
> *Official Delegate Accommodation Management & Arrival Tracking Platform*

---

## 📌 Project Overview

The **Balasangham State Conference Stay Tracker** is a high-performance Progressive Web Application (PWA) designed to manage accommodation logistics, arrival check-ins, and emergency support for over 600 child delegates (aged 10–14) and their accompanying parents and coordinators attending the state conference.

### Core Objectives:
1. **Frictionless Delegate Experience:** Zero app store installation or password friction. Delegates access their allocated home, host details, volunteer contacts, and Google Maps directions via a unique, unguessable personal link (`/d/:token`) sent via WhatsApp or via a fast token search on the homepage.
2. **Child Safety & Privacy:** Public visitor pages never expose directories of delegate names, phone numbers, or administrative tools.
3. **Role-Based Dynamic Access Control:** One platform that unlocks specific workspaces based on credentials:
   - **State Admin:** Full access to all 14 Kerala districts, bulk allocations, housing capacity matrix, and CSV data importing.
   - **District Coordinator:** Strictly locked to the coordinator's assigned district (e.g., Kannur, Kasaragod) to monitor their district's delegates and arrivals.
   - **Volunteer Desk:** High-speed arrival check-in desk with instant search, 1-click status toggling, and host directory.
4. **100% Offline Capability:** Full offline service worker caching for train journeys and weak connectivity areas in Northern Kerala.

---

## 🚀 Workspaces & Architecture

```
                          ┌──────────────────────────┐
                          │   Public Landing Page    │
                          │   (/, /d/:token, /login) │
                          └─────────────┬────────────┘
                                        │ (Sign In)
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐
│   State Admin    │           │     District     │           │    Volunteer     │
│  (Superadmin)    │           │   Coordinator    │           │    Helpdesk      │
├──────────────────┤           ├──────────────────┤           ├──────────────────┤
│ • 14 Districts   │           │ • Scoped to own  │           │ • Live Tallies   │
│ • Full Housing   │           │   District       │           │ • 1-Tap Check-In │
│ • CSV Importer   │           │ • District Stats │           │ • Host Contacts  │
│ • Capacity Alerts│           │ • Arrival Desk   │           │ • WhatsApp Share │
└──────────────────┘           └──────────────────┘           └──────────────────┘
```

### 1. Public Delegate Stay Portal (`/` & `/d/:token`)
* **Verified Accommodation Details:** Host house name, physical address, room allocation, host name, and 1-tap direct dial (`tel:`) button.
* **Navigation:** Built-in Google Maps navigation link directly routed to the host residence.
* **Volunteer Support:** Dedicated neighborhood volunteer name and phone number.
* **24/7 Helplines:** Quick-dial shortcuts for the Nileshwaram Control Room, Medical Aid, and Accommodation Convener.
* **Temporary Location Sharing:** 30-minute consent-based location ping to assist volunteers in guiding lost delegates.
* **Bilingual Switcher:** Instant switching between Malayalam (**Anek Malayalam 800 Bold**) and English.

### 2. Volunteer Arrival Desk (`/volunteer`)
* **Live Attendance Metrics:** Real-time counters for Total Delegates, Arrived/Checked-in (with percentage completion), Pending En Route, and Host Houses.
* **1-Tap Check-In:** Search by delegate name, phone, or token; toggle check-in status with real-time feedback toast notifications.
* **Host House Directory:** View house capacity limits (e.g., 3/4 occupied), host contact numbers, and list of assigned children.
* **WhatsApp Dispatch:** 1-click button to generate pre-filled WhatsApp messages with the child's personal stay link to send to parents.

### 3. District Coordinator Workbench (`/admin`)
* Automatically locked to the coordinator's assigned district (e.g., Kannur).
* Filtered delegate rosters, housing assignments, and arrival monitoring strictly for delegates belonging to their district.
* High-level admin capabilities (such as CSV imports or other districts) are restricted.

### 4. State Admin Super-Workbench (`/admin` & `/import`)
* **Statewide Overview:** Manage housing across all 14 Kerala districts or filter by any individual district.
* **Housing Capacity Matrix:** Visual indicator of occupied vs. free capacity with soft warning prompts when assigning over capacity.
* **Bulk Housing Assignment:** Select multiple unassigned delegates and allocate them to a house in a single action.
* **UTF-8 CSV Importer (`/import`):** Upload delegates and host houses in bulk, with downloadable sample templates and pre-commit validation.

---

## 🔑 Demo Accounts for Testing

The login screen (`/login`) includes quick-fill demo buttons to test each role:

| Role | Email | Password | Unlocked Capabilities |
| :--- | :--- | :--- | :--- |
| **State Admin** | `admin@balasangham.in` | `admin123` | Full Admin Workbench (all 14 districts), CSV Data Importer, Volunteer Desk |
| **District Coordinator** | `kannur@balasangham.in` | `kannur123` | District Workbench strictly locked to Kannur district delegates & attendance |
| **Volunteer** | `volunteer@balasangham.in` | `volunteer123` | Volunteer Helpdesk, 1-tap arrival check-in, host directory |

---

## 🛠️ Technology Stack

* **Frontend:** React 19, TypeScript 5.7, Vite 6.2, Tailwind CSS 3.4, Lucide Icons
* **PWA Engine:** `vite-plugin-pwa` precaching local fonts, responsive artwork, and static assets
* **Typography:** Official Malayalam font **Anek Malayalam 800 Bold** bundled locally for offline support without clipping
* **Database & Auth:** Supabase PostgreSQL (RLS security policies, stored procedures, RPCs) with reactive local storage fallback
* **Testing:**
  - **Unit Tests:** Vitest 5.1 + React Testing Library + jsdom (27 tests)
  - **E2E Tests:** Playwright Test 1.59 (11 tests in headless Chromium)

---

## 💻 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/rohithvijayan/BalasanghamSammelanam.git
cd BalasanghamSammelanam
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Configure Environment Variables (Optional)
To connect to a live Supabase backend, create a `.env.local` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
*(If omitted, the platform automatically runs in mock/local mode with full interactive functionality).*

---

## 🧪 Running the Test Suites

### Unit Tests (27 Tests):
```bash
npm run test
```

### End-to-End Tests with Playwright (11 Tests):
```bash
npm run test:e2e
```

### Production Build:
```bash
npm run build
```

---

## 🗄️ Database Architecture (Supabase / PostgreSQL)

Production-ready SQL migration scripts are located in the `supabase/` directory:
* [`supabase/schema.sql`](./supabase/schema.sql): PostgreSQL tables (`districts`, `houses`, `delegates`, `profiles`, `announcements`, `location_pings`), Row Level Security (RLS) policies, `get_my_stay` RPC, and `share_location` RPC.
* [`supabase/seed.sql`](./supabase/seed.sql): Kerala's 14 districts, sample host homes in Nileshwaram, staff profiles, sample delegates, and conference announcements.

---

## 🚀 Deployment Guide

### Deploy to Vercel (1-Click)
1. Import `rohithvijayan/BalasanghamSammelanam` in [Vercel](https://vercel.com).
2. Set Framework Preset to **Vite** (Build: `npm run build`, Output: `dist`).
3. Add Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
4. Deploy! The included [`vercel.json`](./vercel.json) handles client-side SPA routing (`/d/:token`, `/admin`, `/volunteer`, `/login`) and asset caching.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.  
Balasangham State Conference Organizing Committee Office • Nileshwaram, Palayi, Kasaragod.
