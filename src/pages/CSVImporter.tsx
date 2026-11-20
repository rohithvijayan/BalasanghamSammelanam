import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { mockStore, initialDistricts } from '../lib/mockData';
import { Delegate, House } from '../types';
import { api, isSupabaseConfigured } from '../lib/supabase';
import { useI18n } from '../i18n/i18nContext';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, ArrowRight, CloudUpload, RefreshCw, Trash2, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CSVImporter: React.FC = () => {
  const { language, t } = useI18n();
  const navigate = useNavigate();

  const [importType, setImportType] = useState<'delegates' | 'houses'>('delegates');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [cloudCount, setCloudCount] = useState<number | null>(null);

  // Reactive store subscription
  const [delegates, setDelegates] = useState<Delegate[]>(() => mockStore.getDelegates());

  useEffect(() => {
    const unsub = mockStore.subscribe(() => {
      setDelegates(mockStore.getDelegates());
    });

    if (isSupabaseConfigured) {
      api.getDelegates()
        .then((data) => setCloudCount(data.length))
        .catch((err) => console.warn('Could not fetch cloud delegate count', err));
    }

    return unsub;
  }, []);

  // Deduplicate local delegates by unique token/id
  const uniqueLocalDelegates = useMemo(() => {
    const map = new Map<string, Delegate>();
    for (const d of delegates) {
      const key = (d.token || d.id).toLowerCase().trim();
      map.set(key, d);
    }
    return Array.from(map.values());
  }, [delegates]);

  const hasLocalDelegates = uniqueLocalDelegates.length > 6;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSuccessMsg(null);
    setErrors([]);

    // UTF-8 decoding with BOM support
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const rawData = results.data as any[];
        const validationErrors: string[] = [];

        if (importType === 'delegates') {
          const validated = rawData.map((row, idx) => {
            if (!row.full_name) {
              validationErrors.push(`Row ${idx + 1}: Name is required`);
            }
            // Match district
            const dist = initialDistricts.find(
              (d) =>
                d.name_en.toLowerCase() === (row.district || '').toLowerCase().trim() ||
                d.name_ml === (row.district || '').trim()
            );

            return {
              id: 'del-' + Date.now() + '-' + idx,
              token:
                (row.district ? row.district.toLowerCase().replace(/\s+/g, '-') : 'del') +
                '-' +
                Math.random().toString(36).substring(2, 8),
              full_name: row.full_name || 'Unnamed',
              phone: row.phone || '',
              district_id: dist ? dist.id : 2, // default Kannur if unmatched
              district_en: dist ? dist.name_en : 'Kannur',
              district_ml: dist ? dist.name_ml : 'കണ്ണൂർ',
              gender: (row.gender || 'boy').toLowerCase().includes('g') ? 'girl' : 'boy',
              emergency_name: row.emergency_name || '',
              emergency_phone: row.emergency_phone || '',
              notes: row.notes || '',
              status: 'pending',
            };
          });

          setParsedRows(validated);
        } else {
          // Houses import
          const validated = rawData.map((row, idx) => {
            return {
              id: 'h-' + Date.now() + '-' + idx,
              name: row.name || 'Unnamed House',
              address: row.address || '',
              map_url: row.map_url || '',
              host_name: row.host_name || 'Host',
              host_phone: row.host_phone || '',
              capacity: parseInt(row.capacity, 10) || 4,
              gender_restriction: (row.gender_restriction || 'any').toLowerCase(),
              notes: row.notes || '',
            };
          });
          setParsedRows(validated);
        }

        setErrors(validationErrors);
      },
      error: (err) => {
        setErrors(['CSV parsing failed: ' + err.message]);
      },
    });
  };

  const handleCommit = async () => {
    if (parsedRows.length === 0) return;
    setIsCommitting(true);
    setErrors([]);
    setSuccessMsg(null);

    try {
      if (importType === 'delegates') {
        const res = await api.importDelegates(parsedRows as Delegate[]);
        setSuccessMsg(language === 'ml' ? `വിജയകരമായി ${res.count} പ്രതിനിധികളെ സേവ് ചെയ്തു!` : `Successfully saved ${res.count} delegates!`);
      } else {
        const res = await api.importHouses(parsedRows as House[]);
        setSuccessMsg(language === 'ml' ? `വിജയകരമായി ${res.count} വീടുകൾ സേവ് ചെയ്തു!` : `Successfully saved ${res.count} houses!`);
      }

      setParsedRows([]);
      setTimeout(() => {
        navigate('/admin');
      }, 1500);
    } catch (err: any) {
      console.error('Import failed', err);
      setErrors([language === 'ml' ? ('ഡാറ്റാബേസിലേക്ക് സേവ് ചെയ്യാൻ സാധിച്ചില്ല: ' + (err.message || 'Unknown error')) : ('Could not save to database: ' + (err.message || 'Unknown error'))]);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleSyncLocalToSupabase = async () => {
    setIsSyncing(true);
    setErrors([]);
    setSuccessMsg(null);

    try {
      const res = await api.importDelegates(uniqueLocalDelegates);
      
      // Post-sync: pull fresh data from cloud and replace local cache
      const cloudData = await api.getDelegates();
      mockStore.setDelegates(cloudData);
      setCloudCount(cloudData.length);

      setSuccessMsg(
        language === 'ml'
          ? `വിജയകരമായി ${res.count} പ്രതിനിധികളെ Supabase ക്ലൗഡ് ഡാറ്റാബേസിലേക്ക് സിങ്ക് ചെയ്തു! ലോക്കൽ കാഷെ ക്ലൗഡുമായി പൊരുത്തപ്പെടുത്തി.`
          : `Successfully synced ${res.count} delegates to Supabase cloud database! Local cache updated.`
      );
    } catch (err: any) {
      console.error('Sync failed', err);
      setErrors([language === 'ml' ? ('Supabase സിങ്ക് പരാജയപ്പെട്ടു: ' + (err.message || 'Unknown error')) : ('Supabase sync failed: ' + (err.message || 'Unknown error'))]);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearLocalCache = async () => {
    setIsClearing(true);
    setErrors([]);
    setSuccessMsg(null);

    try {
      mockStore.clearLocalDelegates();
      if (isSupabaseConfigured) {
        try {
          const cloudData = await api.getDelegates();
          if (cloudData && cloudData.length > 0) {
            mockStore.setDelegates(cloudData);
            setCloudCount(cloudData.length);
            setSuccessMsg(
              language === 'ml'
                ? `ലോക്കൽ കാഷെ ക്ലിയർ ചെയ്തു, ക്ലൗഡിൽ നിന്നുള്ള ${cloudData.length} പ്രതിനിധികളെ പുതുക്കി ലോഡ് ചെയ്തു.`
                : `Local cache cleared and refreshed with ${cloudData.length} delegates from cloud.`
            );
            return;
          }
        } catch {
          // fall through
        }
      }
      setSuccessMsg(language === 'ml' ? 'ഈ ഡിവൈസിലെ ലോക്കൽ കാഷെ വിജയകരമായി ക്ലിയർ ചെയ്തു.' : 'Local cache on this device cleared successfully.');
    } catch (err: any) {
      mockStore.clearLocalDelegates();
      setSuccessMsg(language === 'ml' ? 'ലോക്കൽ കാഷെ ക്ലിയർ ചെയ്തു.' : 'Local cache cleared.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col gap-2">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">
          {t('import_csv')}
        </span>
        <h1 className="text-2xl font-malayalam-bold text-slate-900">
          {language === 'ml'
            ? 'പ്രതിനിധികളുടെയും വീടുകളുടെയും വിവരങ്ങൾ ഇമ്പോർട്ട് ചെയ്യുക'
            : 'Import Delegates & Host Houses (CSV)'}
        </h1>
        <p className="text-xs text-slate-500">
          {language === 'ml'
            ? 'മലയാളം യൂണികോഡ് (UTF-8) പിന്തുണയ്ക്കുന്നു. അപ്‌ലോഡ് ചെയ്യുന്നതിന് മുൻപ് ഡാറ്റ പ്രിവ്യൂ കാണാം.'
            : 'Supports Malayalam Unicode & UTF-8. You can preview data before committing.'}
        </p>
      </div>

      {/* Sync Local Browser Data to Supabase Cloud */}
      {hasLocalDelegates && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <CloudUpload className="w-6 h-6 text-amber-700" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-amber-900 font-malayalam-bold">
                  {language === 'ml'
                    ? `ഈ ഡിവൈസിൽ ${uniqueLocalDelegates.length} പ്രതിനിധികൾ നിലവിലുണ്ട്`
                    : `${uniqueLocalDelegates.length} delegates currently stored on this device`}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                  {cloudCount !== null && cloudCount >= uniqueLocalDelegates.length
                    ? (language === 'ml' ? 'ക്ലൗഡിൽ ലഭ്യമാണ്' : 'Synced to Cloud')
                    : (language === 'ml' ? 'ലോക്കൽ ഡാറ്റ' : 'Local Data')}
                </span>
              </div>
              <p className="text-xs text-amber-700 mt-0.5">
                {cloudCount !== null && cloudCount >= uniqueLocalDelegates.length
                  ? (language === 'ml'
                      ? `Supabase ക്ലൗഡിൽ നിലവിൽ ${cloudCount} പ്രതിനിധികളുണ്ട്. എല്ലാ ഡിവൈസുകളിലും ഒരേ ഡാറ്റ കാണാം.`
                      : `Currently ${cloudCount} delegates exist in Supabase cloud. Synced across all devices.`)
                  : (language === 'ml'
                      ? 'മറ്റു ഡിവൈസുകളിലും ഫോണുകളിലും കാണാൻ ഇവരെ Supabase ക്ലൗഡ് ഡാറ്റാബേസിലേക്ക് ഒറ്റ ക്ലിക്കിൽ സിങ്ക് ചെയ്യാം.'
                      : 'Sync these delegates to Supabase cloud to make them accessible on all phones and devices.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleSyncLocalToSupabase}
              disabled={isSyncing || isClearing}
              className="touch-target px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 disabled:opacity-50 shrink-0"
            >
              <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>
                {isSyncing
                  ? (language === 'ml' ? 'ക്ലൗഡിലേക്ക് സിങ്ക് ചെയ്യുന്നു...' : 'Syncing to Cloud...')
                  : (language === 'ml' ? 'Supabase-ലേക്ക് സിങ്ക് ചെയ്യുക' : 'Sync to Supabase')}
              </span>
            </button>
            <button
              onClick={handleClearLocalCache}
              disabled={isClearing || isSyncing}
              title={language === 'ml' ? 'ലോക്കൽ കാഷെ ക്ലിയർ ചെയ്ത് ക്ലൗഡിൽ നിന്നുള്ള വിവരങ്ങൾ പുതുക്കുക' : 'Clear local device cache and refresh from cloud'}
              className="touch-target px-4 py-2.5 rounded-xl bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-95 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isClearing ? 'animate-spin' : ''}`} />
              <span>{language === 'ml' ? 'റീസെറ്റ് / കാഷെ ക്ലിയർ' : 'Reset / Clear Cache'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Import Switcher & Template Downloads */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => {
              setImportType('delegates');
              setParsedRows([]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              importType === 'delegates' ? 'bg-white text-primary shadow-xs' : 'text-slate-600'
            }`}
          >
            {language === 'ml' ? 'പ്രതിനിധികൾ (Delegates CSV)' : 'Delegates (CSV)'}
          </button>
          <button
            onClick={() => {
              setImportType('houses');
              setParsedRows([]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              importType === 'houses' ? 'bg-white text-primary shadow-xs' : 'text-slate-600'
            }`}
          >
            {language === 'ml' ? 'വീടുകൾ (Houses CSV)' : 'Host Houses (CSV)'}
          </button>
        </div>

        {/* Download Template Link */}
        <a
          href={
            importType === 'delegates'
              ? '/templates/delegates_template.csv'
              : '/templates/houses_template.csv'
          }
          download
          className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{language === 'ml' ? 'മാതൃകാ CSV ഡൗൺലോഡ് (Download Template)' : 'Download Sample CSV Template'}</span>
        </a>
      </div>

      {/* File Upload Zone */}
      <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-slate-300 hover:border-primary transition-colors flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary flex items-center justify-center">
          <FileSpreadsheet className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-slate-900 font-malayalam-bold">
            {t('drag_drop_csv')}
          </span>
          <span className="text-xs text-slate-400">
            {language === 'ml' ? '.csv ഫയലുകൾ മാത്രം (UTF-8 Encoded)' : '.csv files only (UTF-8 Encoded)'}
          </span>
        </div>
        <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-600 transition-all">
          <span>{language === 'ml' ? 'ഫയൽ തിരഞ്ഞെടുക്കുക (Browse File)' : 'Browse CSV File'}</span>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errors.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-800 border border-red-200 text-xs flex flex-col gap-2">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{language === 'ml' ? 'തെറ്റുകൾ കണ്ടെത്തി:' : 'Errors Found:'}</span>
          </div>
          {errors.map((err, i) => (
            <span key={i} className="pl-5">• {err}</span>
          ))}
          {errors.some((e) => e.toLowerCase().includes('permission denied')) && (
            <div className="mt-2 p-3 bg-white/80 rounded-xl border border-red-300 text-red-950 flex flex-col gap-1.5">
              <span className="font-bold flex items-center gap-1.5">
                <Database className="w-4 h-4 text-red-700" />
                {language === 'ml' ? 'Supabase പെർമിഷൻ പരിഹാരം:' : 'Supabase Permission Resolution:'}
              </span>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                {language === 'ml'
                  ? <>Supabase Dashboard-ൽ <b>SQL Editor</b> തുറന്ന് പ്രോജക്റ്റിലെ <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-red-800">supabase/fix_permissions.sql</code> ഫയലിലെ കോഡ് പേസ്റ്റ് ചെയ്ത് <b>Run</b> ചെയ്യുക. ഇത് ഡാറ്റാബേസിലേക്ക് പ്രതിനിധികളെ അപ്‌ലോഡ് ചെയ്യാനുള്ള പൂർണ്ണ അനുമതി നൽകും.</>
                  : <>Open <b>SQL Editor</b> in your Supabase Dashboard, paste the code from <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-red-800">supabase/fix_permissions.sql</code> and click <b>Run</b>. This grants full table access to upload delegates.</>}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Parsed Rows Preview */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                {language === 'ml'
                  ? `${t('preview_data')}: ${parsedRows.length} വരികൾ കണ്ടെത്തി`
                  : `${t('preview_data')}: ${parsedRows.length} rows detected`}
              </span>
            </div>
            <button
              onClick={handleCommit}
              disabled={isCommitting}
              className="touch-target px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary-600 transition-transform active:scale-95 disabled:opacity-50"
            >
              <span>{isCommitting ? (language === 'ml' ? 'Supabase-ലേക്ക് സേവ് ചെയ്യുന്നു...' : 'Saving to Supabase...') : `${t('save_data')} (${parsedRows.length})`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">{language === 'ml' ? 'പേര് (Name)' : 'Full Name'}</th>
                  <th className="p-2.5">{importType === 'delegates' ? (language === 'ml' ? 'ജില്ല' : 'District') : (language === 'ml' ? 'വിലാസം' : 'Address')}</th>
                  <th className="p-2.5">{importType === 'delegates' ? (language === 'ml' ? 'ഫോൺ' : 'Phone') : (language === 'ml' ? 'ആതിഥേയൻ' : 'Host')}</th>
                  <th className="p-2.5">{importType === 'delegates' ? (language === 'ml' ? 'ടോക്കൺ ലിങ്ക്' : 'Token Link') : (language === 'ml' ? 'കപ്പാസിറ്റി' : 'Capacity')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {parsedRows.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 font-bold font-malayalam-bold">
                      {row.full_name || row.name}
                    </td>
                    <td className="p-2.5">
                      {language === 'ml' ? (row.district_ml || row.address || '—') : (row.district_en || row.address || '—')}
                    </td>
                    <td className="p-2.5">
                      {row.phone || row.host_name || '—'}
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-primary">
                      {row.token ? `/d/${row.token}` : `${row.capacity} ${language === 'ml' ? 'പേർ' : 'persons'}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedRows.length > 10 && (
            <span className="text-[11px] text-slate-400 italic">
              ...{language === 'ml' ? `മറ്റു ${parsedRows.length - 10} വരികൾ കൂടിയുണ്ട്` : `${parsedRows.length - 10} more rows below`}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
