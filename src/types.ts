export type UserRole = 'admin' | 'district' | 'volunteer';

export interface StaffProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  unit?: string;
  role: UserRole;
  district_id?: number | null;
  district_name?: string;
}

export type DelegateStatus = 'pending' | 'checked_in' | 'checked_out' | 'no_show';

export interface District {
  id: number;
  name_en: string;
  name_ml: string;
}

export interface House {
  id: string;
  name: string;
  address: string;
  host_name: string;
  host_phone: string;
  capacity: number;
  gender_restriction?: 'boys' | 'girls' | 'any';
  volunteer_id?: string | null;
  volunteer?: Volunteer | null;
}

export interface VolunteerLocationPing {
  id?: string;
  volunteer_name: string;
  volunteer_phone: string;
  lat: number;
  lng: number;
  accuracy?: number;
  created_at: string;
  expires_at: string;
}

export interface Volunteer {
  id?: string;
  name: string;
  phone: string;
  unit?: string;
  active_location?: VolunteerLocationPing | null;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  districtId?: number | string;
  gender?: 'all' | 'boy' | 'girl';
  status?: string;
  unassignedOnly?: boolean;
}

export interface Delegate {
  id: string;
  token: string;
  full_name: string;
  phone?: string;
  district_id: number;
  district_en?: string;
  district_ml?: string;
  gender?: 'boy' | 'girl' | 'other';
  house_id?: string | null;
  house?: House | null;
  volunteer_id?: string | null;
  volunteer?: Volunteer | null;
  status: DelegateStatus;
  checked_in_at?: string | null;
  active_location?: LocationPing | null;
}

export interface LocationPing {
  id?: string;
  delegate_id: string;
  lat: number;
  lng: number;
  accuracy?: number;
  created_at: string;
  expires_at: string;
}

export interface Announcement {
  id: string;
  title_en: string;
  title_ml: string;
  body_en: string;
  body_ml: string;
  pinned: boolean;
  target_district_id?: number | null;
  created_at: string;
}

export interface HelplineItem {
  title_ml: string;
  title_en: string;
  phone: string;
}

export interface StayPortalData {
  delegate: Delegate;
  house?: House | null;
  volunteer?: Volunteer | null;
  announcements: Announcement[];
  helplines: HelplineItem[];
}
