import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { mockStore, initialDistricts, getHouseNaturalKey, getVolunteerNaturalKey } from '../lib/mockData';
import { Delegate, House, Volunteer } from '../types';
import { api, isSupabaseConfigured, isSafeUrl } from '../lib/supabase';
import { useI18n } from '../i18n/i18nContext';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  CloudUpload,
  RefreshCw,
  Trash2,
  Database,
  Users,
  Home,
  UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CSVImporter: React.FC = () => {
  const { language, t } = useI18n();
  const navigate = useNavigate();

  const [importType, setImportType] = useState<'delegates' | 'houses' | 'volunteers'>('delegates');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [cloudCounts, setCloudCounts] = useState<{
    delegates: number | null;
    houses: number | null;
    volunteers: number | null;
  }>({ delegates: null, houses: null, volunteers: null });

  // Reactive store subscription
  const [delegates, setDelegates] = useState<Delegate[]>(() => mockStore.getDelegates());
  const [houses, setHouses] = useState<House[]>(() => mockStore.getHouses());
  const [volunteers, setVolunteers] = useState<Volunteer[]>(() => mockStore.getVolunteers());

  const loadCloudCounts = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const [d, h, v] = await Promise.all([
        api.getDelegates().catch(() => []),
        api.getHouses().catch(() => []),
        api.getVolunteers().catch(() => []),
      ]);
      setCloudCounts({
        delegates: d.length,
        houses: h.length,
        volunteers: v.length,
      });
    } catch (err) {
      console.warn('Could not fetch cloud counts', err);
    }
  };

  useEffect(() => {
    const unsub = mockStore.subscribe(() => {
      setDelegates(mockStore.getDelegates());
      setHouses(mockStore.getHouses());
      setVolunteers(mockStore.getVolunteers());
    });

    loadCloudCounts();

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

  // Deduplicate local houses by natural key
  const uniqueLocalHouses = useMemo(() => {
    const map = new Map<string, House>();
    for (const h of houses) {
      const key = getHouseNaturalKey(h);
      map.set(key, h);
    }
    return Array.from(map.values());
  }, [houses]);

  // Deduplicate local volunteers by natural key
  const uniqueLocalVolunteers = useMemo(() => {
    const map = new Map<string, Volunteer>();
    for (const v of volunteers) {
      const key = getVolunteerNaturalKey(v);
      map.set(key, v);
    }
    return Array.from(map.values());
  }, [volunteers]);

  const currentConfig = useMemo(() => {
    if (importType === 'delegates') {
      const isSynced = cloudCounts.delegates !== null && cloudCounts.delegates >= uniqueLocalDelegates.length;
      return {
        title: language === 'ml' ? 'പ്രതിനിധികൾ' : 'Delegates',
        unit_ml: 'പ്രതിനിധികൾ',
        unit_en: 'delegates',
        localCount: uniqueLocalDelegates.length,
        cloudCount: cloudCounts.delegates,
        isSynced,
        icon: Users,
        colorBg: 'bg-amber-100',
        colorText: 'text-amber-800',
      };
    }
    if (importType === 'houses') {
      const isSynced = cloudCounts.houses !== null && cloudCounts.houses >= uniqueLocalHouses.length;
      return {
        title: language === 'ml' ? 'താമസ വീടുകൾ' : 'Host Houses',
        unit_ml: 'വീടുകൾ',
        unit_en: 'houses',
        localCount: uniqueLocalHouses.length,
        cloudCount: cloudCounts.houses,
        isSynced,
        icon: Home,
        colorBg: 'bg-sky-100',
        colorText: 'text-sky-800',
      };
    }
    const isSynced = cloudCounts.volunteers !== null && cloudCounts.volunteers >= uniqueLocalVolunteers.length;
    return {
      title: language === 'ml' ? 'വളണ്ടിയർമാർ' : 'Volunteers',
      unit_ml: 'വളണ്ടിയർമാർ',
      unit_en: 'volunteers',
      localCount: uniqueLocalVolunteers.length,
      cloudCount: cloudCounts.volunteers,
      isSynced,
      icon: UserCheck,
      colorBg: 'bg-emerald-100',
      colorText: 'text-emerald-800',
    };
  }, [importType, cloudCounts, uniqueLocalDelegates.length, uniqueLocalHouses.length, uniqueLocalVolunteers.length, language]);

  // SECURITY FIX: Neutralize formula injection in CSV cells (=, +, -, @, \t, \r)
  const sanitizeCell = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val).trim();
    if (/^[=+@\-\t\r]/.test(str)) {
      return `'${str}`;
    }
    return str;
  };

  // SECURITY FIX: Generate cryptographically secure tokens with high entropy
  const generateCryptographicToken = (districtPrefix: string): string => {
    const prefix = districtPrefix ? districtPrefix.toLowerCase().replace(/\s+/g, '-') : 'del';
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const bytes = new Uint8Array(8);
        window.crypto.getRandomValues(bytes);
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
        return `${prefix}-${hex}`;
      }
    } catch {
      // Fallback
    }
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  };

  const processRows = (rawData: any[]) => {
    const validationErrors: string[] = [];

    if (importType === 'delegates') {
      const validated = rawData.map((row, idx) => {
        // Normalize keys to tolerate whitespace, casing, or language variants
        const normalized: Record<string, any> = {};
        for (const k of Object.keys(row)) {
          normalized[k.trim().toLowerCase()] = sanitizeCell(row[k]);
        }

        const fullName = normalized['full_name'] || normalized['name'] || normalized['പേര്'] || '';
        const phone = String(normalized['phone'] || normalized['mobile'] || normalized['ഫോൺ'] || '').trim();
        const district = String(normalized['district'] || normalized['ജില്ല'] || '').trim();
        const gender = String(normalized['gender'] || normalized['ലിംഗം'] || 'boy').toLowerCase();
        const emergencyName = normalized['emergency_name'] || normalized['guardian'] || normalized['രക്ഷാകർത്താവ്'] || '';
        const emergencyPhone = String(normalized['emergency_phone'] || normalized['guardian_phone'] || '').trim();
        const notes = normalized['notes'] || '';

        if (!fullName) {
          validationErrors.push(`Row ${idx + 1}: Name is required`);
        }

        // Match district
        const dist = initialDistricts.find(
          (d) =>
            d.name_en.toLowerCase() === district.toLowerCase() ||
            d.name_ml === district
        );

        return {
          id: 'del-' + Date.now() + '-' + idx,
          token: generateCryptographicToken(district),
          full_name: fullName || 'Unnamed',
          phone: phone,
          district_id: dist ? dist.id : 2, // default Kannur if unmatched
          district_en: dist ? dist.name_en : 'Kannur',
          district_ml: dist ? dist.name_ml : 'കണ്ണൂർ',
          gender: (gender.includes('g') || gender.includes('പെൺ') ? 'girl' : 'boy') as 'boy' | 'girl' | 'other',
          emergency_name: emergencyName,
          emergency_phone: emergencyPhone,
          notes: notes,
          status: 'pending' as const,
        };
      });

      // Deduplicate delegates preview by token / natural key
      const uniqueDelMap = new Map<string, Delegate>();
      for (const d of validated) {
        const key = (d.token || `${d.full_name}-${d.phone}`).toLowerCase().trim();
        if (!uniqueDelMap.has(key)) {
          uniqueDelMap.set(key, d);
        }
      }
      setParsedRows(Array.from(uniqueDelMap.values()));
    } else if (importType === 'houses') {
      // Houses import
      const validated = rawData.map((row, idx) => {
        const normalized: Record<string, any> = {};
        for (const k of Object.keys(row)) {
          normalized[k.trim().toLowerCase()] = sanitizeCell(row[k]);
        }

        const name = normalized['name'] || normalized['house_name'] || normalized['വീട്ടുപേര്'] || 'Unnamed House';
        const address = normalized['address'] || normalized['മേൽവിലാസം'] || '';
        const rawMapUrl = normalized['map_url'] || normalized['maps'] || '';
        const mapUrl = isSafeUrl(rawMapUrl) ? rawMapUrl : '';
        const hostName = normalized['host_name'] || normalized['host'] || normalized['ആതിഥേയൻ'] || 'Host';
        const hostPhone = String(normalized['host_phone'] || normalized['phone'] || normalized['ഫോൺ'] || '').trim();
        const capacity = parseInt(normalized['capacity'] || normalized['കപ്പാസിറ്റി'], 10) || 4;
        const genderRestriction = (normalized['gender_restriction'] || normalized['gender'] || 'any').toLowerCase();
        const notes = normalized['notes'] || '';

        return {
          id: 'h-' + Date.now() + '-' + idx,
          name: name,
          address: address,
          map_url: mapUrl,
          host_name: hostName,
          host_phone: hostPhone,
          capacity: capacity,
          gender_restriction: genderRestriction,
          notes: notes,
        };
      });

      // Deduplicate houses preview by natural key
      const uniqueHouseMap = new Map<string, House>();
      for (const h of validated) {
        const key = getHouseNaturalKey(h);
        if (!uniqueHouseMap.has(key)) {
          uniqueHouseMap.set(key, h);
        }
      }
      setParsedRows(Array.from(uniqueHouseMap.values()));
    } else {
      // Volunteers import
      const validated = rawData.map((row, idx) => {
        const normalized: Record<string, any> = {};
        for (const k of Object.keys(row)) {
          normalized[k.trim().toLowerCase()] = sanitizeCell(row[k]);
        }

        const name = normalized['name'] || normalized['volunteer_name'] || normalized['full_name'] || normalized['പേര്'] || normalized['വളണ്ടിയർ'] || '';
        const phone = String(normalized['phone'] || normalized['mobile'] || normalized['contact'] || normalized['ഫോൺ'] || normalized['മൊബൈൽ'] || '').trim();
        const unit = normalized['unit'] || normalized['area'] || normalized['മേഖല'] || normalized['യൂണിറ്റ്'] || normalized['സെന്റർ'] || '';

        if (!name) {
          validationErrors.push(`Row ${idx + 1}: Name is required`);
        }

        return {
          id: 'vol-' + Date.now() + '-' + idx,
          name: name || 'Unnamed Volunteer',
          phone: phone,
          unit: unit,
        };
      });

      // Deduplicate volunteers preview by natural key
      const uniqueVolMap = new Map<string, Volunteer>();
      for (const v of validated) {
        const key = getVolunteerNaturalKey(v);
        if (!uniqueVolMap.has(key)) {
          uniqueVolMap.set(key, v);
        }
      }
      setParsedRows(Array.from(uniqueVolMap.values()));
    }

    setErrors(validationErrors);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSuccessMsg(null);
    setErrors([]);

    // SECURITY FIX: Limit upload file size to 5MB to prevent client DoS
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setErrors([language === 'ml' ? 'ഫയൽ സൈസ് 5MB-യിൽ താഴെയായിരിക്കണം.' : 'File size exceeds maximum 5MB limit.']);
      return;
    }

    const fileName = file.name.toLowerCase();

    // Check for Excel (.xlsx, .xls) - loaded dynamically on demand to keep initial bundle lean
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      try {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setErrors([language === 'ml' ? 'Excel ഫയലിൽ ഷീറ്റുകൾ ഒന്നും കണ്ടെത്തിയില്ല.' : 'No sheets found in Excel file.']);
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const rawData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });
        if (rawData.length === 0) {
          setErrors([language === 'ml' ? 'Excel ഫയലിൽ ഡാറ്റയൊന്നും കണ്ടെത്തിയില്ല.' : 'No data rows found in Excel sheet.']);
          return;
        }
        processRows(rawData);
      } catch (err: any) {
        setErrors([language === 'ml' ? `Excel ഫയൽ വായിക്കാൻ സാധിച്ചില്ല: ${err.message}` : `Failed to parse Excel file: ${err.message}`]);
      }
    } else {
      // UTF-8 decoding with BOM support for CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          processRows(results.data as any[]);
        },
        error: (err) => {
          setErrors(['CSV parsing failed: ' + err.message]);
        },
      });
    }
  };

  const handleCommit = async () => {
    if (parsedRows.length === 0) return;
    setIsCommitting(true);
    setErrors([]);
    setSuccessMsg(null);

    try {
      if (importType === 'delegates') {
        const res = await api.importDelegates(parsedRows as Delegate[]);
        setSuccessMsg(language === 'ml' ? `വിജയകരമായി ${res.count} പ്രതിനിധികളെ Supabase ക്ലൗഡിലേക്ക് സേവ് ചെയ്തു!` : `Successfully saved ${res.count} delegates to Supabase!`);
      } else if (importType === 'houses') {
        const res = await api.importHouses(parsedRows as House[]);
        setSuccessMsg(language === 'ml' ? `വിജയകരമായി ${res.count} വീടുകൾ Supabase ക്ലൗഡിലേക്ക് സേവ് ചെയ്തു!` : `Successfully saved ${res.count} houses to Supabase!`);
      } else {
        const res = await api.importVolunteers(parsedRows as Volunteer[]);
        setSuccessMsg(language === 'ml' ? `വിജയകരമായി ${res.count} വളണ്ടിയർമാരെ Supabase ക്ലൗഡിലേക്ക് സേവ് ചെയ്തു!` : `Successfully saved ${res.count} volunteers to Supabase!`);
      }

      await loadCloudCounts();
      setParsedRows([]);
      setTimeout(() => {
        navigate(importType === 'volunteers' ? '/volunteer' : '/admin');
      }, 1500);
    } catch (err: any) {
      console.error('Import failed', err);
      setErrors([language === 'ml' ? ('ഡാറ്റാബേസിലേക്ക് സേവ് ചെയ്യാൻ സാധിച്ചില്ല: ' + (err.message || 'Unknown error')) : ('Could not save to database: ' + (err.message || 'Unknown error'))]);
    } finally {
      setIsCommitting(false);
    }
  };

  // Unified Cloud Sync for all 3 categories (Delegates, Houses, Volunteers)
  const handleSyncToCloud = async (type: 'delegates' | 'houses' | 'volunteers') => {
    setIsSyncing(true);
    setErrors([]);
    setSuccessMsg(null);

    try {
      let count = 0;
      if (type === 'delegates') {
        const res = await api.importDelegates(uniqueLocalDelegates);
        count = res.count;
        const cloudData = await api.getDelegates(true);
        mockStore.setDelegates(cloudData, false);
        setDelegates(cloudData);
      } else if (type === 'houses') {
        const res = await api.importHouses(uniqueLocalHouses);
        count = res.count;
        const cloudData = await api.getHouses(true);
        mockStore.setHouses(cloudData, false);
        setHouses(cloudData);
      } else {
        const res = await api.importVolunteers(uniqueLocalVolunteers);
        count = res.count;
        const cloudData = await api.getVolunteers(true);
        mockStore.setVolunteers(cloudData, false);
        setVolunteers(cloudData);
      }

      await loadCloudCounts();
      setSuccessMsg(
        language === 'ml'
          ? `വിജയകരമായി ${count} വിവരങ്ങൾ Supabase ക്ലൗഡിലേക്ക് സിങ്ക് ചെയ്തു!`
          : `Successfully synced ${count} items to Supabase cloud database!`
      );
    } catch (err: any) {
      console.error('Sync failed', err);
      setErrors([language === 'ml' ? ('Supabase സിങ്ക് പരാജയപ്പെട്ടു: ' + (err.message || 'Unknown error')) : ('Supabase sync failed: ' + (err.message || 'Unknown error'))]);
    } finally {
      setIsSyncing(false);
    }
  };

  // Unified Refresh from Cloud for all 3 categories
  const handleRefreshFromCloud = async (type: 'delegates' | 'houses' | 'volunteers') => {
    setIsClearing(true);
    setErrors([]);
    setSuccessMsg(null);

    try {
      let count = 0;
      if (type === 'delegates') {
        const data = await api.getDelegates(true);
        count = data.length;
        mockStore.setDelegates(data, false);
        setDelegates(data);
      } else if (type === 'houses') {
        const data = await api.getHouses(true);
        count = data.length;
        mockStore.setHouses(data, false);
        setHouses(data);
      } else {
        const data = await api.getVolunteers(true);
        count = data.length;
        mockStore.setVolunteers(data, false);
        setVolunteers(data);
      }

      await loadCloudCounts();
      setSuccessMsg(
        language === 'ml'
          ? `ക്ലൗഡിൽ നിന്നുള്ള ${count} വിവരങ്ങൾ വിജയകരമായി പുതുക്കി!`
          : `Successfully refreshed ${count} items from Supabase cloud!`
      );
    } catch (err: any) {
      console.error('Refresh failed', err);
      setErrors([language === 'ml' ? ('ഡാറ്റ പുതുക്കാൻ സാധിച്ചില്ല: ' + (err.message || 'Unknown error')) : ('Could not refresh data: ' + (err.message || 'Unknown error'))]);
    } finally {
      setIsClearing(false);
    }
  };

  // Unified Clear Local Cache for all 3 categories
  const handleClearCache = async (type: 'delegates' | 'houses' | 'volunteers') => {
    setIsClearing(true);
    setErrors([]);
    setSuccessMsg(null);

    try {
      api.invalidateCache(type);
      if (type === 'delegates') {
        mockStore.clearLocalDelegates();
        setDelegates([]);
      } else if (type === 'houses') {
        mockStore.clearLocalHouses();
        setHouses([]);
      } else {
        mockStore.clearLocalVolunteers();
        setVolunteers([]);
      }

      // Re-fetch latest from cloud if available
      if (isSupabaseConfigured) {
        try {
          if (type === 'delegates') {
            const cloudData = await api.getDelegates(true);
            mockStore.setDelegates(cloudData, false);
            setDelegates(cloudData);
          } else if (type === 'houses') {
            const cloudHouses = await api.getHouses(true);
            mockStore.setHouses(cloudHouses, false);
            setHouses(cloudHouses);
          } else {
            const cloudVolunteers = await api.getVolunteers(true);
            mockStore.setVolunteers(cloudVolunteers, false);
            setVolunteers(cloudVolunteers);
          }
        } catch {
          // fall through
        }
      }

      await loadCloudCounts();
      setSuccessMsg(language === 'ml' ? 'ഈ ഡിവൈസിലെ കാഷെ വിജയകരമായി റീസെറ്റ് ചെയ്തു.' : 'Local cache on this device reset successfully.');
    } catch (err: any) {
      setSuccessMsg(language === 'ml' ? 'കാഷെ ക്ലിയർ ചെയ്തു.' : 'Local cache cleared.');
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
            ? 'പ്രതിനിധികൾ, വീടുകൾ, വളണ്ടിയർമാർ എന്നിവരുടെ വിവരങ്ങൾ ഇമ്പോർട്ട് ചെയ്യുക'
            : 'Import Delegates, Host Houses & Volunteers (CSV / Excel)'}
        </h1>
        <p className="text-xs text-slate-500">
          {language === 'ml'
            ? 'മലയാളം യൂണികോഡ് (UTF-8) പിന്തുണയ്ക്കുന്നു. അപ്‌ലോഡ് ചെയ്യുന്നതിന് മുൻപ് ഡാറ്റ പ്രിവ്യൂ കാണാം.'
            : 'Supports Malayalam Unicode & UTF-8. You can preview data before committing.'}
        </p>
      </div>

      {/* Unified Status & Sync Card for all 3 categories (Delegates, Houses, Volunteers) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${currentConfig.colorBg} ${currentConfig.colorText}`}>
            <currentConfig.icon className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-900 font-malayalam-bold">
                {currentConfig.title}: {currentConfig.localCount} {language === 'ml' ? 'ഡിവൈസിലുണ്ട്' : 'on device'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  currentConfig.isSynced
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {currentConfig.isSynced ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{language === 'ml' ? 'ക്ലൗഡിൽ സിങ്ക് ചെയ്തിരിക്കുന്നു' : 'Synced with Cloud'}</span>
                  </>
                ) : (
                  <span>{language === 'ml' ? 'ലോക്കൽ ഡാറ്റ' : 'Local Only'}</span>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentConfig.cloudCount !== null
                ? (language === 'ml'
                    ? `Supabase ക്ലൗഡ് ഡാറ്റാബേസിൽ നിലവിൽ ${currentConfig.cloudCount} ${currentConfig.unit_ml} ലഭ്യമാണ്.`
                    : `Currently ${currentConfig.cloudCount} ${currentConfig.unit_en} available in Supabase Cloud.`)
                : (language === 'ml'
                    ? 'ക്ലൗഡ് വിവരങ്ങൾ പരിശോധിക്കുന്നു...'
                    : 'Checking cloud database...')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {!currentConfig.isSynced && currentConfig.localCount > 0 && (
            <button
              onClick={() => handleSyncToCloud(importType)}
              disabled={isSyncing || isClearing}
              className="touch-target px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>
                {isSyncing
                  ? (language === 'ml' ? 'സിങ്ക് ചെയ്യുന്നു...' : 'Syncing...')
                  : (language === 'ml' ? 'ക്ലൗഡിലേക്ക് സിങ്ക് ചെയ്യുക' : 'Sync to Cloud')}
              </span>
            </button>
          )}

          <button
            onClick={() => handleRefreshFromCloud(importType)}
            disabled={isClearing || isSyncing}
            title={language === 'ml' ? 'ക്ലൗഡിൽ നിന്ന് ഏറ്റവും പുതിയ ഡാറ്റ പുതുക്കുക' : 'Refresh data from Supabase Cloud'}
            className="touch-target px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 shadow-2xs transition-transform active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isClearing ? 'animate-spin' : ''}`} />
            <span>{language === 'ml' ? 'പുതുക്കുക' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => handleClearCache(importType)}
            disabled={isClearing || isSyncing}
            title={language === 'ml' ? 'ഈ ഡിവൈസിലെ ലോക്കൽ കാഷെ റീസെറ്റ് ചെയ്യുക' : 'Reset local device cache'}
            className="touch-target px-3.5 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>{language === 'ml' ? 'കാഷെ ക്ലിയർ' : 'Clear Cache'}</span>
          </button>
        </div>
      </div>

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
          <button
            onClick={() => {
              setImportType('volunteers');
              setParsedRows([]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              importType === 'volunteers' ? 'bg-white text-primary shadow-xs' : 'text-slate-600'
            }`}
          >
            {language === 'ml' ? 'വളണ്ടിയർമാർ (Volunteers CSV)' : 'Volunteers (CSV)'}
          </button>
        </div>

        {/* Download Template Link */}
        <a
          href={
            importType === 'delegates'
              ? '/templates/delegates_template.csv'
              : importType === 'houses'
              ? '/templates/houses_template.csv'
              : '/templates/volunteers_template.csv'
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
            {language === 'ml' ? 'CSV അല്ലെങ്കിൽ Excel (.xlsx / .xls) ഫയൽ ഇവിടെ വലിച്ചിടുക' : 'Drag & Drop CSV or Excel (.xlsx / .xls) File Here'}
          </span>
          <span className="text-xs text-slate-400">
            {language === 'ml' ? '.csv, .xlsx, .xls ഫയലുകൾ പിന്തുണയ്ക്കുന്നു' : 'Supports .csv, .xlsx, and .xls files'}
          </span>
        </div>
        <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-600 transition-all">
          <span>{language === 'ml' ? 'ഫയൽ തിരഞ്ഞെടുക്കുക (Browse File)' : 'Browse Spreadsheet File'}</span>
          <input type="file" accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileUpload} className="hidden" />
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
              className="touch-target px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary-600 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span>
                {isCommitting
                  ? (language === 'ml' ? 'Supabase-ലേക്ക് അപ്‌ലോഡ് ചെയ്യുന്നു...' : 'Uploading to Supabase...')
                  : (language === 'ml' ? `Supabase-ലേക്ക് സേവ് ചെയ്യുക (${parsedRows.length})` : `Upload to Supabase (${parsedRows.length})`)}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">{language === 'ml' ? 'പേര് (Name)' : 'Full Name'}</th>
                  <th className="p-2.5">
                    {importType === 'delegates'
                      ? (language === 'ml' ? 'ജില്ല' : 'District')
                      : importType === 'houses'
                      ? (language === 'ml' ? 'വിലാസം' : 'Address')
                      : (language === 'ml' ? 'യൂണിറ്റ് / മേഖല' : 'Unit / Area')}
                  </th>
                  <th className="p-2.5">
                    {importType === 'delegates'
                      ? (language === 'ml' ? 'ഫോൺ' : 'Phone')
                      : importType === 'houses'
                      ? (language === 'ml' ? 'ആതിഥേയൻ' : 'Host')
                      : (language === 'ml' ? 'ഫോൺ' : 'Phone')}
                  </th>
                  <th className="p-2.5">
                    {importType === 'delegates'
                      ? (language === 'ml' ? 'ടോക്കൺ ലിങ്ക്' : 'Token Link')
                      : importType === 'houses'
                      ? (language === 'ml' ? 'കപ്പാസിറ്റി' : 'Capacity')
                      : (language === 'ml' ? 'സ്റ്റാറ്റസ്' : 'Status')}
                  </th>
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
                      {importType === 'volunteers'
                        ? (row.unit || '—')
                        : language === 'ml'
                        ? (row.district_ml || row.address || '—')
                        : (row.district_en || row.address || '—')}
                    </td>
                    <td className="p-2.5">
                      {importType === 'houses' ? (row.host_name || '—') : (row.phone || '—')}
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-primary">
                      {importType === 'delegates'
                        ? (row.token ? `/d/${row.token}` : '—')
                        : importType === 'houses'
                        ? `${row.capacity} ${language === 'ml' ? 'പേർ' : 'persons'}`
                        : (language === 'ml' ? 'റെഡി' : 'Ready')}
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
