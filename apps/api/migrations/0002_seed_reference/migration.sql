-- Données de référence initiales (idempotent). RDC active ; autres pays préparés mais inactifs.

INSERT INTO currencies(code,name,symbol,minor_unit) VALUES ('CDF','Franc congolais','FC',2),('USD','Dollar américain','$',2),('RWF','Franc rwandais','FRw',0),('UGX','Shilling ougandais','USh',0),('BIF','Franc burundais','FBu',0),('KES','Shilling kényan','KSh',2) ON CONFLICT DO NOTHING;

INSERT INTO countries(code,name,phone_prefix,active) VALUES ('CD','République démocratique du Congo','+243',TRUE),('RW','Rwanda','+250',FALSE),('UG','Ouganda','+256',FALSE),('BI','Burundi','+257',FALSE),('KE','Kenya','+254',FALSE) ON CONFLICT DO NOTHING;

INSERT INTO country_currencies(country_code,currency_code,is_default) VALUES ('CD','CDF',TRUE),('CD','USD',FALSE),('RW','RWF',TRUE),('UG','UGX',TRUE),('BI','BIF',TRUE),('KE','KES',TRUE) ON CONFLICT DO NOTHING;

INSERT INTO regions(id,country_code,name,slug) VALUES ('0006D00000C9BGBXJ8W04MF7N0','CD','Sud-Kivu','sud-kivu') ON CONFLICT DO NOTHING;
INSERT INTO cities(id,region_id,name,slug) SELECT '0006D00000V5CRMSAHWSBXCR11', id, 'Bukavu', 'bukavu' FROM regions WHERE country_code='CD' AND slug='sud-kivu' ON CONFLICT DO NOTHING;
INSERT INTO cities(id,region_id,name,slug) SELECT '0006D00000HKEBTS71FYZE2XKS', id, 'Uvira', 'uvira' FROM regions WHERE country_code='CD' AND slug='sud-kivu' ON CONFLICT DO NOTHING;
INSERT INTO cities(id,region_id,name,slug) SELECT '0006D00000NHB6F5P5KZH0GQTW', id, 'Baraka', 'baraka' FROM regions WHERE country_code='CD' AND slug='sud-kivu' ON CONFLICT DO NOTHING;
INSERT INTO regions(id,country_code,name,slug) VALUES ('0006D00000JER1VG3M93FJM3QY','CD','Nord-Kivu','nord-kivu') ON CONFLICT DO NOTHING;
INSERT INTO cities(id,region_id,name,slug) SELECT '0006D00000MKN695WRYSWZPADN', id, 'Goma', 'goma' FROM regions WHERE country_code='CD' AND slug='nord-kivu' ON CONFLICT DO NOTHING;
INSERT INTO departments(id,slug,name,sort) VALUES ('0006D00000XKA4SXRQ79KFMG3M','electronique','Électronique',0) ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D00000HYA9D88J4JASKZGS', id, 'smartphone', 'Smartphone', 0 FROM departments WHERE slug='electronique' ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D00000CVNCQPEXQHY22VAJ', id, 'tablette', 'Tablette', 1 FROM departments WHERE slug='electronique' ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D00000V1SD755A4MQG9VVK', id, 'ordinateur', 'Ordinateur', 2 FROM departments WHERE slug='electronique' ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D00000JXE14WYBNV470PXA', id, 'television', 'Télévision', 3 FROM departments WHERE slug='electronique' ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D0000055H65638YJZSSCV4', id, 'audio', 'Audio', 4 FROM departments WHERE slug='electronique' ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D00000ET2JTDA95034QR4P', id, 'appareil-photo', 'Appareil photo', 5 FROM departments WHERE slug='electronique' ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D00000X4PMWSZ0D50PKN4B', id, 'montre-connectee', 'Montre connectée', 6 FROM departments WHERE slug='electronique' ON CONFLICT DO NOTHING;
INSERT INTO departments(id,slug,name,sort) VALUES ('0006D00000D3XEZVH37WN1X7X7','vetements','Vêtements',1) ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D000004YP63134FS51K497', id, 'robes', 'Robes', 0 FROM departments WHERE slug='vetements' ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D00000P856D1T8J4XV312E', id, 'chemises', 'Chemises', 1 FROM departments WHERE slug='vetements' ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D000007W9QWSFE96SYYCRK', id, 'pantalons', 'Pantalons', 2 FROM departments WHERE slug='vetements' ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D000008RT4CMFPWVTYJE7G', id, 'chaussures', 'Chaussures', 3 FROM departments WHERE slug='vetements' ON CONFLICT DO NOTHING;
INSERT INTO departments(id,slug,name,sort) VALUES ('0006D000000TZEHE8B7YVA34BY','construction','Construction',2) ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D00000Y6JM1S66AE1MPQBV', id, 'ciment', 'Ciment', 0 FROM departments WHERE slug='construction' ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D00000WZGSKC8N1DET3WT3', id, 'fer-a-beton', 'Fer à béton', 1 FROM departments WHERE slug='construction' ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D00000123QR33TM03C0CMM', id, 'carrelage', 'Carrelage', 2 FROM departments WHERE slug='construction' ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D00000YHR1FP8MYAHR706V', id, 'peinture', 'Peinture', 3 FROM departments WHERE slug='construction' ON CONFLICT DO NOTHING;
INSERT INTO departments(id,slug,name,sort) VALUES ('0006D00000RN4131THED24WVY8','imprimantes','Imprimantes',3) ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D0000020BZAXNK3RS0FN0G', id, 'imprimante-laser', 'Imprimante Laser', 0 FROM departments WHERE slug='imprimantes' ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D000002SBT0M34JRSPF8G8', id, 'imprimante-jet-d-encre', 'Imprimante Jet d''encre', 1 FROM departments WHERE slug='imprimantes' ON CONFLICT DO NOTHING;
INSERT INTO categories(id,department_id,slug,name,sort) SELECT '0006D00000GNWR72EVVH5HY6XQ', id, 'multifonction', 'Multifonction', 2 FROM departments WHERE slug='imprimantes' ON CONFLICT DO NOTHING;
