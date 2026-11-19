-- =====================================================================
-- Seed Data for Balasangham Sammelanam
-- =====================================================================

-- 1. Districts (14 Kerala Districts)
INSERT INTO districts (id, name_en, name_ml) VALUES
(1, 'Kasaragod', 'കാസർഗോഡ്'),
(2, 'Kannur', 'കണ്ണൂർ'),
(3, 'Wayanad', 'വയനാട്'),
(4, 'Kozhikode', 'കോഴിക്കോട്'),
(5, 'Malappuram', 'മലപ്പുറം'),
(6, 'Palakkad', 'പാലക്കാട്'),
(7, 'Thrissur', 'തൃശ്ശൂർ'),
(8, 'Ernakulam', 'എറണാകുളം'),
(9, 'Idukki', 'ഇടുക്കി'),
(10, 'Kottayam', 'കോട്ടയം'),
(11, 'Alappuzha', 'ആലപ്പുഴ'),
(12, 'Pathanamthitta', 'പത്തനംതിട്ട'),
(13, 'Kollam', 'കൊല്ലം'),
(14, 'Thiruvananthapuram', 'തിരുവനന്തപുരം')
ON CONFLICT (id) DO UPDATE SET name_en = EXCLUDED.name_en, name_ml = EXCLUDED.name_ml;

-- 2. App Settings (Helplines, event name)
INSERT INTO app_settings (key, value) VALUES
('helplines', '[
    {"title_ml": "കൺട്രോൾ റൂം (24/7)", "title_en": "Control Room", "phone": "04985201201"},
    {"title_ml": "മെഡിക്കൽ എയ്ഡ്", "title_en": "Medical Helpline", "phone": "9400011223"},
    {"title_ml": "റെസ്ക്യൂ & സുരക്ഷ", "title_en": "Emergency & SOS Desk", "phone": "9447123456"}
]'::jsonb),
('event_info', '{
    "name_ml": "ബാലസംഘം 16-ാമത് സംസ്ഥാന സമ്മേളനം",
    "name_en": "Balasangham 16th State Conference",
    "location_ml": "പയ്യന്നൂർ, കണ്ണൂർ",
    "location_en": "Payyanur, Kannur",
    "venue_map_url": "https://maps.google.com/?q=Payyanur+Town+Hall"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Houses (Host homes)
INSERT INTO houses (id, name, address, map_url, lat, lng, host_name, host_phone, capacity, gender_restriction, notes) VALUES
('b1111111-1111-1111-1111-111111111111', 'പൂന്തോട്ടം വീട് (Poonthottam House)', 'വാർഡ് 4, പയ്യന്നൂർ നഗരസഭ, റെയിൽവേ സ്റ്റേഷൻ റോഡ്, കണ്ണൂർ', 'https://www.google.com/maps/search/?api=1&query=12.0984,75.2045', 12.0984, 75.2045, 'കെ. രാഘവൻ', '+91 94471 23456', 4, 'boys', 'റെയിൽവേ സ്റ്റേഷനിൽ നിന്ന് 500 മീറ്റർ. ഗ്രൗണ്ട് ഫ്ലോർ മുറി.'),
('b2222222-2222-2222-2222-222222222222', 'സൗപർണിക (Souparnika)', 'വാർഡ് 2, കോളേജ് റോഡ്, പയ്യന്നൂർ', 'https://www.google.com/maps/search/?api=1&query=12.1020,75.2100', 12.1020, 75.2100, 'പ്രൊഫ. സുജാത എം.', '+91 98462 89001', 6, 'girls', 'കോളേജ് ജംഗ്ഷന് സമീപം. വിശാലമായ ഹാൾ.'),
('b3333333-3333-3333-3333-333333333333', 'മംഗല്യ നിലയം (Mangalya Nilayam)', 'വാർഡ് 6, പഴയ ബസ് സ്റ്റാൻഡ്, പയ്യന്നൂർ', 'https://www.google.com/maps/search/?api=1&query=12.0950,75.2000', 12.0950, 75.2000, 'പി. വി. ബാലകൃഷ്ണൻ', '+91 97455 33012', 5, 'boys', 'ടൗൺ ഹാളിന് 5 മിനിറ്റ് നടത്തം.')
ON CONFLICT (id) DO NOTHING;

-- 4. Sample Delegates
INSERT INTO delegates (id, token, full_name, phone, district_id, gender, emergency_name, emergency_phone, house_id, status) VALUES
('d1111111-1111-1111-1111-111111111111', 'kannur-arjun-412', 'അർജുൻ കെ. (Arjun K.)', '+91 98470 11223', 2, 'boy', 'സുരേഷ് കെ. (അച്ഛൻ)', '+91 94460 21990', 'b1111111-1111-1111-1111-111111111111', 'checked_in'),
('d2222222-2222-2222-2222-222222222222', 'palakkad-adarsh-512', 'ആദർശ് എം. (Adarsh M.)', '+91 98471 11029', 6, 'boy', 'മോഹനൻ എം. (അച്ഛൻ)', '+91 94460 21991', NULL, 'pending'),
('d3333333-3333-3333-3333-333333333333', 'malappuram-fathima-204', 'ഫാത്തിമ ഷെറിൻ (Fathima Sherin)', '+91 94002 81109', 5, 'girl', 'അബ്ദുൽ റഹ്മാൻ (രക്ഷാകർത്താവ്)', '+91 98461 44556', 'b2222222-2222-2222-2222-222222222222', 'checked_in')
ON CONFLICT (token) DO NOTHING;

-- 5. Announcements
INSERT INTO announcements (title_en, title_ml, body_en, body_ml, pinned) VALUES
('Cultural Conference at 5:30 PM', 'സാംസ്കാരിക സമ്മേളനം 5:30-ന്', 'The evening cultural session begins at 5:30 PM sharp in the Main Auditorium.', 'വൈകുന്നേരത്തെ സാംസ്കാരിക സമ്മേളനം കൃത്യം 5:30-ന് മുഖ്യവേദിയിൽ ആരംഭിക്കും. എല്ലാ പ്രതിനിധികളും 5:15-ഓടെ എത്തിച്ചേരുക.', true),
('Special Dining Arrangements', 'ഭക്ഷണശാല അറിയിപ്പ്', 'Lunch is available at Dining Hall B from 1:00 PM to 2:30 PM.', 'ഉച്ചഭക്ഷണം ഉച്ചയ്ക്ക് 1:00 മുതൽ 2:30 വരെ ഹാൾ B-യിൽ ലഭ്യമാണ്. ബാഡ്ജ് നിർബന്ധമായും കാണിക്കുക.', false);
