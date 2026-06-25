-- Seed Data: 8 نوع رسانه
INSERT INTO media_types (id, name, name_en, description, icon, color, display_order, is_active) VALUES
(uuid_generate_v4(), 'رسانه‌های چاپی', 'Print Media', 'کتاب، مجله، بروشور، پوستر', 'book', '#6366F1', 1, true),
(uuid_generate_v4(), 'رسانه‌های تصویری', 'Visual Media', 'ویدیو، انیمیشن، اینفوگرافیک', 'videocam', '#EC4899', 2, true),
(uuid_generate_v4(), 'رسانه‌های دیجیتال', 'Digital Media', 'وب‌سایت، اپلیکیشن، پلتفرم آنلاین', 'laptop', '#3B82F6', 3, true),
(uuid_generate_v4(), 'رسانه‌های تعاملی', 'Interactive Media', 'بازی، شبیه‌ساز، واقعیت مجازی', 'game-controller', '#10B981', 4, true),
(uuid_generate_v4(), 'رسانه‌های حضوری', 'In-Person Media', 'کارگاه، سمینار، دوره آموزشی', 'people-circle', '#F59E0B', 5, true),
(uuid_generate_v4(), 'رسانه‌های اجتماعی', 'Social Media', 'شبکه‌های اجتماعی، انجمن‌ها، گروه‌ها', 'share-social', '#8B5CF6', 6, true),
(uuid_generate_v4(), 'رسانه‌های محیطی', 'Environmental Media', 'بیلبورد، تابلو، نمایشگر محیطی', 'tv', '#06B6D4', 7, true),
(uuid_generate_v4(), 'رسانه‌های شخصی', 'Personal Media', 'مربیگری، منتورینگ، مشاوره فردی', 'person-circle', '#EF4444', 8, true);
