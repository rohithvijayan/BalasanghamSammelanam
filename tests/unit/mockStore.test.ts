import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockStore } from '../../src/lib/mockData';
import { Delegate, House } from '../../src/types';

describe('mockStore - State Conference Data Store', () => {
  beforeEach(() => {
    localStorage.clear();
    mockStore.clearLocalDelegates();
    mockStore.clearLocalHouses();
  });

  it('starts with clean empty state for delegates and houses', () => {
    const delegates = mockStore.getDelegates();
    const houses = mockStore.getHouses();
    const announcements = mockStore.getAnnouncements();

    expect(delegates.length).toBe(0);
    expect(houses.length).toBe(0);
    expect(announcements.length).toBeGreaterThan(0);
  });

  it('should retrieve demo delegate by token case-insensitively via fallback', () => {
    const data = mockStore.getDelegateByToken('kannur-arjun-412');
    expect(data).not.toBeNull();
    expect(data?.delegate.full_name).toContain('അർജുൻ');
    expect(data?.volunteer).not.toBeNull();
    expect(data?.announcements.length).toBeGreaterThan(0);
    expect(data?.helplines.length).toBeGreaterThan(0);

    // Case insensitive test
    const upperData = mockStore.getDelegateByToken('KANNUR-ARJUN-412');
    expect(upperData).not.toBeNull();
    expect(upperData?.delegate.id).toBe(data?.delegate.id);
  });

  it('should return null for non-existent token', () => {
    const data = mockStore.getDelegateByToken('non-existent-token-999');
    expect(data).toBeNull();
  });

  it('should assign a house to a delegate and persist change', () => {
    const testDel: Delegate = {
      id: 'del-unit-1',
      token: 'test-del-1',
      full_name: 'ടെസ്റ്റ് പ്രതിനിധി',
      district_id: 2,
      gender: 'boy',
      status: 'pending',
    };
    mockStore.importDelegates([testDel]);

    const newHouseId = 'h-unit-104';
    mockStore.assignHouse(testDel.id, newHouseId);

    const updated = mockStore.getDelegates().find((d) => d.id === testDel.id);
    expect(updated?.house_id).toBe(newHouseId);

    // Verify unassigning works
    mockStore.assignHouse(testDel.id, null);
    const unassigned = mockStore.getDelegates().find((d) => d.id === testDel.id);
    expect(unassigned?.house_id).toBeNull();
  });

  it('should bulk assign multiple delegates to a house', () => {
    const testDel1: Delegate = { id: 'del-u-1', token: 't-1', full_name: 'P1', district_id: 1, gender: 'boy', status: 'pending' };
    const testDel2: Delegate = { id: 'del-u-2', token: 't-2', full_name: 'P2', district_id: 1, gender: 'girl', status: 'pending' };
    mockStore.importDelegates([testDel1, testDel2]);

    const targetHouseId = 'h-u-102';
    mockStore.bulkAssign(['del-u-1', 'del-u-2'], targetHouseId);

    const updatedDelegates = mockStore.getDelegates().filter((d) => ['del-u-1', 'del-u-2'].includes(d.id));
    expect(updatedDelegates.every((d) => d.house_id === targetHouseId)).toBe(true);
  });

  it('should update delegate status and record checked_in_at timestamp', () => {
    const testDel: Delegate = { id: 'del-u-status', token: 't-status', full_name: 'Status Test', district_id: 1, gender: 'boy', status: 'pending' };
    mockStore.importDelegates([testDel]);

    mockStore.updateStatus(testDel.id, 'checked_in');

    const updated = mockStore.getDelegates().find((d) => d.id === testDel.id);
    expect(updated?.status).toBe('checked_in');
    expect(updated?.checked_in_at).toBeDefined();

    // Revert status to pending
    mockStore.updateStatus(testDel.id, 'pending');
    const reverted = mockStore.getDelegates().find((d) => d.id === testDel.id);
    expect(reverted?.status).toBe('pending');
  });

  it('should import new delegates and append them to store', () => {
    const initialCount = mockStore.getDelegates().length;
    const newDelegate: Delegate = {
      id: 'del-test-100',
      token: 'test-token-100',
      full_name: 'ടെസ്റ്റ് പ്രതിനിധി (Test Delegate)',
      district_id: 1,
      district_ml: 'കാസർഗോഡ്',
      district_en: 'Kasaragod',
      gender: 'boy',
      status: 'pending',
    };

    mockStore.importDelegates([newDelegate]);

    const updatedDelegates = mockStore.getDelegates();
    expect(updatedDelegates.length).toBe(initialCount + 1);
    expect(mockStore.getDelegateByToken('test-token-100')).not.toBeNull();
  });

  it('should deduplicate delegates when importing duplicate tokens without ballooning the count', () => {
    const currentCount = mockStore.getDelegates().length;
    const duplicateDelegate: Delegate = {
      id: 'del-dup-1',
      token: 'duplicate-token-xyz',
      full_name: 'ആവർത്തന പ്രതിനിധി (Duplicate Test)',
      district_id: 1,
      district_ml: 'കാസർഗോഡ്',
      district_en: 'Kasaragod',
      gender: 'boy',
      status: 'pending',
    };

    // Import once
    mockStore.importDelegates([duplicateDelegate]);
    expect(mockStore.getDelegates().length).toBe(currentCount + 1);

    // Import the exact same delegate 3 more times
    mockStore.importDelegates([duplicateDelegate]);
    mockStore.importDelegates([duplicateDelegate]);
    mockStore.importDelegates([duplicateDelegate]);

    // Count should still remain exactly currentCount + 1, never multiplying
    expect(mockStore.getDelegates().length).toBe(currentCount + 1);
  });

  it('should support setDelegates to cleanly overwrite cache and clearLocalDelegates to reset', () => {
    const customList: Delegate[] = [
      {
        id: 'del-custom-1',
        token: 'token-c1',
        full_name: 'കസ്റ്റം 1',
        district_id: 2,
        district_ml: 'കണ്ണൂർ',
        district_en: 'Kannur',
        gender: 'boy',
        status: 'pending',
      },
      {
        id: 'del-custom-2',
        token: 'token-c2',
        full_name: 'കസ്റ്റം 2',
        district_id: 2,
        district_ml: 'കണ്ണൂർ',
        district_en: 'Kannur',
        gender: 'girl',
        status: 'checked_in',
      },
    ];

    mockStore.setDelegates(customList);
    expect(mockStore.getDelegates().length).toBe(2);

    mockStore.clearLocalDelegates();
    expect(mockStore.getDelegates().length).toBe(0);
  });

  it('should import new houses and append them to store', () => {
    const initialCount = mockStore.getHouses().length;
    const newHouse: House = {
      id: 'h-test-999',
      name: 'പുതിയ താമസ കേന്ദ്രം (New Test House)',
      address: 'നീലേശ്വരം ടൗൺ',
      host_name: 'കെ. എം. മോഹനൻ',
      host_phone: '+91 94470 00000',
      capacity: 8,
      gender_restriction: 'boys',
    };

    mockStore.importHouses([newHouse]);

    const updatedHouses = mockStore.getHouses();
    expect(updatedHouses.length).toBe(initialCount + 1);
    expect(updatedHouses.some((h) => h.id === 'h-test-999')).toBe(true);
  });

  it('should notify subscribers when store state mutates', () => {
    const testDel: Delegate = { id: 'del-notif', token: 't-notif', full_name: 'Notif Test', district_id: 1, gender: 'boy', status: 'pending' };
    mockStore.importDelegates([testDel]);

    const listener = vi.fn();
    const unsubscribe = mockStore.subscribe(listener);

    mockStore.updateStatus('del-notif', 'checked_in');
    expect(listener).toHaveBeenCalledTimes(1);

    mockStore.assignHouse('del-notif', 'h-101');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    mockStore.updateStatus('del-notif', 'pending');
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
