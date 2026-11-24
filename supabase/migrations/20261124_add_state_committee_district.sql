-- Add State Committee (സംസ്ഥാന കമ്മിറ്റി) to districts table
INSERT INTO districts (id, name_en, name_ml) 
VALUES (15, 'State Committee', 'സംസ്ഥാന കമ്മിറ്റി')
ON CONFLICT (id) DO UPDATE 
SET name_en = EXCLUDED.name_en, name_ml = EXCLUDED.name_ml;
