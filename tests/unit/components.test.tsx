import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Header } from '../../src/components/Header';
import { ProtectedRoute } from '../../src/auth/ProtectedRoute';
import { HelplineSupportCard } from '../../src/components/HelplineSupportCard';
import { StayCard } from '../../src/components/StayCard';
import { InteractiveGuideModal } from '../../src/components/InteractiveGuideModal';
import { I18nProvider } from '../../src/i18n/i18nContext';
import { AuthProvider } from '../../src/auth/AuthContext';
import { Delegate, House, HelplineItem } from '../../src/types';

describe('React Components Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderWithProviders = (ui: React.ReactElement, initialRoute = '/') => {
    return render(
      <I18nProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[initialRoute]}>
            {ui}
          </MemoryRouter>
        </AuthProvider>
      </I18nProvider>
    );
  };

  describe('<Header />', () => {
    it('renders logo and prominent Login button when unauthenticated', () => {
      renderWithProviders(<Header />);

      expect(screen.getByAltText(/Balasangham Logo/i)).toBeInTheDocument();
      expect(screen.getByText(/ലോഗിൻ \(Login\)/i)).toBeInTheDocument();
      expect(screen.getByText('മലയാളം')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();

      // Admin workbench should NOT be visible when unauthenticated
      expect(screen.queryByText(/അഡ്മിൻ വർക്ക് ബെഞ്ച്/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/ഇമ്പോർട്ട്/i)).not.toBeInTheDocument();
    });

    it('renders role-specific nav when logged in as State Admin', () => {
      localStorage.setItem(
        'sammelanam_staff_session',
        JSON.stringify({
          id: 'admin-1',
          email: 'admin@balasangham.in',
          full_name: 'സംസ്ഥാന അഡ്മിൻ',
          role: 'admin',
        })
      );

      renderWithProviders(<Header />);

      expect(screen.getByText(/അഡ്മിൻ വർക്ക് ബെഞ്ച്/i)).toBeInTheDocument();
      expect(screen.getByText('ഡാറ്റ ഇമ്പോർട്ട്')).toBeInTheDocument();
      expect(screen.getByText(/വളണ്ടിയർ ഡെസ്ക്/i)).toBeInTheDocument();
      expect(screen.getByText('admin@balasangham.in')).toBeInTheDocument();
      expect(screen.getByText(/സംസ്ഥാന അഡ്മിൻ/i)).toBeInTheDocument();
    });

    it('renders district-scoped nav when logged in as District Coordinator', () => {
      localStorage.setItem(
        'sammelanam_staff_session',
        JSON.stringify({
          id: 'dist-1',
          email: 'kannur@balasangham.in',
          full_name: 'കണ്ണൂർ കൺവീനർ',
          role: 'district',
          district_id: 2,
          district_name: 'കണ്ണൂർ',
        })
      );

      renderWithProviders(<Header />);

      expect(screen.getByText(/കണ്ണൂർ വർക്ക് ബെഞ്ച്/i)).toBeInTheDocument();
      expect(screen.getByText(/വളണ്ടിയർ ഡെസ്ക്/i)).toBeInTheDocument();
      expect(screen.getByText('kannur@balasangham.in')).toBeInTheDocument();
      // Admin only CSV import should NOT be visible to district coordinator
      expect(screen.queryByText(/ഡാറ്റ ഇമ്പോർട്ട് \(CSV\)/i)).not.toBeInTheDocument();
    });

    it('renders only Volunteer Desk when logged in as Volunteer', () => {
      localStorage.setItem(
        'sammelanam_staff_session',
        JSON.stringify({
          id: 'vol-1',
          email: 'volunteer@balasangham.in',
          full_name: 'രേഷ്മ പി.',
          role: 'volunteer',
        })
      );

      renderWithProviders(<Header />);

      expect(screen.getByText(/വളണ്ടിയർ ഡെസ്ക്/i)).toBeInTheDocument();
      expect(screen.getByText('volunteer@balasangham.in')).toBeInTheDocument();
      expect(screen.queryByText(/അഡ്മിൻ വർക്ക് ബെഞ്ച്/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/ഡാറ്റ ഇമ്പോർട്ട്/i)).not.toBeInTheDocument();
    });

    it('toggles mobile hamburger navigation menu on mobile button click', () => {
      localStorage.setItem(
        'sammelanam_staff_session',
        JSON.stringify({
          id: 'admin-1',
          email: 'admin@balasangham.in',
          full_name: 'സംസ്ഥാന അഡ്മിൻ',
          role: 'admin',
        })
      );

      renderWithProviders(<Header />);

      const hamburgerBtn = screen.getByLabelText(/Open Navigation Menu/i);
      expect(hamburgerBtn).toBeInTheDocument();

      // Initially mobile menu is closed
      expect(screen.queryByText(/സംസ്ഥാന അഡ്മിൻ \(State Admin\)/i)).not.toBeInTheDocument();

      // Click to open
      fireEvent.click(hamburgerBtn);

      // Now mobile drawer is open showing full profile and links
      expect(screen.getByText(/സംസ്ഥാന അഡ്മിൻ \(State Admin\)/i)).toBeInTheDocument();
      expect(screen.getByText(/ഡാറ്റ ഇമ്പോർട്ട് \(Import CSV \/ Excel\)/i)).toBeInTheDocument();
      expect(screen.getByText(/ഹോം \(Home Portal\)/i)).toBeInTheDocument();

      // Click again to close
      const closeBtn = screen.getByLabelText(/Close Navigation Menu/i);
      fireEvent.click(closeBtn);
      expect(screen.queryByText(/സംസ്ഥാന അഡ്മിൻ \(State Admin\)/i)).not.toBeInTheDocument();
    });
  });

  describe('<ProtectedRoute />', () => {
    it('redirects unauthenticated users to login', () => {
      renderWithProviders(
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div>Secret Admin Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page Target</div>} />
        </Routes>,
        '/admin'
      );

      expect(screen.getByText('Login Page Target')).toBeInTheDocument();
      expect(screen.queryByText('Secret Admin Content')).not.toBeInTheDocument();
    });

    it('shows Access Denied when user role does not match allowedRoles', () => {
      localStorage.setItem(
        'sammelanam_staff_session',
        JSON.stringify({
          id: 'vol-1',
          email: 'vol@balasangham.in',
          full_name: 'വളണ്ടിയർ',
          role: 'volunteer',
        })
      );

      renderWithProviders(
        <ProtectedRoute allowedRoles={['admin']}>
          <div>Secret Admin Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText(/അനുമതിയില്ല \(Access Denied\)/i)).toBeInTheDocument();
      expect(screen.queryByText('Secret Admin Content')).not.toBeInTheDocument();
    });

    it('renders child component when user has an allowed role', () => {
      localStorage.setItem(
        'sammelanam_staff_session',
        JSON.stringify({
          id: 'admin-1',
          email: 'admin@balasangham.in',
          full_name: 'അഡ്മിൻ',
          role: 'admin',
        })
      );

      renderWithProviders(
        <ProtectedRoute allowedRoles={['admin', 'district']}>
          <div>Protected Content Rendered Successfully</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content Rendered Successfully')).toBeInTheDocument();
    });
  });

  describe('<HelplineSupportCard />', () => {
    const mockHelplines: HelplineItem[] = [
      { title_ml: 'കൺട്രോൾ റൂം', title_en: 'Control Room', phone: '04985 201201' },
      { title_ml: 'അക്കോമഡേഷൻ കൺവീനർ', title_en: 'Accommodation Convener', phone: '94471 23456' },
    ];

    it('renders helplines and handles location sharing with geolocation', async () => {
      // Mock geolocation
      const mockGeolocation = {
        getCurrentPosition: vi.fn().mockImplementation((success) =>
          success({
            coords: {
              latitude: 12.25,
              longitude: 75.12,
              accuracy: 10,
            },
          })
        ),
      };
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
        configurable: true,
      });

      renderWithProviders(<HelplineSupportCard token="arjun-412" helplines={mockHelplines} />);

      expect(screen.getByText(/ഹെൽപ്പ് ലൈൻ & സഹായകേന്ദ്രങ്ങൾ/i)).toBeInTheDocument();
      expect(screen.getByText('04985 201201')).toBeInTheDocument();
      expect(screen.getByText('94471 23456')).toBeInTheDocument();

      // Test location share click button
      const shareButton = screen.getByRole('button', { name: /ലൊക്കേഷൻ ഷെയർ ചെയ്യുക/i });
      expect(shareButton).toBeInTheDocument();
      fireEvent.click(shareButton);

      // Verify success state banner renders
      expect(
        await screen.findByText(/30 മിനിറ്റിലേക്ക് ഷെയർ ചെയ്തു/i, {}, { timeout: 3000 })
      ).toBeInTheDocument();
    });
  });

  describe('<StayCard />', () => {
    const mockDelegate: Delegate = {
      id: 'del-1',
      token: 'arjun-412',
      full_name: 'അർജുൻ കെ.',
      district_id: 2,
      district_ml: 'കണ്ണൂർ',
      gender: 'boy',
      status: 'checked_in',
    };

    const mockHouse: House = {
      id: 'h-101',
      name: 'പൂന്തോട്ടം വീട്',
      address: 'നീലേശ്വരം നഗരസഭ',
      host_name: 'കെ. രാഘവൻ',
      host_phone: '+91 94471 23456',
      capacity: 4,
      map_url: 'https://maps.google.com/?q=12.25,75.12',
    };

    it('renders delegate stay details, host contacts, and map link', () => {
      renderWithProviders(<StayCard delegate={mockDelegate} house={mockHouse} />);

      expect(screen.getByText('പൂന്തോട്ടം വീട്')).toBeInTheDocument();
      expect(screen.getByText('കെ. രാഘവൻ')).toBeInTheDocument();
      expect(screen.getByText('+91 94471 23456')).toBeInTheDocument();
      expect(screen.getByText(/റൂട്ട് മാപ്പ് കാണുക/i)).toBeInTheDocument();
    });
  });

  describe('<InteractiveGuideModal />', () => {
    it('renders and allows stepping through interactive guide quests', () => {
      const handleClose = vi.fn();
      const { rerender } = renderWithProviders(
        <InteractiveGuideModal isOpen={true} onClose={handleClose} initialRole="admin" />
      );

      // Check header and roles
      expect(screen.getByText(/പ്ലാറ്റ്‌ഫോം ഗൈഡ്/i)).toBeInTheDocument();
      expect(screen.getByText(/Admin Quest/i)).toBeInTheDocument();
      expect(screen.getByText(/Volunteer Quest/i)).toBeInTheDocument();

      // Check step 1 content
      expect(screen.getByText(/ഘട്ടം 1: ഡാറ്റ അപ്‌ലോഡ്/i)).toBeInTheDocument();

      // Switch to Volunteer Quest
      const volunteerTab = screen.getByText(/Volunteer Quest/i);
      fireEvent.click(volunteerTab);

      // Step 1 of volunteer should show
      expect(screen.getByText(/ഘട്ടം 1: തിരച്ചിൽ/i)).toBeInTheDocument();

      // Click Next step
      const nextBtn = screen.getByText('അടുത്തത്');
      fireEvent.click(nextBtn);

      // Step 2 of volunteer: Arrival check-in
      expect(screen.getByText(/ഘട്ടം 2: ഹാജർ രേഖപ്പെടുത്തൽ/i)).toBeInTheDocument();

      // Close modal
      const closeBtn = screen.getByRole('button', { name: /ഗൈഡ് ക്ലോസ് ചെയ്യുക/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('simulates exact Admin Workbench Step 2 (allocation) and Step 3 (in-line edit modal)', () => {
      renderWithProviders(
        <InteractiveGuideModal isOpen={true} onClose={vi.fn()} initialRole="admin" />
      );

      // Start on Step 1, click Next to go to Step 2
      const nextBtn = screen.getByText('അടുത്തത്');
      fireEvent.click(nextBtn);

      // Verify Step 2 is active: Allocation
      expect(screen.getByText(/ഘട്ടം 2: അലോട്ട്മെന്റ്/i)).toBeInTheDocument();
      expect(screen.getByText('പൂന്തോട്ടം വീട്')).toBeInTheDocument();
      expect(screen.getByText(/കപ്പാസിറ്റി: 2 \/ 4 പേർ/i)).toBeInTheDocument();

      // "Assign Here" should be initially disabled before selection
      const assignHereBtn = screen.getByRole('button', { name: /ഇവിടെ അലോട്ട് ചെയ്യുക/i });
      expect(assignHereBtn).toBeDisabled();

      // Click the delegate row to select
      const delegateRow = screen.getByText(/അഭിനന്ദ് സി\.വി\./i);
      fireEvent.click(delegateRow);

      // Now "Assign Here" button is enabled
      expect(assignHereBtn).not.toBeDisabled();

      // Click "Assign Here" to allot
      fireEvent.click(assignHereBtn);

      // Capacity should now update to 3 / 4 and show accommodated confirmation
      expect(screen.getByText(/കപ്പാസിറ്റി: 3 \/ 4 പേർ/i)).toBeInTheDocument();
      expect(screen.getByText(/എല്ലാ പ്രതിനിധികൾക്കും താമസസ്ഥലം അനുവദിച്ചു!/i)).toBeInTheDocument();

      // Proceed to Step 3: In-Line Edits
      fireEvent.click(screen.getByText('അടുത്തത്'));
      expect(screen.getByText(/ഘട്ടം 3: തത്സമയ മാറ്റങ്ങൾ/i)).toBeInTheDocument();

      // Check delegate card
      expect(screen.getByText('അർജുൻ കെ.')).toBeInTheDocument();
      expect(screen.getByText(/kannur-412/i)).toBeInTheDocument();

      // Click Edit pencil button to open exact Edit Modal
      const editBtn = screen.getByRole('button', { name: /വിവരങ്ങൾ തിരുത്തുക/i });
      fireEvent.click(editBtn);

      // Mini edit modal should be open
      expect(screen.getByText(/വിവരങ്ങൾ തിരുത്തുക \(Edit Modal\)/i)).toBeInTheDocument();
      expect(screen.getByText(/പൂർണ്ണ പേര് \*/i)).toBeInTheDocument();

      // Click quick fill test number
      const testFillBtn = screen.getByRole('button', { name: /ടെസ്റ്റ് നമ്പർ/i });
      fireEvent.click(testFillBtn);

      // Click Save Changes in modal
      const saveBtn = screen.getByRole('button', { name: /സേവ് ചെയ്യുക/i });
      fireEvent.click(saveBtn);

      // Verify modal closed and success toast appeared
      expect(screen.queryByText(/വിവരങ്ങൾ തിരുത്തുക \(Edit Modal\)/i)).not.toBeInTheDocument();
      expect(screen.getByText(/വിവരങ്ങൾ വിജയകരമായി സേവ് ചെയ്തു!/i)).toBeInTheDocument();
      expect(screen.getByText(/\+91 94471 23456/i)).toBeInTheDocument();
    });
  });
});
