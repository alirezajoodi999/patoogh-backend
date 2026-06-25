-- Seed Data: 7 محور شایستگی
INSERT INTO competencies (id, name, name_en, description, icon, color, display_order, is_active) VALUES
(uuid_generate_v4(), 'مدیریت تغییر', 'Change Management', 'توانایی مدیریت و هدایت تغییرات سازمانی و فردی', 'change-circle', '#3B82F6', 1, true),
(uuid_generate_v4(), 'هدایت افراد', 'People Leadership', 'مهارت رهبری، انگیزش و توسعه افراد', 'people', '#10B981', 2, true),
(uuid_generate_v4(), 'تصمیم‌گیری و تدابیر اجرایی', 'Decision Making & Execution', 'توانایی تصمیم‌گیری مؤثر و اجرای برنامه‌ها', 'checkmark-done', '#8B5CF6', 3, true),
(uuid_generate_v4(), 'پویایی ذهنی', 'Mental Agility', 'انعطاف‌پذیری فکری و حل مسئله خلاقانه', 'bulb', '#F59E0B', 4, true),
(uuid_generate_v4(), 'قابلیت‌های فردی', 'Personal Capabilities', 'مهارت‌های فردی و توسعه شخصی', 'person', '#EF4444', 5, true),
(uuid_generate_v4(), 'تعامل‌جویی', 'Collaboration', 'توانایی کار تیمی و ایجاد ارتباطات مؤثر', 'people-circle', '#06B6D4', 6, true),
(uuid_generate_v4(), 'مشتری‌مداری', 'Customer Centricity', 'تمرکز بر نیازها و رضایت مشتری', 'heart', '#EC4899', 7, true);
