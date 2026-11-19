# Conference Stay Tracker – Product Requirements (Spec-Driven)

**Version:** 1.0  |  **Type:** Throwaway PWA (live \~3 days, then deleted)  |  **Stack:** Supabase + React PWA  |  **Languages:** Malayalam, English

## 1. Purpose and Scope

A minimal mobile-first web app to manage accommodation and contacts for **500-700 delegates** during a conference. Admins assign delegates to host houses; district users and volunteers look after delegates; delegates see their stay details on a personal link with no login.

**Design principles**

1. Simple over complete: if a feature needs a manual, cut it.
2. Mobile-first, big tap targets, works on weak networks.
3. Every screen available in Malayalam and English.
4. Zero long-term maintenance: the whole system is deleted after the event.

**Out of scope:** chat, payments, transport or meal modules, custom map UI, continuous background GPS tracking, native apps, analytics beyond simple counts.

## 2. Roles and Permissions

| Role | Auth | Scope |
| --- | --- | --- |
| **Admin** (includes committee members) | Supabase Auth login | Everything |
| **District user** | Supabase Auth login | Read-only on delegates of their own district; can mark check-in/out and see emergency contacts for them. **Cannot assign houses.** |
| **Volunteer** | Supabase Auth login | Only delegates assigned to them |
| **Delegate** | None; personal token link or QR | Own stay only |

### Permission matrix

| Capability | Admin | District | Volunteer | Delegate |
| --- | --- | --- | --- | --- |
| Import delegates/houses/staff (CSV) | Yes | No | No | No |
| Assign delegate to house | **Yes** | **No** | No | No |
| Assign volunteer to delegate | Yes | No | No | No |
| View delegate list | All | Own district | Assigned only | Self |
| View house details | All | Houses of own district's delegates | Houses of assigned delegates | Own house |
| View emergency contact | Yes | Own district | Assigned only | Own |
| Mark check-in/out | Yes | Own district | Assigned only | No |
| Post announcements | Yes | No | No | No |
| Read announcements | Yes | Yes | Yes | Yes (targeted) |
| Request location | Yes | No | Assigned only | No |
| Share location / trigger SOS | No | No | No | Yes |
| Acknowledge SOS | Yes | Own district | Assigned only | No |
| Export CSV, purge data | Yes | No | No | No |

## 3. Functional Requirements

Each requirement has an ID, a priority (**P0** = must for event, **P1** = should, **P2** = nice), and acceptance criteria (AC) that double as test cases.

### 3.1 Authentication and access

- **FR-AUTH-1 (P0)** Staff sign in with email and password (Supabase Auth). Accounts are created by the admin via import; no self-signup.
  - AC: Signup is disabled in Supabase settings. A user with no profile row sees an 'access not configured' screen.
- **FR-AUTH-2 (P0)** Role and district are read from the `profiles` table and enforced by RLS, never by UI alone.
  - AC: A district user calling the API directly for another district's delegates receives zero rows.
- **FR-AUTH-3 (P0)** Each delegate has a random unguessable token (at least 12 URL-safe chars). The link `/d/<token>` opens My Stay without login.
  - AC: An invalid token shows a friendly 'link not valid, contact the helpdesk' page in both languages.
- **FR-AUTH-4 (P1)** Admin can regenerate a delegate's token, which invalidates the old link.

### 3.2 Data import

- **FR-IMP-1 (P0)** Admin uploads CSV for delegates, houses and staff with a downloadable template for each.
  - AC: Preview shows row count and per-row errors (missing phone, unknown district, duplicate phone) before commit; commit is all-or-nothing.
- **FR-IMP-2 (P0)** Delegate tokens are generated during import.
- **FR-IMP-3 (P0)** CSV must accept UTF-8 Malayalam text correctly (including files saved from Excel with BOM).

### 3.3 Accommodation assignment (Admin only)

- **FR-ASN-1 (P0)** Assignment screen with two panes: unassigned delegates and houses with 'filled/capacity'. Filter delegates by district, gender and search by name/phone.
- **FR-ASN-2 (P0)** Assign and unassign via select and tap (drag-and-drop optional). Multi-select bulk assign to one house.
  - AC: Assigning updates the house count immediately for all admins.
- **FR-ASN-3 (P0)** Over-capacity is a **soft warning**: admin sees a confirm dialog and may override.
- **FR-ASN-4 (P1)** If a house has a gender restriction and the delegate does not match, show a warning (soft).
- **FR-ASN-5 (P0)** District users have **no assign UI and no write access** to `delegates.house_id`. Enforced in RLS and by column privileges.
  - AC: A district user attempting to update `house_id` via the API gets a permission error.
- **FR-ASN-6 (P0)** Admin can assign a volunteer to each delegate (bulk by district or house).

### 3.4 House details

- **FR-HSE-1 (P0)** House record: name, address, Google Maps link (or lat/lng), host name, host phone, capacity, notes.
- **FR-HSE-2 (P0)** House card shows: address text, **Open in Google Maps** button (`https://www.google.com/maps/search/?api=1&query=lat,lng` or the stored link), **tap-to-call host** (`tel:`). No Maps API key.
- **FR-HSE-3 (P1)** Admin can see who is staying in each house in one list.

### 3.5 Check-in / check-out

- **FR-CHK-1 (P0)** Status per delegate: `pending`, `checked_in`, `checked_out`, `no_show`. Each transition stores timestamp and actor.
- **FR-CHK-2 (P0)** One-tap toggle button on the delegate card for allowed roles.
  - AC: A volunteer cannot change a delegate who is not theirs.
- **FR-CHK-3 (P0)** Dashboard counts (arrived / pending / checked-out / no-show) with district filter. Admin sees all, district user sees own district.
- **FR-CHK-4 (P1)** Undo within the UI by selecting the previous status; all changes written to `audit_log`.

### 3.6 Emergency contact and SOS

- **FR-EMG-1 (P0)** Delegate record holds emergency contact name and phone, shown with a call button to admin, own-district user and assigned volunteer. Never shown on public pages other than the delegate's own.
- **FR-EMG-2 (P0)** Global helpline number(s) set in `app_settings`, pinned on the delegate page.
- **FR-SOS-1 (P0)** Delegate page has a large SOS button with a confirmation step. On confirm, a row is created in `sos_alerts` including location if permission is granted.
  - AC: Assigned volunteer, own-district user and all admins see the alert in real time with sound/vibration cue and a one-tap call and navigate action.
- **FR-SOS-2 (P0)** Alerts have status `open` -> `acknowledged` -> `resolved`; the first acknowledger is recorded.

### 3.7 Announcements and notifications

- **FR-ANN-1 (P0)** Admin posts announcement with title and body in **English and Malayalam** (at least one required), target = all or one district, optional pin.
- **FR-ANN-2 (P0)** Feed visible to all roles including delegates; shows in the user's selected language, falling back to the other language if missing.
- **FR-ANN-3 (P0)** New announcements appear live via Supabase Realtime for open apps; unread badge on the feed.
- **FR-ANN-4 (P2)** Web Push via a Supabase Edge Function for installed PWAs (Android and iOS home-screen only). WhatsApp share of the delegate link is the reliable fallback channel.
- **FR-ANN-5 (P1)** Admin can copy a pre-filled WhatsApp message per delegate (`wa.me` link containing their personal URL), in the language of their choice.

### 3.8 Location sharing (consent-based, no background tracking)

- **FR-LOC-1 (P0)** Delegate page has **Share my location** button. One tap captures a single GPS fix and stores a `location_pings` row.
- **FR-LOC-2 (P0)** Volunteer (or admin) can tap **Ask for location**; the delegate sees a prompt on their page on next open or live update, and can accept or decline.
- **FR-LOC-3 (P0)** Pings are visible only to assigned volunteer and admins, and expire after **30 minutes** (`expires_at`); expired rows are not returned by RLS.
- **FR-LOC-4 (P1)** Optional 'share for 30 minutes' mode that refreshes the ping every 30-60 seconds **while the page is open in the foreground**. UI states this limitation clearly.
- **FR-LOC-5 (P0)** Volunteer sees last ping with 'x minutes ago' and an **Open in Maps** button. No embedded map.

### 3.9 Language (Malayalam / English)

- **FR-I18N-1 (P0)** Language toggle (മലയാളം / English) always visible in the header; choice persisted in localStorage and, for staff, in `profiles.preferred_lang`.
- **FR-I18N-2 (P0)** All UI strings come from `ml.json` and `en.json`; no hard-coded strings. Build fails if a key exists in one file but not the other.
- **FR-I18N-3 (P0)** Delegate page defaults to Malayalam if the browser language is `ml`, otherwise English.
- **FR-I18N-4 (P0)** Malayalam renders correctly on low-end Android: bundle a self-hosted subset of **Noto Sans Malayalam** so it works offline and without Google Fonts.
- **FR-I18N-5 (P0)** Dates and numbers formatted with `Intl` using locale `ml-IN` / `en-IN`.
- **FR-I18N-6 (P1)** User-entered data (names, addresses) is stored as typed in a single field; no automatic transliteration. Search should match either script as typed.
- **FR-I18N-7 (P1)** Malayalam translations are reviewed by a native speaker before launch.

### 3.10 Offline and PWA

- **FR-PWA-1 (P0)** Installable PWA with manifest and icons; service worker caches the app shell and fonts.
- **FR-PWA-2 (P0)** Delegate My Stay page works offline after first load (last fetched stay data cached) and shows 'last updated' time.
- **FR-PWA-3 (P1)** Volunteer list cached for offline viewing and calling.

### 3.11 Export and teardown

- **FR-END-1 (P0)** Admin can export delegates (with house, status, timestamps) and SOS log as CSV.
- **FR-END-2 (P0)** A documented **purge runbook** (section 9) deletes all personal data after the event.

## 4. Screens

| Screen | Roles | Key elements |
| --- | --- | --- |
| Login | Staff | Email, password, language toggle |
| Dashboard | Admin, District | Status counts, SOS banner, district filter |
| Delegates | Admin, District, Volunteer | Search, filters, card with Call / Emergency / Check-in toggle |
| Assign | Admin | Two-pane assignment, bulk select, capacity warnings |
| Houses | Admin | List, add/edit, occupants |
| Announcements | All | Feed; admin composer (EN + ML fields) |
| Import / Export | Admin | CSV upload, preview, errors, downloads |
| Staff | Admin | Create users, set role, district |
| My Stay | Delegate | House card, host call, map, volunteer contact, helpline, announcements, Share location, SOS |
| SOS / Location inbox | Staff | Open alerts, pings, acknowledge |

## 5. Data Model (Supabase Postgres)

```sql
districts(id, name_en, name_ml)
profiles(id uuid pk -> auth.users, full_name, phone, role enum('admin','district','volunteer'), district_id, preferred_lang)
houses(id, name, address, map_url, lat, lng, host_name, host_phone, capacity int, gender_restriction, notes)
delegates(id, token unique, full_name, phone, district_id, gender, emergency_name, emergency_phone, notes,
          house_id, volunteer_id -> profiles, status enum, checked_in_at, checked_out_at)
announcements(id, title_en, title_ml, body_en, body_ml, target_district_id null, pinned, created_by, created_at)
sos_alerts(id, delegate_id, lat, lng, status, acknowledged_by, created_at)
location_requests(id, delegate_id, requested_by, created_at, fulfilled_at)
location_pings(id, delegate_id, lat, lng, accuracy, created_at, expires_at)
audit_log(id, actor, action, entity, entity_id, meta jsonb, created_at)
app_settings(key, value)   -- helpline numbers, event name
```

## 6. Security Spec

1. **RLS enabled on every table.** No table is readable by the `anon` role.
2. Helper functions `auth_role()` and `auth_district()` read from `profiles`.
3. **Delegates table policies**
   - Admin: all operations.
   - District: `SELECT` and `UPDATE(status, checked_in_at, checked_out_at)` where `district_id = auth_district()`.
   - Volunteer: same, where `volunteer_id = auth.uid()`.
   - Column-level `GRANT UPDATE` so only admin can write `house_id`, `volunteer_id`, `token`.
4. **Delegate (anonymous) access only through `SECURITY DEFINER` RPCs** that take the token: `get_my_stay(token)`, `share_location(token, lat, lng)`, `trigger_sos(token, lat, lng)`, `get_announcements(token)`, `respond_location_request(token, ...)`. They return only the delegate's own data, and never other delegates or staff-only fields.
5. `location_pings` select policy includes `expires_at > now()`.
6. Rate-limit token RPCs (simple per-token counter) to blunt link guessing and SOS spam.
7. Staff creation and token regeneration use an **Edge Function** with the service role key; the key is never shipped to the client.
8. HTTPS only; sessions expire after 24h of inactivity for staff.
9. Test the policies with one automated SQL test per role (section 8).

## 7. Architecture

- **Frontend:** Vite + React + TypeScript, Tailwind, `react-i18next`, `vite-plugin-pwa`, `@supabase/supabase-js`. Hosted on any static host (Cloudflare Pages, Netlify or Vercel free tier).
- **Backend:** Supabase (Postgres, Auth, Realtime, Edge Functions). Realtime subscriptions on `announcements`, `sos_alerts`, `location_pings`, `delegates` (status).
- **Edge Functions (two only):** `create-staff`, `send-push` (P2).
- **Environments:** one Supabase project for staging, one for production, so import can be rehearsed.
- **Capacity check:** 700 delegates plus about 100 staff is far below free-tier limits; note Supabase free projects pause after a week of inactivity, so use a Pro project for the event month or keep the project active.

## 8. Quality and Acceptance

**Non-functional targets**

- First load under 3 seconds on 4G; My Stay interactive under 2 seconds on repeat visit.
- Works on Android Chrome (primary), iOS Safari, and low-end devices (2 GB RAM).
- Touch targets at least 48px; body text at least 16px; Malayalam line-height tuned to avoid clipping.
- Handles 700 concurrent delegate page opens (announcement spike) without errors.

**Test plan (must pass before launch)**

| # | Test | Expected |
| --- | --- | --- |
| T1 | Import 700 delegates with Malayalam names | All rows imported, text renders correctly |
| T2 | District user opens another district's delegate by direct API call | No rows |
| T3 | District user tries to set `house_id` | Permission denied |
| T4 | Volunteer marks a non-assigned delegate | Permission denied |
| T5 | Delegate opens invalid token | Friendly bilingual error |
| T6 | Delegate token cannot read other delegates | Verified |
| T7 | Over-capacity assignment | Warning shown, override works |
| T8 | SOS triggered | Volunteer, district user and admin see it within 5 seconds |
| T9 | Location ping after 30 minutes | No longer visible |
| T10 | Toggle language | Every screen fully translated, no raw keys |
| T11 | Airplane mode after first load | My Stay still shows house and host phone |
| T12 | Announcement targeted to one district | Only that district's delegates and staff see it |

**Dress rehearsal:** run the full flow with 20 real users (2 admins, 3 district, 3 volunteers, 12 delegates) one week before the event.

## 9. Rollout and Teardown

**Milestones**

1. **M1 – Foundation:** Supabase schema, RLS, auth, staff creation, CSV import, i18n scaffold (core of the app).
2. **M2 – Core flow:** Assignment screen, house cards, My Stay page, check-in, dashboard.
3. **M3 – Safety and comms:** Announcements, SOS, location requests and pings.
4. **M4 – Polish:** PWA offline, Malayalam review, push (P2), export, rehearsal.

M1 and M2 alone are a usable event tool; cut M4 items first if time runs short.

**Launch checklist**

- Signup disabled, RLS verified by tests, service key not in client bundle.
- Helpline numbers set; Malayalam strings reviewed.
- Delegate links sent via WhatsApp (FR-ANN-5); QR printed at the help desk.
- Admin help-desk lookup by phone number is working for lost links.

**Purge runbook (after the event, within 7 days)**

1. Export final CSV report (FR-END-1) and store securely.
2. Run `TRUNCATE` on delegates, houses, sos\_alerts, location\_pings, location\_requests, audit\_log; delete staff users from Auth.
3. Delete the Supabase project and the hosting project.
4. Remove the WhatsApp link batch and any local copies of CSV imports.

## 10. Risks and Open Questions

| Risk | Mitigation |
| --- | --- |
| Delegates lose their link | Admin lookup by phone, resend via WhatsApp |
| iOS push is unreliable | WhatsApp as primary broadcast, in-app feed as secondary |
| Poor network at venues | Offline cache, minimal payloads |
| Location privacy concerns | Consent-only, 30-minute expiry, assigned volunteer and admin only, purge after event |
| Malayalam translation errors | Native-speaker review (FR-I18N-7) |

**Open questions**

1. Are 'accommodation committee' members given the Admin role (assumed yes), or do they need a limited admin without import/purge?
2. Is gender-based housing a hard rule or a warning (assumed warning)?
3. How many volunteers per district, and will volunteer-to-delegate mapping come from the CSV or be set in the app?
4. Who owns the Supabase and hosting accounts, and who runs the purge?
