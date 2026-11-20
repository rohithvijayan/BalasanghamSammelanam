import React, { useState } from 'react';
import { useI18n } from '../i18n/i18nContext';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Home,
  Users,
  Edit2,
  Share2,
  Navigation,
  Search,
  Sparkles,
  Phone,
  RefreshCw,
  HelpCircle,
  UserCheck,
  Check
} from 'lucide-react';

interface InteractiveGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'admin' | 'volunteer';
}

export const InteractiveGuideModal: React.FC<InteractiveGuideModalProps> = ({
  isOpen,
  onClose,
  initialRole,
}) => {
  const { language } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const defaultRole = initialRole || (user?.role === 'volunteer' ? 'volunteer' : 'admin');
  const [activeRole, setActiveRole] = useState<'admin' | 'volunteer'>(defaultRole);
  const [currentStep, setCurrentStep] = useState(0);

  // Mini-simulator states
  const [simAdminImportDone, setSimAdminImportDone] = useState(false);
  const [simAdminChecked, setSimAdminChecked] = useState(false);
  const [simAdminEdited, setSimAdminEdited] = useState(false);
  const [simVolSearch, setSimVolSearch] = useState('');
  const [simVolCheckedIn, setSimVolCheckedIn] = useState(false);
  const [simWhatsAppPreview, setSimWhatsAppPreview] = useState(false);
  const [simGpsPinging, setSimGpsPinging] = useState(false);

  if (!isOpen) return null;

  const adminSteps = [
    {
      id: 'import',
      route: '/import',
      badge_ml: 'ഘട്ടം 1: ഡാറ്റ അപ്‌ലോഡ്',
      badge_en: 'Step 1: Ingest Data',
      title_ml: 'എക്സൽ അല്ലെങ്കിൽ CSV ഫയലുകൾ ഇമ്പോർട്ട് ചെയ്യുക',
      title_en: 'Import Spreadsheets (.xlsx & .csv)',
      desc_ml: 'താമസ വീടുകളും പ്രതിനിധികളുടെ ലിസ്റ്റും ഒരൊറ്റ ക്ലിക്കിൽ അപ്‌ലോഡ് ചെയ്യാം. ഡ്യൂപ്ലിക്കേറ്റുകൾ തനിയെ ഒഴിവാക്കപ്പെടും.',
      desc_en: 'Upload host houses and delegates in one click. System cleans duplicates by house name and phone automatically.',
      action_ml: 'ഇമ്പോർട്ട് പേജിലേക്ക് പോവുക',
      action_en: 'Go to Import Page (/import)',
      renderSim: () => (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex flex-col items-center gap-3 text-center">
          <FileSpreadsheet className="w-8 h-8 text-amber-700 animate-bounce" />
          <span className="text-xs font-bold text-amber-950">
            {language === 'ml' ? 'മാതൃകാ ഫയൽ അപ്‌ലോഡ് പരീക്ഷിക്കുക:' : 'Test Mock File Ingestion:'}
          </span>
          <button
            type="button"
            onClick={() => setSimAdminImportDone(!simAdminImportDone)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {simAdminImportDone
                ? (language === 'ml' ? 'വീണ്ടും ശ്രമിക്കുക' : 'Reset Simulator')
                : (language === 'ml' ? 'ഫയൽ ഡ്രോപ്പ് ചെയ്യുക' : 'Drop Sample CSV')}
            </span>
          </button>
          {simAdminImportDone && (
            <div className="w-full p-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{language === 'ml' ? '50 വീടുകളും 100 പ്രതിനിധികളും വിജയകരമായി ലോഡ് ചെയ്തു!' : '50 Houses & 100 Delegates parsed cleanly!'}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'allocation',
      route: '/admin',
      badge_ml: 'ഘട്ടം 2: അലോട്ട്മെന്റ്',
      badge_en: 'Step 2: Assign Housing & Volunteers',
      title_ml: 'പ്രതിനിധികളെ വീടുകളിലേക്കും വളണ്ടിയർമാർക്കും നൽകുക',
      title_en: 'Assign Delegates to Beds & Squad Volunteers',
      desc_ml: 'പ്രതിനിധികളുടെ ചെക്ക്ബോക്സ് സെലക്ട് ചെയ്ത് വീടുകളിൽ "Assign Here" ക്ലിക്ക് ചെയ്യുക. വളണ്ടിയർമാരെയും ഒന്നിച്ച് ചുമതലപ്പെടുത്താം.',
      desc_en: 'Check boxes next to delegates and tap "Assign Here" on a host home. Assign squad captain volunteers in bulk.',
      action_ml: 'വർക്ക് ബെഞ്ചിലേക്ക് പോവുക',
      action_en: 'Go to Admin Workbench (/admin)',
      renderSim: () => (
        <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 flex flex-col gap-3">
          <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
            <Home className="w-4 h-4 text-indigo-700" />
            {language === 'ml' ? 'ലൈവ് അലോട്ട്മെന്റ് സിമുലേറ്റർ:' : 'Live Allocation Simulator:'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div
              onClick={() => setSimAdminChecked(!simAdminChecked)}
              className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                simAdminChecked ? 'bg-indigo-100 border-indigo-400 font-bold' : 'bg-white border-slate-200'
              }`}
            >
              <span>{language === 'ml' ? 'അഭിനന്ദ് സി.വി. (വയനാട്)' : 'Abhinand C.V. (Wayanad)'}</span>
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${simAdminChecked ? 'bg-primary text-white' : 'bg-white'}`}>
                {simAdminChecked && <Check className="w-3 h-3" />}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>{language === 'ml' ? 'പൂന്തോട്ടം വീട്' : 'Poonthottam House'}</span>
                <span className="text-primary">{simAdminChecked ? '3 / 4' : '2 / 4'}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: simAdminChecked ? '75%' : '50%' }}
                />
              </div>
            </div>
          </div>
          <span className="text-[11px] text-indigo-700 italic text-center">
            {simAdminChecked
              ? (language === 'ml' ? '✓ പ്രതിനിധിയെ വീട്ടിലേക്ക് ചേർത്തു! കപ്പാസിറ്റി 3/4 ആയി.' : '✓ Delegate allocated! Capacity updated to 3/4.')
              : (language === 'ml' ? 'പ്രതിനിധിയുടെ പേരിൽ ക്ലിക്ക് ചെയ്ത് അലോട്ട്മെന്റ് കാണുക.' : 'Click the delegate name above to simulate assignment.')}
          </span>
        </div>
      ),
    },
    {
      id: 'inline_edits',
      route: '/admin',
      badge_ml: 'ഘട്ടം 3: തത്സമയ മാറ്റങ്ങൾ',
      badge_en: 'Step 3: Edit on the Fly',
      title_ml: 'പെൻസിൽ ഐക്കൺ ഉപയോഗിച്ച് ഫോൺ നമ്പറുകളും വീടുകളും തിരുത്തുക',
      title_en: 'Instant In-Line Edits (Pencil Icon)',
      desc_ml: 'പ്രതിനിധികളുടെ ഫോൺ നമ്പർ തെറ്റിയാലോ പുതിയ വീട് ചേർക്കണമെങ്കിലോ എഡിറ്റ് മോഡൽ വഴി സെക്കൻഡുകൾക്കുള്ളിൽ തിരുത്താം.',
      desc_en: 'Wrong phone number or new host home? Click the pencil icon on any card to update details instantly without re-uploading.',
      action_ml: 'എഡിറ്റ് ഫീച്ചറുകൾ കാണുക',
      action_en: 'Explore Admin Workbench',
      renderSim: () => (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 w-full justify-between">
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900">{language === 'ml' ? 'അർജുൻ കെ. (കണ്ണൂർ)' : 'Arjun K. (Kannur)'}</span>
              <span className="text-[11px] text-slate-500 font-mono">
                {simAdminEdited ? '+91 94471 23456 (Updated)' : '+91 98470 11223'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSimAdminEdited(!simAdminEdited)}
              className="p-2 rounded-xl bg-primary text-white hover:bg-primary-600 text-xs font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{simAdminEdited ? (language === 'ml' ? 'റീസെറ്റ്' : 'Reset') : (language === 'ml' ? 'തിരുത്തുക' : 'Edit')}</span>
            </button>
          </div>
          {simAdminEdited && (
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {language === 'ml' ? 'ഫോൺ നമ്പർ വിജയകരമായി തിരുത്തി ക്ലൗഡിൽ സേവ് ചെയ്തു!' : 'Phone updated and synced to cloud immediately!'}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'oversight',
      route: '/volunteer',
      badge_ml: 'ഘട്ടം 4: മോണിറ്ററിംഗ്',
      badge_en: 'Step 4: Live Event Oversight',
      title_ml: '15 സെക്കൻഡ് ഓട്ടോ-സിങ്കും ലൈവ് മേൽനോട്ടവും',
      title_en: 'Multi-Device 15s Auto-Cloud Sync',
      desc_ml: 'റെയിൽവേ സ്റ്റേഷൻ, ബസ് സ്റ്റാൻഡ്, താമസസ്ഥലങ്ങൾ എന്നിവിടങ്ങളിലെ എല്ലാ ഫോണുകളിലും ഒരേ വിവരങ്ങൾ 15 സെക്കൻഡിൽ അപ്ഡേറ്റാകും.',
      desc_en: 'Reception volunteers and state coordinators stay 100% in sync with auto-polling every 15s. GPS alerts show live on desk.',
      action_ml: 'റിസപ്ഷൻ ഡെസ്ക് കാണുക',
      action_en: 'Open Volunteer Desk (/volunteer)',
      renderSim: () => (
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 flex flex-col items-center gap-2.5 text-center">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-emerald-950 font-mono">15s Live Auto-Sync Active</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            {language === 'ml'
              ? 'ക്ലൗഡ് ഡാറ്റാബേസ് വഴി 14 ജില്ലകളിലെയും വളണ്ടിയർ ഫോണുകളിൽ ഒരേസമയം ഡാറ്റ പുതുക്കപ്പെടുന്നു.'
              : 'Real-time database sync keeps all 14 district coordinators and desk volunteers on the same page.'}
          </p>
        </div>
      ),
    },
  ];

  const volunteerSteps = [
    {
      id: 'station_search',
      route: '/volunteer',
      badge_ml: 'ഘട്ടം 1: തിരച്ചിൽ',
      badge_en: 'Step 1: Station Search',
      title_ml: 'റെയിൽവേ സ്റ്റേഷനിൽ എത്തുന്ന കുട്ടികളെ തിരയുക',
      title_en: 'Railway Station & Bus Stop Lookup',
      desc_ml: 'കുട്ടികൾ നീലേശ്വരം സ്റ്റേഷനിൽ എത്തുമ്പോൾ പേരോ ജില്ലയോ ടൈപ്പ് ചെയ്ത് പെട്ടെന്ന് കണ്ടെത്താം.',
      desc_en: 'As children arrive by train or bus at Nileshwaram, search by their name, phone, or district in seconds.',
      action_ml: 'വളണ്ടിയർ ഡെസ്കിലേക്ക് പോവുക',
      action_en: 'Go to Volunteer Desk (/volunteer)',
      renderSim: () => (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={simVolSearch}
              onChange={(e) => setSimVolSearch(e.target.value)}
              placeholder={language === 'ml' ? 'വയനാട് അല്ലെങ്കിൽ പേര് ടൈപ്പ് ചെയ്യുക...' : 'Type "Wayanad" or name...'}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">
              {simVolSearch.toLowerCase().includes('way') || simVolSearch.includes('വയ')
                ? (language === 'ml' ? 'അഭിനന്ദ് സി.വി. (വയനാട്)' : 'Abhinand C.V. (Wayanad)')
                : (language === 'ml' ? 'ഫാത്തിമ ഷെറിൻ (മലപ്പുറം)' : 'Fathima Sherin (Malappuram)')}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
              {language === 'ml' ? 'കണ്ടെത്തി' : 'Found'}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'attendance',
      route: '/volunteer',
      badge_ml: 'ഘട്ടം 2: ഹാജർ രേഖപ്പെടുത്തൽ',
      badge_en: 'Step 2: 1-Tap Attendance Check-In',
      title_ml: 'ഒറ്റ ക്ലിക്കിൽ ഹാജർ രേഖപ്പെടുത്തുക',
      title_en: 'Instant Arrival Check-In',
      desc_ml: 'കുട്ടി എത്തിയാലുടൻ "ഹാജർ രേഖപ്പെടുത്തുക" ബട്ടൺ അമർത്തുക. സമ്മേളന നഗരിയിലെ വലിയ സ്ക്രീനിൽ ഹാജർ നില അപ്പോൾത്തന്നെ കൂടും.',
      desc_en: 'Tap the green checkmark button when child arrives. The live conference arrival metric increments on all big screens.',
      action_ml: 'ഹാജർ പാനൽ തുറക്കുക',
      action_en: 'Open Attendance Desk',
      renderSim: () => (
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 w-full justify-between">
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900">{language === 'ml' ? 'ഫാത്തിമ ഷെറിൻ' : 'Fathima Sherin'}</span>
              <span className="text-[11px] text-slate-400 font-mono">malappuram-fathima-204</span>
            </div>
            <button
              type="button"
              onClick={() => setSimVolCheckedIn(!simVolCheckedIn)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                simVolCheckedIn
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {simVolCheckedIn
                  ? (language === 'ml' ? 'ഹാജരായി (Checked In)' : 'Checked In')
                  : (language === 'ml' ? 'ഹാജർ രേഖപ്പെടുത്തുക' : 'Mark Arrival')}
              </span>
            </button>
          </div>
          <span className="text-[11px] text-emerald-800 font-medium">
            {simVolCheckedIn
              ? (language === 'ml' ? '✓ കുട്ടി എത്തിച്ചേർന്നതായി രേഖപ്പെടുത്തി!' : '✓ Attendance marked! State live tally updated.')
              : (language === 'ml' ? 'ബട്ടണിൽ അമർത്തി ഹാജർ രേഖപ്പെടുത്തുന്നത് പരീക്ഷിക്കുക.' : 'Tap button to simulate marking check-in.')}
          </span>
        </div>
      ),
    },
    {
      id: 'whatsapp_pass',
      route: '/volunteer',
      badge_ml: 'ഘട്ടം 3: മാതാപിതാക്കൾക്ക് മെസ്സേജ്',
      badge_en: 'Step 3: 1-Click WhatsApp Parent Pass',
      title_ml: 'മാതാപിതാക്കൾക്ക് വാട്സാപ്പിൽ വിവരങ്ങൾ അയക്കുക',
      title_en: 'Send Live Stay Link to Parents via WhatsApp',
      desc_ml: 'വാട്സാപ്പ് ഐക്കണിൽ ക്ലിക്ക് ചെയ്താൽ കുട്ടിയുടെ താമസസ്ഥലവും റൂട്ട് മാപ്പും അടങ്ങിയ പേഴ്സണൽ ലിങ്ക് രക്ഷിതാവിന് ഒറ്റ ക്ലിക്കിൽ ലഭിക്കും.',
      desc_en: 'Tap the WhatsApp icon to open a pre-formatted message containing the child’s private stay link (/d/:token) for their parents.',
      action_ml: 'വാട്സാപ്പ് ഫീച്ചർ കാണുക',
      action_en: 'Try WhatsApp Dispatch',
      renderSim: () => (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-emerald-700" />
              {language === 'ml' ? 'വാട്സാപ്പ് മെസ്സേജ് പ്രിവ്യൂ:' : 'WhatsApp Dispatch Preview:'}
            </span>
            <button
              type="button"
              onClick={() => setSimWhatsAppPreview(!simWhatsAppPreview)}
              className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold shadow-xs transition-transform active:scale-95"
            >
              {simWhatsAppPreview ? (language === 'ml' ? 'മറയ്ക്കുക' : 'Hide') : (language === 'ml' ? 'ടെസ്റ്റ് ചെയ്യുക' : 'Test WhatsApp')}
            </button>
          </div>
          {simWhatsAppPreview && (
            <div className="p-3 rounded-xl bg-white border border-emerald-200 text-slate-800 text-xs font-sans leading-relaxed shadow-xs animate-in fade-in">
              {language === 'ml' ? (
                <>
                  പ്രിയ രക്ഷിതാവേ, നിങ്ങളുടെ കുട്ടി <b>അഭിനന്ദ് സി.വി.</b> സംസ്ഥാന സമ്മേളന കേന്ദ്രത്തിൽ സുരക്ഷിതമായി എത്തിയിട്ടുണ്ട്.<br />
                  🏠 താമസസ്ഥലം: <b>പൂന്തോട്ടം വീട്</b><br />
                  🔗 കുട്ടിയുടെ വിവരങ്ങൾ കാണാൻ: <span className="text-primary font-mono underline">http://.../d/wayanad-kg4jio</span>
                </>
              ) : (
                <>
                  Dear Parent, your child <b>Abhinand C.V.</b> has reached Balasangham State Conference.<br />
                  🏠 Accommodation: <b>Poonthottam House</b><br />
                  🔗 Live child stay portal: <span className="text-primary font-mono underline">http://.../d/wayanad-kg4jio</span>
                </>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'gps_radar',
      route: '/volunteer',
      badge_ml: 'ഘട്ടം 4: അത്യാഹിത GPS റഡാർ',
      badge_en: 'Step 4: Emergency Live GPS Radar',
      title_ml: 'വഴിതെറ്റിയ കുട്ടിയെ ലൈവ് GPS മാപ്പിലൂടെ കണ്ടെത്തുക',
      title_en: 'Locate Stranded Child with Live GPS',
      desc_ml: 'കുട്ടി ഫോണിൽ "ലൊക്കേഷൻ ഷെയർ ചെയ്യുക" ക്ലിക്ക് ചെയ്താൽ വളണ്ടിയർ ഡെസ്കിൽ പൾസിങ് റഡാർ ലൈറ്റാകും. "Open in Google Maps" വഴി കുട്ടിയുടെ അരികിലേക്ക് എത്താം.',
      desc_en: 'When a lost child taps "Share Location" on their mobile, a pulsing radar beacon lights up on your desk with direct Google Maps route.',
      action_ml: 'ജിപിഎസ് ഫീച്ചർ പരീക്ഷിക്കുക',
      action_en: 'Test GPS Beacon',
      renderSim: () => (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${simGpsPinging ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
              <span className="text-xs font-bold text-amber-950">
                {simGpsPinging
                  ? (language === 'ml' ? 'ലൈവ് GPS റഡാർ ലഭ്യമാണ്!' : 'Live GPS Radar Active!')
                  : (language === 'ml' ? 'GPS സിമുലേഷൻ ഓഫ്' : 'GPS Simulation Standby')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSimGpsPinging(!simGpsPinging)}
              className="px-3 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-bold shadow-xs transition-transform active:scale-95"
            >
              {simGpsPinging ? (language === 'ml' ? 'ഓഫ് ചെയ്യുക' : 'Stop') : (language === 'ml' ? 'GPS ഓൺ ചെയ്യുക' : 'Trigger Ping')}
            </button>
          </div>
          {simGpsPinging && (
            <div className="p-3 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">{language === 'ml' ? 'അഭിനന്ദ് സി.വി. (വയനാട്)' : 'Abhinand C.V. (Wayanad)'}</span>
                <span className="text-[10px] text-emerald-700 font-bold">12.2531° N, 75.1292° E • ±25m</span>
              </div>
              <a
                href="https://maps.google.com/?q=12.2531,75.1292"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs"
              >
                <Navigation className="w-3 h-3" />
                <span>Google Maps</span>
              </a>
            </div>
          )}
        </div>
      ),
    },
  ];

  const steps = activeRole === 'admin' ? adminSteps : volunteerSteps;
  const current = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAction = () => {
    onClose();
    navigate(current.route);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-malayalam-bold flex items-center gap-2">
                <span>{language === 'ml' ? 'പ്ലാറ്റ്‌ഫോം ഗൈഡ്' : 'Interactive Platform Guide'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary font-mono uppercase">
                  {activeRole === 'admin' ? 'Admin' : 'Volunteer'}
                </span>
              </h3>
              <span className="text-[11px] text-slate-300">
                {language === 'ml' ? 'ഫീച്ചറുകളും വർക്ക്‌ഫ്ലോയും എളുപ്പത്തിൽ മനസ്സിലാക്കാം' : 'Learn features and workflows interactively'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={language === 'ml' ? 'ഗൈഡ് ക്ലോസ് ചെയ്യുക' : 'Close Guide'}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Switcher Tabs */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveRole('admin');
              setCurrentStep(0);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeRole === 'admin'
                ? 'bg-white text-primary shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{language === 'ml' ? '👑 അഡ്മിൻ ഗൈഡ് (Admin Quest)' : '👑 Admin Quest'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveRole('volunteer');
              setCurrentStep(0);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeRole === 'volunteer'
                ? 'bg-white text-primary shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{language === 'ml' ? '🤝 വളണ്ടിയർ ഗൈഡ് (Volunteer Quest)' : '🤝 Volunteer Quest'}</span>
          </button>
        </div>

        {/* Step Content */}
        <div className="p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-primary-50 text-primary-800 border border-primary-200 text-xs font-bold">
              {language === 'ml' ? current.badge_ml : current.badge_en}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {currentStep + 1} / {steps.length}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 font-malayalam-bold leading-tight">
              {language === 'ml' ? current.title_ml : current.title_en}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'ml' ? current.desc_ml : current.desc_en}
            </p>
          </div>

          {/* Interactive Mini Simulator */}
          <div className="my-1">
            {current.renderSim()}
          </div>

          {/* Action Link directly to page */}
          <button
            type="button"
            onClick={handleAction}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-300 transition-colors"
          >
            <span>{language === 'ml' ? current.action_ml : current.action_en}</span>
            <ArrowRight className="w-3.5 h-3.5 text-primary" />
          </button>
        </div>

        {/* Footer Navigation Dots & Buttons */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'ml' ? 'മുൻപിലേക്ക്' : 'Back'}</span>
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentStep === idx ? 'w-6 bg-primary' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <span>
              {currentStep === steps.length - 1
                ? (language === 'ml' ? 'പൂർത്തിയായി' : 'Done')
                : (language === 'ml' ? 'അടുത്തത്' : 'Next')}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
