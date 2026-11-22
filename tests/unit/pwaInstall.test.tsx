import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { InstallAppGuideModal } from '../../src/components/InstallAppGuideModal';
import { InstalledNotificationPrompt } from '../../src/components/InstalledNotificationPrompt';
import { I18nProvider } from '../../src/i18n/i18nContext';

describe('PWA Mobile Install Component Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders iOS specific instructions when isIOS is true', () => {
    render(
      <I18nProvider>
        <InstallAppGuideModal isOpen={true} onClose={() => {}} isIOS={true} />
      </I18nProvider>
    );

    expect(screen.getByText(/ഹോം സ്ക്രീനിലേക്ക് ചേർക്കുക/i)).toBeDefined();
    expect(screen.getByText(/Safari/i)).toBeDefined();
    expect(screen.getAllByText(/Add to Home Screen/i).length).toBeGreaterThan(0);
  });

  it('renders Android specific instructions when isIOS is false', () => {
    render(
      <I18nProvider>
        <InstallAppGuideModal isOpen={true} onClose={() => {}} isIOS={false} />
      </I18nProvider>
    );

    expect(screen.getByText(/ഹോം സ്ക്രീനിലേക്ക് ചേർക്കുക/i)).toBeDefined();
    expect(screen.getByText(/ബ്രൗസർ മെനു തുറക്കുക/i)).toBeDefined();
  });

  it('calls onClose when Got It button or close icon is tapped', () => {
    const handleClose = vi.fn();
    render(
      <I18nProvider>
        <InstallAppGuideModal isOpen={true} onClose={handleClose} isIOS={true} />
      </I18nProvider>
    );

    const gotItBtn = screen.getByText(/മനസ്സിലായി/i);
    fireEvent.click(gotItBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders InstalledNotificationPrompt in standalone mode when permission is default', async () => {
    // Mock standalone mode
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('standalone'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Mock Notification API
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    });

    vi.useFakeTimers();

    render(
      <I18nProvider>
        <InstalledNotificationPrompt />
      </I18nProvider>
    );

    // Fast-forward 1.5s timer within act
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(screen.getByText(/സമ്മേളന അറിയിപ്പുകൾ ലഭിക്കാൻ/i)).toBeDefined();
    expect(screen.getByText(/നോട്ടിഫിക്കേഷൻ ഓൺ ചെയ്യുക/i)).toBeDefined();

    vi.useRealTimers();
  });
});
