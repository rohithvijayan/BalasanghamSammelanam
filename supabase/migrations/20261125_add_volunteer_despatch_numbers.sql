-- Update official helplines to include Volunteer Despatch numbers
-- Balasangham State Conference (ബാലസംഘം സംസ്ഥാന സമ്മേളനം)

UPDATE app_settings
SET value = '[
  {"title_ml": "കൺട്രോൾ റൂം 1 (24/7)", "title_en": "Control Room 1 (24/7)", "phone": "9400945049"},
  {"title_ml": "കൺട്രോൾ റൂം 2 (24/7)", "title_en": "Control Room 2 (24/7)", "phone": "7012768605"},
  {"title_ml": "കൺട്രോൾ റൂം 3 (24/7)", "title_en": "Control Room 3 (24/7)", "phone": "7902619430"},
  {"title_ml": "കൺട്രോൾ റൂം 4 (24/7)", "title_en": "Control Room 4 (24/7)", "phone": "9846738223"},
  {"title_ml": "വളണ്ടിയർ ഡെസ്പാച്ച് 1", "title_en": "Volunteer Despatch 1", "phone": "9846307261"},
  {"title_ml": "വളണ്ടിയർ ഡെസ്പാച്ച് 2", "title_en": "Volunteer Despatch 2", "phone": "9048982088"},
  {"title_ml": "മെഡിക്കൽ എമർജൻസി (24/7)", "title_en": "Medical Emergency (24/7)", "phone": "8281833858"}
]'::jsonb
WHERE key = 'helplines';
