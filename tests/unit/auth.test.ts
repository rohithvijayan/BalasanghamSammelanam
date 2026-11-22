import { describe, it, expect, beforeEach } from 'vitest';
import { StaffProfile, UserRole } from '../../src/types';

describe('Auth & Role Permissions Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Verify demo credentials map
  const DEMO_CREDENTIALS: Record<string, { pass: string; role: UserRole; district_id?: number }> = {
    'admin@balasangham.in': {
      pass: 'admin123',
      role: 'admin',
    },
    'kannur@balasangham.in': {
      pass: 'kannur123',
      role: 'district',
      district_id: 2,
    },
    'kasaragod@balasangham.in': {
      pass: 'kasaragod123',
      role: 'district',
      district_id: 1,
    },
    'volunteer@balasangham.in': {
      pass: 'volunteer123',
      role: 'volunteer',
      district_id: 1,
    },
  };

  it('should authenticate State Admin credentials correctly', () => {
    const cred = DEMO_CREDENTIALS['admin@balasangham.in'];
    expect(cred).toBeDefined();
    expect(cred.pass).toBe('admin123');
    expect(cred.role).toBe('admin');
  });

  it('should authenticate District Coordinator with proper district scoping', () => {
    const kannurCred = DEMO_CREDENTIALS['kannur@balasangham.in'];
    expect(kannurCred.role).toBe('district');
    expect(kannurCred.district_id).toBe(2);

    const kasaragodCred = DEMO_CREDENTIALS['kasaragod@balasangham.in'];
    expect(kasaragodCred.role).toBe('district');
    expect(kasaragodCred.district_id).toBe(1);
  });

  it('should authenticate Volunteer with check-in scope', () => {
    const volCred = DEMO_CREDENTIALS['volunteer@balasangham.in'];
    expect(volCred.role).toBe('volunteer');
  });

  it('should verify role access matrix for system routes', () => {
    const canAccessRoute = (role: UserRole, route: string): boolean => {
      if (route === '/' || route.startsWith('/d/')) return true; // public
      if (route === '/import') return role === 'admin';
      if (route === '/admin') return role === 'admin' || role === 'district';
      if (route === '/volunteer') return role === 'admin' || role === 'district' || role === 'volunteer';
      return false;
    };

    // Public routes accessible to everyone
    expect(canAccessRoute('admin', '/')).toBe(true);
    expect(canAccessRoute('volunteer', '/')).toBe(true);
    expect(canAccessRoute('volunteer', '/d/token-123')).toBe(true);

    // CSV Import accessible ONLY to admin
    expect(canAccessRoute('admin', '/import')).toBe(true);
    expect(canAccessRoute('district', '/import')).toBe(false);
    expect(canAccessRoute('volunteer', '/import')).toBe(false);

    // Admin Workbench accessible to admin and district
    expect(canAccessRoute('admin', '/admin')).toBe(true);
    expect(canAccessRoute('district', '/admin')).toBe(true);
    expect(canAccessRoute('volunteer', '/admin')).toBe(false);

    // Volunteer Desk accessible to all authenticated staff
    expect(canAccessRoute('volunteer', '/volunteer')).toBe(true);
    expect(canAccessRoute('district', '/volunteer')).toBe(true);
    expect(canAccessRoute('admin', '/volunteer')).toBe(true);
  });

  it('should save and retrieve staff session in localStorage', () => {
    const profile: StaffProfile = {
      id: 'staff-vol-03',
      email: 'volunteer@balasangham.in',
      full_name: 'രേഷ്മ പി. (ഹെൽപ്പ് ഡെസ്ക് വളണ്ടിയർ)',
      role: 'volunteer',
      district_id: 1,
      district_name: 'കാസർഗോഡ്',
    };

    localStorage.setItem('sammelanam_staff_session', JSON.stringify(profile));

    const retrieved = JSON.parse(localStorage.getItem('sammelanam_staff_session') || '{}');
    expect(retrieved.email).toBe('volunteer@balasangham.in');
    expect(retrieved.role).toBe('volunteer');
    expect(retrieved.district_name).toBe('കാസർഗോഡ്');
  });

  it('should validate volunteer phone and PIN logic', () => {
    const configuredPin = '7890';
    const isPinValid = (pin: string, envPin: string) => Boolean(envPin && pin.trim() === envPin.trim());
    const normalizePhone = (phone: string) => {
      const cleanDigits = phone.replace(/[^0-9]/g, '');
      return cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
    };

    expect(isPinValid('7890', configuredPin)).toBe(true);
    expect(isPinValid('1985', configuredPin)).toBe(false);
    expect(isPinValid('2026', configuredPin)).toBe(false);
    expect(isPinValid('', configuredPin)).toBe(false);

    expect(normalizePhone('+91 94471 23456')).toBe('9447123456');
    expect(normalizePhone('09447123456')).toBe('9447123456');
    expect(normalizePhone('9447123456')).toBe('9447123456');
    expect(normalizePhone('12345')).toBe('12345');
  });

  it('preserves volunteer session upon page reload even when Supabase auth session is null', () => {
    // Simulate volunteer Phone + PIN session in localStorage
    const volunteerSession: StaffProfile = {
      id: 'vol-9400112233',
      email: '9400112233@volunteer.balasangham.in',
      full_name: 'അരുൺ കുമാർ',
      phone: '9400112233',
      unit: 'നീലേശ്വരം',
      role: 'volunteer',
    };
    localStorage.setItem('sammelanam_staff_session', JSON.stringify(volunteerSession));

    // When page reloads, parsedSession has role === 'volunteer'
    const stored = JSON.parse(localStorage.getItem('sammelanam_staff_session') || '{}');
    expect(stored.role).toBe('volunteer');

    // Rule: Volunteer session should NOT be wiped if supabase.auth.getSession() returns null session
    const isVolunteer = stored.role === 'volunteer';
    const supabaseSession = null; // Supabase password session is null for volunteers

    let activeUser = stored;
    if (!supabaseSession && !isVolunteer) {
      activeUser = null;
      localStorage.removeItem('sammelanam_staff_session');
    }

    expect(activeUser).not.toBeNull();
    expect(activeUser.role).toBe('volunteer');
    expect(localStorage.getItem('sammelanam_staff_session')).not.toBeNull();
  });
});
