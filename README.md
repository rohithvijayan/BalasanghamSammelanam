# ബാലസംഘം സംസ്ഥാന സമ്മേളനം – താമസ വിവര പോർട്ടൽ
### Balasangham State Conference – Stay & Accommodation Tracker

[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline_Ready-E91E63?logo=pwa&logoColor=white)](https://vite-pwa-org.netlify.app/)
[![Vitest](https://img.shields.io/badge/Vitest-27_Passed-729B1B?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-11_Passed-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)

> **8-ാമത് ബാലസംഘം സംസ്ഥാന സമ്മേളനം**  
> **2026 നവംബർ 27, 28, 29 • നീലേശ്വരം, പാലായി, കാസർഗോഡ്**  
> *8th Balasangham State Conference • Nov 27–29, 2026 • Nileshwaram, Palayi, Kasaragod*

---

## 📌 അവലോകനം (Overview)

ബാലസംഘം സംസ്ഥാന സമ്മേളനത്തിൽ പങ്കെടുക്കുന്ന നൂറുകണക്കിന് കുട്ടികൾക്കും (10–14 വയസ്സ്), അവരുടെ രക്ഷിതാക്കൾക്കും, വളണ്ടിയർമാർക്കും, സംഘാടക സമിതിക്കും താമസസൗകര്യ വിവരങ്ങൾ സുരക്ഷിതമായും തത്സമയവും നൽകുന്നതിനായി തയ്യാറാക്കിയ **Progressive Web Application (PWA)** ആണ് ഈ പ്ലാറ്റ്‌ഫോം.

### പ്രധാന ലക്ഷ്യങ്ങൾ:
1. **കുട്ടികൾക്കും രക്ഷിതാക്കൾക്കും ലളിതമായ ഉപയോഗം:** ലോഗിൻ ആവശ്യമില്ലാതെ വ്യക്തിഗത ടോക്കൺ ലിങ്ക് (`/d/:token`) വഴിയോ ഹോംപേജിൽ ടോക്കൺ/ഫോൺ നമ്പർ നൽകിയോ താമസസ്ഥലം, ആതിഥേയർ, ഗൂഗിൾ റൂട്ട് മാപ്പ്, വളണ്ടിയർ സഹായം എന്നിവ കാണാം.
2. **കുട്ടികളുടെ സ്വകാര്യതാ സംരക്ഷണം (Child Privacy):** പൊതു ഹോംപേജിൽ മറ്റ് കുട്ടികളുടെ വിവരങ്ങളോ അഡ്മിൻ ലിങ്കുകളോ പരസ്യപ്പെടുത്താതെ പൂർണ്ണമായും സുരക്ഷിതം.
3. **റോൾ അടിസ്ഥാനത്തിലുള്ള അൺലോക്കിംഗ് (Role-Based Unlocking):** സംസ്ഥാന അഡ്മിൻ, ജില്ലാ കോർഡിനേറ്റർമാർ, ഹെൽപ്പ് ഡെസ്ക് വളണ്ടിയർമാർ എന്നിവർക്കായി പ്രത്യേകം സജ്ജീകരിച്ച വർക്ക് ബെഞ്ചുകൾ.
4. **100% ഓഫ്‌ലൈൻ പിന്തുണ:** ട്രെയിൻ യാത്രയിലോ നെറ്റ്‌വർക്ക് തടസ്സമുള്ളപ്പോഴോ ഫോണിൽ സേവ് ചെയ്ത വിവരങ്ങൾ കാണാൻ സാധിക്കുന്ന PWA കാഷിംഗ്.

---

## 🚀 റോൾ അടിസ്ഥാനത്തിലുള്ള വർക്ക് ബെഞ്ചുകൾ (Workspaces & Roles)

ലോഗിൻ ചെയ്യുന്ന ഉപയോക്താവിന്റെ ക്രെഡൻഷ്യൽ അനുസരിച്ച് പ്ലാറ്റ്‌ഫോം സ്വയം അൺലോക്ക് ആകുന്നു:

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
│ • 14 Districts   │           │ • Locked to own  │           │ • Instant Search │
│ • Allotment Matrix│          │   District       │           │ • 1-Tap Check-In │
│ • CSV Data Import│           │ • District Stats │           │ • Host Directory │
│ • Capacity Alerts│           │ • Attendance     │           │ • WhatsApp Share │
└──────────────────┘           └──────────────────┘           └──────────────────┘
```

### 1. പബ്ലിക് ഡെലിഗേറ്റ് പോർട്ടൽ (Public Delegate View – `/` & `/d/:token`)
* വാട്ട്‌സ്ആപ്പിൽ ലഭിക്കുന്ന ഒറ്റ ലിങ്ക് വഴി നേരിട്ട് പ്രവേശനം.
* **താമസസ്ഥല വിവരങ്ങൾ:** വീടിന്റെ പേര്, വിലാസം, ആതിഥേയന്റെ പേര്, ഫോൺ നമ്പർ (ഒറ്റ ക്ലിക്കിൽ വിളിക്കാം), റൂട്ട് മാപ്പ് (Google Maps).
* **വളണ്ടിയർ സപ്പോർട്ട്:** സമീപത്തുള്ള വളണ്ടിയറുടെ പേരും ഫോൺ നമ്പറും.
* **24/7 കൺട്രോൾ റൂം ഹെൽപ്പ്‌ലൈനുകൾ:** കൺട്രോൾ റൂം, മെഡിക്കൽ ടീം, അക്കോമഡേഷൻ കൺവീനർ നമ്പറുകൾ.
* **താൽക്കാലിക ലൊക്കേഷൻ ഷെയറിംഗ് (30 Mins):** കുട്ടികൾ വഴിതെറ്റിയാൽ വളണ്ടിയർമാർക്ക് കണ്ടെത്താൻ താൽക്കാലിക GPS ഷെയറിംഗ്.
* **ദ്വിഭാഷാ പിന്തുണ (Bilingual):** മലയാളം (Anek Malayalam 800 Bold) & English.

### 2. വളണ്ടിയർ ഹെൽപ്പ് ഡെസ്ക് (Volunteer Desk – `/volunteer`)
* **തത്സമയ ഹാജർ നില:** ആകെ പ്രതിനിധികൾ, എത്തിയവർ (Checked In), ഇനി എത്താനുള്ളവർ (Pending) എന്നിവയുടെ ശതമാനം.
* **1-ടാപ്പ് ഹാജർ രേഖപ്പെടുത്തൽ:** പേരോ നമ്പറോ ടോക്കണോ സെർച്ച് ചെയ്ത് ഒറ്റ ക്ലിക്കിൽ *"ഹാജർ രേഖപ്പെടുത്തുക (Check In)"* അല്ലെങ്കിൽ *"ഹാജരായി ✓"*.
* **ആതിഥേയ വീടുകളുടെ ഡയറക്ടറി:** ഓരോ വീടുകളിലെയും കപ്പാസിറ്റി, ആതിഥേയന്റെ കോൺടാക്റ്റ്, നിലവിൽ താമസിക്കുന്ന കുട്ടികളുടെ പട്ടിക.
* **വാട്ട്‌സ്ആപ്പ് ഷെയർ:** രക്ഷിതാക്കൾക്ക് കുട്ടിയുടെ വ്യക്തിഗത ലിങ്ക് ഒറ്റ ക്ലിക്കിൽ അയക്കാം.

### 3. ജില്ലാ കോർഡിനേഷൻ വർക്ക് ബെഞ്ച് (District Workbench – `/admin`)
* ലോഗിൻ ചെയ്ത ജില്ലാ കൺവീനറുടെ ജില്ലയിലേക്ക് (ഉദാ: കണ്ണൂർ, കാസർഗോഡ്) ഓട്ടോമാറ്റിക്കായി ലോക്ക് ചെയ്യപ്പെടുന്നു.
* ആ ജില്ലയിലെ കുട്ടികളുടെ വിവരങ്ങൾ, അലോട്ട് ചെയ്ത വീടുകൾ, ഹാജർ നില എന്നിവ മാത്രം കാണാനും നിയന്ത്രിക്കാനും സാധിക്കും.

### 4. സംസ്ഥാന അഡ്മിൻ വർക്ക് ബെഞ്ച് (State Admin – `/admin` & `/import`)
* **14 ജില്ലകളും കൈകാര്യം ചെയ്യാനുള്ള പൂർണ്ണ അധികാരം.**
* **കപ്പാസിറ്റി ഓവർഫ്ലോ മുന്നറിയിപ്പ്:** ഒരു വീടിന്റെ കപ്പാസിറ്റിയിൽ കൂടുതൽ കുട്ടികളെ അലോട്ട് ചെയ്യുമ്പോൾ അഡ്മിന് മുന്നറിയിപ്പ് നൽകുന്നു (Override Warning).
* **CSV ഡാറ്റാ ഇമ്പോർട്ട് (`/import`):** പ്രതിനിധികളുടെയും വീടുകളുടെയും വലിയ ലിസ്റ്റുകൾ ഒറ്റ ക്ലിക്കിൽ CSV വഴി അപ്‌ലോഡ് ചെയ്യാം.

---

## 🔑 ടെസ്റ്റ് ലോഗിൻ അക്കൗണ്ടുകൾ (Demo Accounts)

ലോഗിൻ സ്ക്രീനിൽ (`/login`) ഒറ്റ ക്ലിക്കിൽ പരീക്ഷിക്കാൻ 3 ഡെമോ ബട്ടണുകൾ നൽകിയിട്ടുണ്ട്:

| ലെവൽ | ഇമെയിൽ | പാസ്‌വേഡ് | അൺലോക്ക് ആകുന്ന പരിധി |
| :--- | :--- | :--- | :--- |
| **സംസ്ഥാന അഡ്മിൻ** | `admin@balasangham.in` | `admin123` | മുഴുവൻ അഡ്മിൻ വർക്ക് ബെഞ്ച്, CSV ഇമ്പോർട്ട്, എല്ലാ ജില്ലകളും |
| **ജില്ലാ കൺവീനർ** | `kannur@balasangham.in` | `kannur123` | കണ്ണൂർ ജില്ലാ തല അലോട്ട്മെന്റും ഹാജർനിലയും |
| **വളണ്ടിയർ** | `volunteer@balasangham.in` | `volunteer123` | വളണ്ടിയർ വരവ് സ്വീകരണ ഡെസ്ക്, 1-ടാപ്പ് ചെക്ക്-ഇൻ, ഹോസ്റ്റ് ഫോണുകൾ |

---

## 🛠️ സാങ്കേതിക വിവരങ്ങൾ (Tech Stack)

* **ഫ്രണ്ട് എൻഡ്:** React 19, TypeScript 5.7, Tailwind CSS 3.4
* **ബിൽഡ് ടൂൾ:** Vite 6.2 (Vendor Chunks splitting: icons, supabase, vendor < 300 kB)
* **ഓഫ്‌ലൈൻ PWA:** `vite-plugin-pwa` precaching fonts, logo, and artwork assets
* **ടൈപ്പോഗ്രാഫി:** ഔദ്യോഗിക മലയാളം ഫോണ്ട് **Anek Malayalam 800 Bold** (Local webfonts for 100% offline support without glyph clipping)
* **ഡാറ്റാബേസ്:** Supabase PostgreSQL (Row Level Security, RPCs, fallback to reactive LocalStorage store)
* **ടെസ്റ്റിംഗ്:**
  - **Unit Testing:** Vitest 5.1 + React Testing Library (27 tests)
  - **E2E Testing:** Playwright Test 1.59 (11 tests in headless Chrome)

---

## 💻 ഇൻസ്റ്റാളേഷനും റണ്ണിംഗും (Getting Started)

### 1. റിപ്പോസിറ്ററി ക്ലോൺ ചെയ്യുക:
```bash
git clone https://github.com/rohithvijayan/balasangham-sammelanam-tracker.git
cd balasangham-sammelanam-tracker
```

### 2. പാക്കേജുകൾ ഇൻസ്റ്റാൾ ചെയ്യുക:
```bash
npm install
```

### 3. ഡെവലപ്‌മെന്റ് സെർവർ പ്രവർത്തിപ്പിക്കുക:
```bash
npm run dev
```
ബ്രൗസറിൽ `http://localhost:5173` തുറക്കുക.

### 4. എൻവയോൺമെന്റ് വേരിയബിളുകൾ (Optional):
ലൈവ് സുപാബേസ് ഡാറ്റാബേസ് കണക്ട് ചെയ്യാൻ `.env.local` ഫയൽ നിർമ്മിച്ച് നൽകാം (നൽകിയില്ലെങ്കിലും പ്ലാറ്റ്‌ഫോം പൂർണ്ണമായും ഓഫ്‌ലൈൻ/മോക്ക് മോഡിൽ പ്രവർത്തിക്കും):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

---

## 🧪 ടെസ്റ്റുകൾ പ്രവർത്തിപ്പിക്കാൻ (Running Tests)

### Unit Tests (27 Tests):
```bash
npm run test
```

### End-to-End (E2E) Tests (11 Tests):
```bash
npm run test:e2e
```

### പ്രൊഡക്ഷൻ ബിൽഡ്:
```bash
npm run build
```

---

## 🗄️ ഡാറ്റാബേസ് സ്കീമ (Database Architecture)

`supabase/` ഫോൾഡറിൽ പ്രൊഡക്ഷൻ-റെഡി SQL സ്ക്രിപ്റ്റുകൾ നൽകിയിട്ടുണ്ട്:
* [supabase/schema.sql](file:///home/rohithvijayan/Desktop/BalasanghamSammelanam/supabase/schema.sql): PostgreSQL ടേബിളുകൾ (`districts`, `host_houses`, `delegates`, `profiles`, `announcements`, `location_logs`), RLS സെക്യൂരിറ്റി പോളിസികൾ, `get_my_stay` RPC, `share_location` RPC.
* [supabase/seed.sql](file:///home/rohithvijayan/Desktop/BalasanghamSammelanam/supabase/seed.sql): കേരളത്തിലെ 14 ജില്ലകൾ, സാമ്പിൾ ആതിഥേയ വീടുകൾ, പ്രൊഫൈലുകൾ, ഡെലിഗേറ്റുകൾ.

---

## 📄 ലൈസൻസ് (License)

This project is licensed under the MIT License - see the LICENSE file for details.  
ബാലസംഘം സംസ്ഥാന സ്വാഗതസംഘം ഓഫീസ് • നീലേശ്വരം, പാലായി, കാസർഗോഡ്.
