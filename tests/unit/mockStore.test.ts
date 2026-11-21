import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockStore, getVolunteerNaturalKey, isDelegateAssignedToVolunteer } from '../../src/lib/mockData';
import { Delegate, House, Volunteer } from '../../src/types';
import { api } from '../../src/lib/supabase';

describe('mockStore - State Conference Data Store', () => {
  beforeEach(() => {
    localStorage.clear();
    mockStore.clearLocalDelegates();
    mockStore.clearLocalHouses();
  });

  it('starts with clean empty state for delegates, houses and announcements', () => {
    const delegates = mockStore.getDelegates();
    const houses = mockStore.getHouses();
    const announcements = mockStore.getAnnouncements();

    expect(delegates.length).toBe(0);
    expect(houses.length).toBe(0);
    expect(announcements.length).toBe(0);
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

  it('should retrieve delegate by phone number and delegate ID (homepage search support)', () => {
    // 1. By exact phone stored with country code (+91 98470 11223)
    const exactPhoneData = mockStore.getDelegateByToken('+91 98470 11223');
    expect(exactPhoneData).not.toBeNull();
    expect(exactPhoneData?.delegate.token).toBe('kannur-arjun-412');

    // 2. By raw 10-digit phone number (9847011223)
    const tenDigitData = mockStore.getDelegateByToken('9847011223');
    expect(tenDigitData).not.toBeNull();
    expect(tenDigitData?.delegate.token).toBe('kannur-arjun-412');

    // 3. By phone with spaces and dashes (+91-98470-11223 / 98470 11223)
    const formattedData = mockStore.getDelegateByToken('98470 11223');
    expect(formattedData).not.toBeNull();
    expect(formattedData?.delegate.token).toBe('kannur-arjun-412');

    // 4. By delegate ID (del-1)
    const idData = mockStore.getDelegateByToken('del-1');
    expect(idData).not.toBeNull();
    expect(idData?.delegate.token).toBe('kannur-arjun-412');

    // 5. Non-existent phone returns null
    const nonExistentPhone = mockStore.getDelegateByToken('9999999999');
    expect(nonExistentPhone).toBeNull();
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

  it('should update delegate details and persist', () => {
    const testDel: Delegate = {
      id: 'del-edit-1',
      token: 'token-edit-1',
      full_name: 'Original Name',
      phone: '9876543210',
      district_id: 1,
      gender: 'boy',
      status: 'pending',
    };
    mockStore.importDelegates([testDel]);

    mockStore.updateDelegate({
      ...testDel,
      full_name: 'Updated Name',
      phone: '9998887776',
      notes: 'Vegetarian food required',
    });

    const updated = mockStore.getDelegates().find((d) => d.id === 'del-edit-1');
    expect(updated?.full_name).toBe('Updated Name');
    expect(updated?.phone).toBe('9998887776');
    expect(updated?.notes).toBe('Vegetarian food required');
  });

  it('should update house details and persist', () => {
    const testHouse: House = {
      id: 'house-edit-1',
      name: 'Original House',
      address: 'Address 1',
      host_name: 'Host 1',
      host_phone: '9447100000',
      capacity: 4,
      gender_restriction: 'boys',
    };
    mockStore.importHouses([testHouse]);

    mockStore.updateHouse({
      ...testHouse,
      name: 'Renamed House',
      capacity: 6,
      host_phone: '9447200000',
    });

    const updated = mockStore.getHouses().find((h) => h.id === 'house-edit-1');
    expect(updated?.name).toBe('Renamed House');
    expect(updated?.capacity).toBe(6);
    expect(updated?.host_phone).toBe('9447200000');
  });

  it('should add a new house via addHouse', () => {
    const newHouse = mockStore.addHouse({
      name: 'New Added House',
      address: 'Nileshwaram North',
      host_name: 'Comrade Sasi',
      host_phone: '9447333333',
      capacity: 5,
      gender_restriction: 'girls',
    });

    expect(newHouse.id).toBeDefined();
    expect(newHouse.name).toBe('New Added House');

    const found = mockStore.getHouses().find((h) => h.id === newHouse.id);
    expect(found).toBeDefined();
    expect(found?.capacity).toBe(5);
  });

  it('should deduplicate houses when re-importing identical houses with different generated IDs', () => {
    // Simulate first import of 50 houses
    const batch1: House[] = Array.from({ length: 50 }, (_, i) => ({
      id: `h-first-${i}`,
      name: `House ${i}`,
      address: `Ward ${i}, Nileshwaram`,
      host_name: `Host ${i}`,
      host_phone: `94471000${i.toString().padStart(2, '0')}`,
      capacity: 4,
      gender_restriction: 'boys',
    }));
    mockStore.importHouses(batch1);
    expect(mockStore.getHouses().length).toBe(50);

    // Simulate re-importing the same 50 houses with newly generated IDs
    const batch2: House[] = Array.from({ length: 50 }, (_, i) => ({
      id: `h-second-${i}`,
      name: `House ${i}`,
      address: `Ward ${i}, Nileshwaram`,
      host_name: `Host ${i}`,
      host_phone: `94471000${i.toString().padStart(2, '0')}`,
      capacity: 5, // updated capacity
      gender_restriction: 'boys',
    }));
    mockStore.importHouses(batch2);

    // Count MUST stay 50, not balloon to 100
    const houses = mockStore.getHouses();
    expect(houses.length).toBe(50);
    // Should preserve original ID and update capacity
    const firstHouse = houses.find((h) => h.name === 'House 0');
    expect(firstHouse?.id).toBe('h-first-0');
    expect(firstHouse?.capacity).toBe(5);
  });

  it('should self-heal and deduplicate duplicate houses on getHouses and remap delegate stays', () => {
    // Manually inject duplicate houses into local storage
    const dupes: House[] = [
      { id: 'h-canon-1', name: 'Souparnika House', address: 'College Rd', host_name: 'Sujatha', host_phone: '9846289001', capacity: 6, gender_restriction: 'girls' },
      { id: 'h-dupe-1', name: 'Souparnika House', address: 'College Rd', host_name: 'Sujatha', host_phone: '9846289001', capacity: 6, gender_restriction: 'girls' },
    ];
    localStorage.setItem('sammelanam_houses', JSON.stringify(dupes));
    localStorage.setItem('sammelanam_cache_ts', Date.now().toString());

    // Create a new mock store instance reading from localStorage
    const testDel: Delegate = {
      id: 'del-occ-1',
      token: 'tok-occ-1',
      full_name: 'Resident A',
      district_id: 1,
      gender: 'girl',
      status: 'pending',
      house_id: 'h-dupe-1', // assigned to duplicate ID
    };
    mockStore.importDelegates([testDel]);

    // Import the duplicate houses directly to simulate double-upload
    mockStore.setHouses(dupes);

    // getHouses should deduplicate
    const cleanHouses = mockStore.getHouses();
    expect(cleanHouses.length).toBe(1);
    expect(cleanHouses[0].id).toBe('h-canon-1');

    // Delegate assigned to duplicate ID should now point to canonical ID
    const updatedDel = mockStore.getDelegates().find((d) => d.id === 'del-occ-1');
    expect(updatedDel?.house_id).toBe('h-canon-1');
  });

  it('should assign a volunteer to a delegate and bulk assign to multiple delegates', () => {
    const d1: Delegate = { id: 'del-v-1', token: 'tok-v-1', full_name: 'Child 1', district_id: 1, gender: 'boy', status: 'pending' };
    const d2: Delegate = { id: 'del-v-2', token: 'tok-v-2', full_name: 'Child 2', district_id: 1, gender: 'girl', status: 'pending' };
    mockStore.importDelegates([d1, d2]);

    const volunteer = { name: 'Reshma P.', phone: '+91 98460 78901', unit: 'Nileshwaram East' };
    mockStore.assignVolunteer('del-v-1', volunteer);

    const updated1 = mockStore.getDelegates().find((d) => d.id === 'del-v-1');
    expect(updated1?.volunteer?.name).toBe('Reshma P.');
    expect(updated1?.volunteer?.phone).toBe('+91 98460 78901');

    // Bulk assign
    const vol2 = { name: 'Vipin Das', phone: '+91 94472 33445', unit: 'Station Desk' };
    mockStore.bulkAssignVolunteer(['del-v-1', 'del-v-2'], vol2);

    const batch = mockStore.getDelegates().filter((d) => ['del-v-1', 'del-v-2'].includes(d.id));
    expect(batch.every((d) => d.volunteer?.name === 'Vipin Das')).toBe(true);
  });

  it('should record volunteer live location ping and attach to assigned delegates for 30 minutes', () => {
    const vol = { name: 'അർജുൻ കെ.', phone: '+91 94471 23456', unit: 'സൗത്ത് സോൺ' };
    const d: Delegate = {
      id: 'del-vol-live-1',
      token: 'tok-vol-live-1',
      full_name: 'Delegate With Live Vol',
      district_id: 1,
      gender: 'boy',
      status: 'pending',
      volunteer: vol,
    };
    mockStore.importDelegates([d]);

    // Record volunteer live location
    mockStore.recordVolunteerLocationPing('അർജുൻ കെ.', '+91 94471 23456', 12.2531, 75.1292, 10);

    const activePings = mockStore.getActiveVolunteerLocationPings();
    expect(activePings['അർജുൻ കെ.']).toBeDefined();
    expect(activePings['അർജുൻ കെ.'].lat).toBe(12.2531);
    expect(activePings['അർജുൻ കെ.'].lng).toBe(75.1292);

    // Delegate stay data should reflect volunteer active_location
    const stayData = mockStore.getDelegateByToken('tok-vol-live-1');
    expect(stayData?.volunteer?.active_location).toBeDefined();
    expect(stayData?.volunteer?.active_location?.lat).toBe(12.2531);

    // Stop location sharing
    mockStore.clearVolunteerLocationPing('അർജുൻ കെ.');
    const activePingsAfter = mockStore.getActiveVolunteerLocationPings();
    expect(activePingsAfter['അർജുൻ കെ.']).toBeUndefined();

    const stayDataAfter = mockStore.getDelegateByToken('tok-vol-live-1');
    expect(stayDataAfter?.volunteer?.active_location).toBeNull();
  });

  it('allows admins to add, list, and delete real announcements', () => {
    // 1. Initial state is empty
    expect(mockStore.getAnnouncements().length).toBe(0);

    // 2. Admin adds an announcement
    const created = mockStore.addAnnouncement({
      title_ml: 'ഭക്ഷണശാല തുറന്നു',
      title_en: 'Dining Hall Open',
      body_ml: 'പ്രഭാതഭക്ഷണം ഹാൾ എ-യിൽ ലഭ്യമാണ്.',
      body_en: 'Breakfast is served in Hall A.',
      pinned: true,
      target_district_id: null,
    });

    expect(created.id).toBeDefined();
    expect(created.title_ml).toBe('ഭക്ഷണശാല തുറന്നു');
    expect(created.pinned).toBe(true);

    const list = mockStore.getAnnouncements();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(created.id);

    // 3. Admin deletes the announcement
    mockStore.deleteAnnouncement(created.id);
    expect(mockStore.getAnnouncements().length).toBe(0);
  });

  it('allows admins to add, list, and delete volunteers and syncs with dropdowns', () => {
    // 1. Initial list has default volunteers
    const initialVolunteers = mockStore.getVolunteers();
    expect(initialVolunteers.length).toBeGreaterThan(0);

    // 2. Add new volunteer
    const newVol = mockStore.addVolunteer({
      name: 'സഖാവ് വിപിൻ (Comrade Vipin)',
      phone: '+919447998877',
      unit: 'നീലേശ്വരം ഈസ്റ്റ്',
    });
    expect(newVol.id).toBeDefined();
    expect(newVol.name).toBe('സഖാവ് വിപിൻ (Comrade Vipin)');

    const updatedList = mockStore.getVolunteers();
    expect(updatedList.some((v) => v.name === 'സഖാവ് വിപിൻ (Comrade Vipin)')).toBe(true);

    // 3. Delete the volunteer
    mockStore.deleteVolunteer(newVol.id!);
    const afterDelete = mockStore.getVolunteers();
    expect(afterDelete.some((v) => v.name === 'സഖാവ് വിപിൻ (Comrade Vipin)')).toBe(false);
  });

  it('supports paginated delegate queries to reduce data volume', () => {
    // Create 30 test delegates
    const delegates: Delegate[] = Array.from({ length: 30 }, (_, i) => ({
      id: `del-page-${i + 1}`,
      token: `tok-page-${i + 1}`,
      full_name: `പ്രതിനിധി ${i + 1}`,
      district_id: (i % 3) + 1,
      gender: i % 2 === 0 ? 'boy' : 'girl',
      status: 'pending',
    }));
    mockStore.importDelegates(delegates);

    // Page 1 with pageSize 10
    const page1 = mockStore.getPaginatedDelegates({ page: 1, pageSize: 10 });
    expect(page1.data.length).toBe(10);
    expect(page1.totalCount).toBe(30);
    expect(page1.totalPages).toBe(3);
    expect(page1.page).toBe(1);

    // Page 3 with pageSize 10
    const page3 = mockStore.getPaginatedDelegates({ page: 3, pageSize: 10 });
    expect(page3.data.length).toBe(10);
    expect(page3.page).toBe(3);

    // Filtering by gender
    const boysPage = mockStore.getPaginatedDelegates({ gender: 'boy', pageSize: 10 });
    expect(boysPage.totalCount).toBe(15);
    expect(boysPage.data.every((d) => d.gender === 'boy')).toBe(true);
  });

  it('correctly computes volunteer natural keys and deduplicates bulk imports', async () => {
    const v1: Volunteer = { name: 'അരുൺ കുമാർ', phone: '+91 9400112233', unit: 'നീലേശ്വരം' };
    const v2: Volunteer = { name: 'അരുൺ കുമാർ', phone: '9400112233', unit: 'നീലേശ്വരം ഈസ്റ്റ്' }; // Same phone
    const v3: Volunteer = { name: 'സുഹറ ബീവി', phone: '9400223344', unit: 'ചെറുവത്തൂർ' };

    expect(getVolunteerNaturalKey(v1)).toBe('അരുൺ കുമാർ::9400112233');
    expect(getVolunteerNaturalKey(v2)).toBe('അരുൺ കുമാർ::9400112233');
    expect(getVolunteerNaturalKey(v3)).toBe('സുഹറ ബീവി::9400223344');

    // Bulk import via api.importVolunteers
    const res = await api.importVolunteers([v1, v2, v3]);
    expect(res.count).toBe(2); // v1 and v2 have same name/phone match

    const stored = mockStore.getVolunteers();
    expect(stored.some((v) => v.name === 'അരുൺ കുമാർ')).toBe(true);
    expect(stored.some((v) => v.name === 'സുഹറ ബീവി')).toBe(true);
  });

  it('allows admins and volunteers to update volunteer details', async () => {
    const vol = mockStore.addVolunteer({
      name: 'വിപിൻ ദാസ്',
      phone: '9447233445',
      unit: 'റെയിൽവേ സ്റ്റേഷൻ',
    });

    // Update via api.updateVolunteer
    const updated = await api.updateVolunteer({
      id: vol.id!,
      name: 'വിപിൻ ദാസ് കെ.',
      phone: '9447233449',
      unit: 'നീലേശ്വരം ഈസ്റ്റ്',
    });

    expect(updated).not.toBeNull();
    expect(updated?.name).toBe('വിപിൻ ദാസ് കെ.');
    expect(updated?.phone).toBe('9447233449');
    expect(updated?.unit).toBe('നീലേശ്വരം ഈസ്റ്റ്');

    // Verify it persists in mockStore
    const check = mockStore.getVolunteers().find((v) => v.id === vol.id);
    expect(check?.name).toBe('വിപിൻ ദാസ് കെ.');
    expect(check?.phone).toBe('9447233449');
  });

  it('api.bulkAssign and api.assignHouse update delegate house allocations and invalidate cache', async () => {
    const testDel1: Delegate = { id: 'api-del-1', token: 'api-t-1', full_name: 'D1', district_id: 2, gender: 'boy', status: 'pending' };
    const testDel2: Delegate = { id: 'api-del-2', token: 'api-t-2', full_name: 'D2', district_id: 2, gender: 'girl', status: 'pending' };
    mockStore.importDelegates([testDel1, testDel2]);

    const targetHouseId = 'h-test-assign-1';
    await api.bulkAssign(['api-del-1', 'api-del-2'], targetHouseId);

    const delegatesAfter = mockStore.getDelegates();
    expect(delegatesAfter.find((d) => d.id === 'api-del-1')?.house_id).toBe(targetHouseId);
    expect(delegatesAfter.find((d) => d.id === 'api-del-2')?.house_id).toBe(targetHouseId);

    // Unassign via api.assignHouse(id, null)
    await api.assignHouse('api-del-1', null);
    const delegatesAfterUnassign = mockStore.getDelegates();
    expect(delegatesAfterUnassign.find((d) => d.id === 'api-del-1')?.house_id).toBeNull();
    expect(delegatesAfterUnassign.find((d) => d.id === 'api-del-2')?.house_id).toBe(targetHouseId);
  });

  it('House In-Charge Auto-Inheritance: delegates automatically inherit house in-charge volunteer', async () => {
    // 1. Create Volunteer A
    const volA: Volunteer = {
      id: 'vol-auto-a',
      name: 'സഖാവ് രാഹുൽ',
      phone: '9847111222',
      unit: 'നീലേശ്വരം സെൻട്രൽ',
    };
    mockStore.setVolunteers([volA]);

    // 2. Create House 1
    const house1: House = {
      id: 'house-auto-1',
      name: 'ശാന്തി ഭവൻ',
      address: 'വാർഡ് 5',
      host_name: 'രാഘവൻ',
      host_phone: '9447100000',
      capacity: 5,
    };
    mockStore.addHouse(house1);

    // 3. Create 2 delegates initially in house-auto-1
    const del1: Delegate = {
      id: 'del-auto-1',
      token: 'token-auto-1',
      full_name: 'അർജുൻ',
      district_id: 1,
      gender: 'boy',
      status: 'pending',
      house_id: 'house-auto-1',
    };
    const del2: Delegate = {
      id: 'del-auto-2',
      token: 'token-auto-2',
      full_name: 'മാളവിക',
      district_id: 1,
      gender: 'girl',
      status: 'pending',
      house_id: 'house-auto-1',
    };
    mockStore.importDelegates([del1, del2]);

    // Assign Volunteer A as In-Charge of House 1 -> Existing delegates in that house auto-inherit Volunteer A
    await api.assignHouseVolunteer('house-auto-1', volA);

    const houseUpdated = mockStore.getHouses().find((h) => h.id === 'house-auto-1');
    expect(houseUpdated?.volunteer_id).toBe(volA.id);
    expect(houseUpdated?.volunteer?.name).toBe(volA.name);

    let delegatesList = mockStore.getDelegates();
    expect(delegatesList.find((d) => d.id === 'del-auto-1')?.volunteer_id).toBe(volA.id);
    expect(delegatesList.find((d) => d.id === 'del-auto-2')?.volunteer_id).toBe(volA.id);

    // 4. Allot a NEW delegate (del3) to house-auto-1 -> Must automatically inherit Volunteer A
    const del3: Delegate = {
      id: 'del-auto-3',
      token: 'token-auto-3',
      full_name: 'സിദ്ധാർത്ഥ്',
      district_id: 1,
      gender: 'boy',
      status: 'pending',
    };
    mockStore.importDelegates([del3]);
    await api.assignHouse('del-auto-3', 'house-auto-1');

    delegatesList = mockStore.getDelegates();
    const updatedDel3 = delegatesList.find((d) => d.id === 'del-auto-3');
    expect(updatedDel3?.house_id).toBe('house-auto-1');
    expect(updatedDel3?.volunteer_id).toBe(volA.id);
    expect(updatedDel3?.volunteer?.name).toBe(volA.name);

    // 5. Bulk assign 2 more delegates (del4, del5) -> Must also inherit Volunteer A
    const del4: Delegate = { id: 'del-auto-4', token: 'token-auto-4', full_name: 'D4', district_id: 1, gender: 'boy', status: 'pending' };
    const del5: Delegate = { id: 'del-auto-5', token: 'token-auto-5', full_name: 'D5', district_id: 1, gender: 'girl', status: 'pending' };
    mockStore.importDelegates([del4, del5]);
    await api.bulkAssign(['del-auto-4', 'del-auto-5'], 'house-auto-1');

    delegatesList = mockStore.getDelegates();
    expect(delegatesList.find((d) => d.id === 'del-auto-4')?.volunteer_id).toBe(volA.id);
    expect(delegatesList.find((d) => d.id === 'del-auto-5')?.volunteer_id).toBe(volA.id);

    // 6. Test isDelegateAssignedToVolunteer with house in-charge match
    const housesList = mockStore.getHouses();
    const isAssigned = isDelegateAssignedToVolunteer(updatedDel3!, { id: volA.id }, housesList);
    expect(isAssigned).toBe(true);
  });

  it('Volunteer Overwrite & Removal: assigning delegate with Volunteer A to house with Volunteer B overwrites with B, and removing delegate empties volunteer', async () => {
    // 1. Setup Volunteer A and Volunteer B
    const volA: Volunteer = { id: 'vol-test-a', name: 'Volunteer A', phone: '9847111001', unit: 'Unit A' };
    const volB: Volunteer = { id: 'vol-test-b', name: 'Volunteer B', phone: '9847111002', unit: 'Unit B' };
    mockStore.setVolunteers([volA, volB]);

    // 2. Setup House 1 (with Volunteer B) and House 2 (with no volunteer initially)
    const houseB: House = {
      id: 'house-b',
      name: 'Bhavan B',
      address: 'Ward B',
      capacity: 10,
      volunteer_id: volB.id,
      volunteer: volB,
    };
    const houseEmpty: House = {
      id: 'house-empty',
      name: 'Empty Bhavan',
      address: 'Ward Empty',
      capacity: 10,
    };
    mockStore.addHouse(houseB);
    mockStore.addHouse(houseEmpty);

    // 3. Create Delegate who initially has Volunteer A assigned
    const delegateWithVolA: Delegate = {
      id: 'del-vol-overwrite-1',
      token: 'token-vol-overwrite-1',
      full_name: 'Child One',
      district_id: 1,
      gender: 'boy',
      status: 'pending',
      volunteer_id: volA.id,
      volunteer: volA,
      house_id: null,
    };
    mockStore.importDelegates([delegateWithVolA]);

    expect(mockStore.getDelegates().find((d) => d.id === 'del-vol-overwrite-1')?.volunteer_id).toBe(volA.id);

    // 4. Assign Delegate to House B (which has Volunteer B)
    // MUST OVERWRITE Volunteer A with Volunteer B
    await api.assignHouse('del-vol-overwrite-1', 'house-b');

    let del = mockStore.getDelegates().find((d) => d.id === 'del-vol-overwrite-1');
    expect(del?.house_id).toBe('house-b');
    expect(del?.volunteer_id).toBe(volB.id);
    expect(del?.volunteer?.name).toBe('Volunteer B');

    // 5. On removal of delegate from house -> Volunteer field MUST be emptied
    await api.assignHouse('del-vol-overwrite-1', null);

    del = mockStore.getDelegates().find((d) => d.id === 'del-vol-overwrite-1');
    expect(del?.house_id).toBeNull();
    expect(del?.volunteer_id).toBeNull();
    expect(del?.volunteer).toBeNull();

    // 6. Test with bulkAssign:
    // Create another delegate with Volunteer A
    const delegate2: Delegate = {
      id: 'del-vol-overwrite-2',
      token: 'token-vol-overwrite-2',
      full_name: 'Child Two',
      district_id: 1,
      gender: 'girl',
      status: 'pending',
      volunteer_id: volA.id,
      volunteer: volA,
      house_id: null,
    };
    mockStore.importDelegates([delegate2]);

    // Bulk assign to house-b -> Overwrites Volunteer A with Volunteer B
    await api.bulkAssign(['del-vol-overwrite-2'], 'house-b');
    del = mockStore.getDelegates().find((d) => d.id === 'del-vol-overwrite-2');
    expect(del?.house_id).toBe('house-b');
    expect(del?.volunteer_id).toBe(volB.id);
    expect(del?.volunteer?.name).toBe('Volunteer B');

    // Bulk remove from house -> Empties volunteer field
    await api.bulkAssign(['del-vol-overwrite-2'], null);
    del = mockStore.getDelegates().find((d) => d.id === 'del-vol-overwrite-2');
    expect(del?.house_id).toBeNull();
    expect(del?.volunteer_id).toBeNull();
    expect(del?.volunteer).toBeNull();
  });
});
