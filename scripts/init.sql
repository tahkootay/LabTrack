-- Создание дефолтного пользователя для v1
INSERT INTO users (id, email, is_active, created_at) 
VALUES (1, null, true, now()) 
ON CONFLICT (id) DO NOTHING;

-- Базовые аналиты для примера
INSERT INTO analytes (code, name, default_unit, reference_ranges) VALUES 
('glucose', 'Глюкоза', 'ммоль/л', '{"normal": {"min": 3.9, "max": 5.5}}'),
('hemoglobin', 'Гемоглобин', 'г/л', '{"male": {"min": 130, "max": 160}, "female": {"min": 120, "max": 150}}'),
('cholesterol', 'Холестерин общий', 'ммоль/л', '{"normal": {"max": 5.2}}'),
('creatinine', 'Креатинин', 'мкмоль/л', '{"male": {"min": 62, "max": 115}, "female": {"min": 53, "max": 97}}')
ON CONFLICT (code) DO NOTHING;