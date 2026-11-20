import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  Check,
  RotateCcw
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

  // Step 2 Simulator States (Exact Admin Workbench Allocation workflow)
  const [simStep2Selected, setSimStep2Selected] = useState<string[]>([]);
  const [simStep2Allotted, setSimStep2Allotted] = useState(false);
  const [simStep2Volunteer, setSimStep2Volunteer] = useState<string>('');

  // Step 3 Simulator States (Exact EditDelegateModal workflow)
  const [simStep3ModalOpen, setSimStep3ModalOpen] = useState(false);
  const [simStep3Name, setSimStep3Name] = useState('അർജുൻ കെ.');
  const [simStep3Phone, setSimStep3Phone] = useState('+91 98470 11223');
  const [simStep3Gender, setSimStep3Gender] = useState<'boy' | 'girl'>('boy');
  const [simStep3Volunteer, setSimStep3Volunteer] = useState('പ്രണവ് എം.');
  const [simStep3SavedToast, setSimStep3SavedToast] = useState(false);

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
      desc_ml: 'പ്രതിനിധികളുടെ ചെക്ക്ബോക്സ് സെലക്ട് ചെയ്യുമ്പോൾ വീടുകളിലെ "Assign Here" ബട്ടൺ ആക്ടീവാകും. വളണ്ടിയർമാരെയും ഒന്നിച്ച് ചുമതലപ്പെടുത്താം.',
      desc_en: 'Select delegate checkboxes to activate "Assign Here" on houses. Bulk-assign squad volunteers with one tap.',
      action_ml: 'വർക്ക് ബെഞ്ചിലേക്ക് പോവുക',
      action_en: 'Go to Admin Workbench (/admin)',
      renderSim: () => {
        const toggleSelect = (id: string) => {
          setSimStep2Selected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
          );
        };

        const handleAssignHere = () => {
          if (simStep2Selected.length === 0) return;
          setSimStep2Allotted(true);
          setSimStep2Selected([]);
        };

        const handleResetStep2 = () => {
          setSimStep2Allotted(false);
          setSimStep2Selected([]);
          setSimStep2Volunteer('');
        };

        return (
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
            {/* Real Deal Header Bar */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                {language === 'ml' ? 'വർക്ക് ബെഞ്ച് അലോട്ട്മെന്റ് സിമുലേറ്റർ' : 'Workbench Allocation Simulator'}
              </span>
              {simStep2Allotted && (
                <button
                  type="button"
                  onClick={handleResetStep2}
                  className="text-[11px] text-primary hover:text-primary-700 font-bold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{language === 'ml' ? 'റീസെറ്റ് ചെയ്യുക' : 'Reset Simulator'}</span>
                </button>
              )}
            </div>

            {/* Top / Left: Unassigned Delegates List */}
            <div className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  {language === 'ml' ? 'അലോട്ട് ചെയ്യേണ്ട പ്രതിനിധികൾ (Unassigned)' : 'Unassigned Delegates'}
                </span>
                {simStep2Selected.length > 0 && !simStep2Allotted && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold animate-pulse">
                    {simStep2Selected.length} {language === 'ml' ? 'തിരഞ്ഞെടുത്തു' : 'selected'}
                  </span>
                )}
              </div>

              {/* Bulk Volunteer Dropdown (Appears exactly when delegates are selected, like real Workbench) */}
              {simStep2Selected.length > 0 && !simStep2Allotted && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 border border-indigo-200 animate-in fade-in">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                  <select
                    value={simStep2Volunteer}
                    onChange={(e) => setSimStep2Volunteer(e.target.value)}
                    className="w-full text-[11px] font-bold text-indigo-900 bg-white border border-indigo-200 rounded-md px-2 py-1 focus:outline-none cursor-pointer"
                  >
                    <option value="">{language === 'ml' ? '+ വളണ്ടിയറെ നൽകുക (Assign Volunteer)' : '+ Assign Volunteer'}</option>
                    <option value="അർജുൻ കെ.">അർജുൻ കെ. (സൗത്ത് സോൺ)</option>
                    <option value="പ്രണവ് എം.">പ്രണവ് എം. (സ്റ്റേഷൻ സ്ക്വാഡ്)</option>
                    <option value="സ്നേഹ പി.">സ്നേഹ പി. (ക്യാമ്പ്)</option>
                  </select>
                </div>
              )}

              {/* Unassigned Delegate Row */}
              {!simStep2Allotted ? (
                <div
                  onClick={() => toggleSelect('del-1')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    simStep2Selected.includes('del-1')
                      ? 'bg-primary-50 border-primary-300 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={simStep2Selected.includes('del-1')}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-primary focus:ring-primary shrink-0 cursor-pointer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 font-malayalam-bold truncate">
                        {language === 'ml' ? 'അഭിനന്ദ് സി.വി.' : 'Abhinand C.V.'}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate flex items-center gap-1.5 flex-wrap">
                        <span>{language === 'ml' ? 'വയനാട് • +91 94471 20000' : 'Wayanad • +91 94471 20000'}</span>
                        {simStep2Volunteer && (
                          <span className="text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 rounded font-bold">
                            👤 {simStep2Volunteer}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-sky-100 text-sky-700 shrink-0">
                    {language === 'ml' ? 'ആൺകുട്ടി' : 'Boy'}
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between animate-in fade-in">
                  <span>{language === 'ml' ? '✓ എല്ലാ പ്രതിനിധികൾക്കും താമസസ്ഥലം അനുവദിച്ചു!' : '✓ All delegates accommodated!'}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              )}
            </div>

            {/* Bottom / Right: House Card with real-deal "Assign Here" Button & Capacity */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs font-bold text-slate-900 font-malayalam-bold truncate">
                      {language === 'ml' ? 'പൂന്തോട്ടം വീട്' : 'Poonthottam House'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-sky-100 text-sky-700 shrink-0">
                      {language === 'ml' ? 'ആൺകുട്ടികൾക്ക് മാത്രം' : 'Boys Only'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate mt-0.5">
                    {language === 'ml' ? 'നീലേശ്വരം • ആതിഥേയൻ: കെ. രാഘവൻ' : 'Nileshwaram • Host: K. Raghavan'}
                  </span>
                </div>

                {/* Real Deal "Assign Here" Button */}
                <button
                  type="button"
                  onClick={handleAssignHere}
                  disabled={simStep2Selected.length === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[11px] font-bold shrink-0 shadow-2xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>{language === 'ml' ? 'ഇവിടെ അലോട്ട് ചെയ്യുക' : 'Assign Here'}</span>
                </button>
              </div>

              {/* Capacity Bar */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-600">
                    {language === 'ml'
                      ? `കപ്പാസിറ്റി: ${simStep2Allotted ? '3' : '2'} / 4 പേർ`
                      : `Capacity: ${simStep2Allotted ? '3' : '2'} / 4 persons`}
                  </span>
                  <span className={simStep2Allotted ? 'text-amber-600' : 'text-emerald-600'}>
                    {simStep2Allotted
                      ? (language === 'ml' ? '1 ഒഴിവ് ബാക്കി' : '1 slot free')
                      : (language === 'ml' ? '2 ഒഴിവുകൾ ബാക്കി' : '2 slots free')}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      simStep2Allotted ? 'bg-primary w-3/4' : 'bg-primary w-1/2'
                    }`}
                  />
                </div>
              </div>

              {/* Current Residents (ഇവിടെ താമസിക്കുന്നവർ) */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {language === 'ml'
                    ? `ഇവിടെ താമസിക്കുന്നവർ (${simStep2Allotted ? '3' : '2'}):`
                    : `Current Residents (${simStep2Allotted ? '3' : '2'}):`}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                    {language === 'ml' ? 'അർജുൻ കെ. (കണ്ണൂർ)' : 'Arjun K. (Kannur)'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                    {language === 'ml' ? 'മുഹമ്മദ് റിയാസ്' : 'Muhammed Riyas'}
                  </span>
                  {simStep2Allotted && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 border border-emerald-300 animate-in zoom-in-95">
                      <span>✓ {language === 'ml' ? 'അഭിനന്ദ് സി.വി.' : 'Abhinand C.V.'}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Step Instruction */}
            <span className="text-[11px] text-center font-medium text-slate-600">
              {simStep2Allotted
                ? (language === 'ml'
                    ? '🎉 അലോട്ട്മെന്റ് പൂർത്തിയായി! കപ്പാസിറ്റി ബാർ തത്സമയം അപ്ഡേറ്റായി.'
                    : '🎉 Allocation complete! Capacity bar and resident tally live updated.')
                : simStep2Selected.length > 0
                ? (language === 'ml'
                    ? '👉 ഇനി "ഇവിടെ അലോട്ട് ചെയ്യുക" ബട്ടണിൽ ക്ലിക്ക് ചെയ്യുക (അല്ലെങ്കിൽ വളണ്ടിയറെ നൽകുക).'
                    : '👉 Now click "Assign Here" button on the house card (or pick a squad volunteer).')
                : (language === 'ml'
                    ? '1. പ്രതിനിധിയുടെ ചെക്ക്ബോക്സിൽ ക്ലിക്ക് ചെയ്യുക.'
                    : '1. Click the delegate checkbox above to select.')}
            </span>
          </div>
        );
      },
    },
    {
      id: 'inline_edits',
      route: '/admin',
      badge_ml: 'ഘട്ടം 3: തത്സമയ മാറ്റങ്ങൾ',
      badge_en: 'Step 3: Edit on the Fly',
      title_ml: 'പെൻസിൽ ഐക്കൺ ഉപയോഗിച്ച് വിവരങ്ങൾ നേരിട്ട് തിരുത്തുക',
      title_en: 'Instant In-Line Edits (Pencil Icon)',
      desc_ml: 'പ്രതിനിധിയുടെ കാർഡിലെ പെൻസിൽ ഐക്കണിൽ ക്ലിക്ക് ചെയ്താൽ എഡിറ്റ് മോഡൽ തുറക്കും. ഫോൺ നമ്പറോ വളണ്ടിയറെയോ മാറ്റി സേവ് ചെയ്യാം.',
      desc_en: 'Click the pencil icon on any delegate card to open the exact Edit Modal. Update phone numbers or squad volunteer instantly.',
      action_ml: 'വർക്ക് ബെഞ്ചിൽ പരീക്ഷിക്കുക',
      action_en: 'Explore Admin Workbench',
      renderSim: () => {
        const handleSaveEdit = (e: React.FormEvent) => {
          e.preventDefault();
          setSimStep3ModalOpen(false);
          setSimStep3SavedToast(true);
          setTimeout(() => setSimStep3SavedToast(false), 4000);
        };

        return (
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3 relative">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-primary" />
                {language === 'ml' ? 'തത്സമയ എഡിറ്റ് സിമുലേറ്റർ (Edit Modal)' : 'In-Line Edit Simulator'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">kannur-412</span>
            </div>

            {/* Delegate Card as seen in real Workbench */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-4 h-4 rounded border border-slate-300 bg-slate-100 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-slate-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-900 font-malayalam-bold truncate">
                    {simStep3Name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate flex items-center gap-1.5 flex-wrap">
                    <span>{language === 'ml' ? 'കണ്ണൂർ' : 'Kannur'} • {simStep3Phone}</span>
                    <span className="text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-bold">
                      👤 {simStep3Volunteer}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSimStep3ModalOpen(true)}
                  aria-label={language === 'ml' ? 'വിവരങ്ങൾ തിരുത്തുക' : 'Edit Delegate'}
                  title={language === 'ml' ? 'വിവരങ്ങൾ തിരുത്തുക' : 'Edit Delegate'}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-primary" />
                  <span className="hidden sm:inline">{language === 'ml' ? 'തിരുത്തുക' : 'Edit'}</span>
                </button>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                    simStep3Gender === 'girl' ? 'bg-pink-100 text-pink-700' : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {simStep3Gender === 'girl' ? (language === 'ml' ? 'പെൺകുട്ടി' : 'Girl') : (language === 'ml' ? 'ആൺകുട്ടി' : 'Boy')}
                </span>
              </div>
            </div>

            {/* Saved Toast Notice */}
            {simStep3SavedToast && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {language === 'ml'
                    ? '✓ വിവരങ്ങൾ വിജയകരമായി സേവ് ചെയ്തു! ക്ലൗഡിൽ തത്സമയം അപ്ഡേറ്റായി.'
                    : '✓ Changes saved! Synced in real-time across all devices.'}
                </span>
              </div>
            )}

            {/* Exact Mini Edit Delegate Modal Overlay */}
            {simStep3ModalOpen && (
              <div className="p-4 rounded-2xl bg-white border-2 border-primary shadow-xl flex flex-col gap-3 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Edit2 className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-malayalam-bold">
                      {language === 'ml' ? 'വിവരങ്ങൾ തിരുത്തുക (Edit Modal)' : 'Edit Delegate Details'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSimStep3ModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="flex flex-col gap-2.5 text-left">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700">
                      {language === 'ml' ? 'പൂർണ്ണ പേര് *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      value={simStep3Name}
                      onChange={(e) => setSimStep3Name(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700">
                      {language === 'ml' ? 'മൊബൈൽ നമ്പർ' : 'Mobile Number'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={simStep3Phone}
                        onChange={(e) => setSimStep3Phone(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setSimStep3Phone('+91 94471 23456')}
                        className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 whitespace-nowrap transition-colors"
                      >
                        {language === 'ml' ? 'ടെസ്റ്റ് നമ്പർ' : 'Fill Test'}
                      </button>
                    </div>
                  </div>

                  {/* Gender Toggle & Volunteer In-Charge */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-700">
                        {language === 'ml' ? 'ലിംഗം' : 'Gender'}
                      </label>
                      <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setSimStep3Gender('boy')}
                          className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                            simStep3Gender === 'boy' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          {language === 'ml' ? 'ആൺ' : 'Boy'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimStep3Gender('girl')}
                          className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                            simStep3Gender === 'girl' ? 'bg-pink-500 text-white shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          {language === 'ml' ? 'പെൺ' : 'Girl'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-700">
                        {language === 'ml' ? 'ചുമതലയുള്ള വളണ്ടിയർ' : 'Volunteer'}
                      </label>
                      <select
                        value={simStep3Volunteer}
                        onChange={(e) => setSimStep3Volunteer(e.target.value)}
                        className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="പ്രണവ് എം.">പ്രണവ് എം.</option>
                        <option value="അർജുൻ കെ.">അർജുൻ കെ.</option>
                        <option value="സ്നേഹ പി.">സ്നേഹ പി.</option>
                      </select>
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSimStep3ModalOpen(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      {language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-600 text-white text-xs font-bold shadow-xs transition-transform active:scale-95"
                    >
                      {language === 'ml' ? 'സേവ് ചെയ്യുക' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!simStep3ModalOpen && (
              <span className="text-[11px] text-center font-medium text-slate-500">
                {language === 'ml'
                  ? 'പെൻസിൽ (Edit) ഐക്കണിൽ അമർത്തി എഡിറ്റ് മോഡൽ പരീക്ഷിക്കുക.'
                  : 'Click the pencil icon above to test the interactive Edit Modal.'}
              </span>
            )}
          </div>
        );
      },
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

  const modalContent = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
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
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-2 shrink-0">
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
        <div className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto">
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
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
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

  return createPortal(modalContent, document.body);
};
