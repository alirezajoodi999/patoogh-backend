-- Seed Data: نمونه محتوا
DO $$
DECLARE
    competency_change_id UUID;
    competency_leadership_id UUID;
    media_digital_id UUID;
    media_visual_id UUID;
    admin_user_id UUID;
    source_internal_id UUID;
BEGIN
    -- Get IDs
    SELECT id INTO competency_change_id FROM competencies WHERE name_en = 'Change Management' LIMIT 1;
    SELECT id INTO competency_leadership_id FROM competencies WHERE name_en = 'People Leadership' LIMIT 1;
    SELECT id INTO media_digital_id FROM media_types WHERE name_en = 'Digital Media' LIMIT 1;
    SELECT id INTO media_visual_id FROM media_types WHERE name_en = 'Visual Media' LIMIT 1;
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
    SELECT id INTO source_internal_id FROM content_sources WHERE name_en = 'Internal Experts' LIMIT 1;

    -- Insert sample content
    INSERT INTO contents (id, title, description, file_url, duration_minutes, difficulty_level, tags, media_type_id, content_source_id, created_by, is_published, published_at)
    VALUES
    (uuid_generate_v4(), 'مبانی مدیریت تغییر در سازمان', 'دوره جامع آموزش مدیریت تغییر برای مدیران میانی', 'https://example.com/change-management-101.mp4', 45, 'beginner', ARRAY['مدیریت', 'تغییر', 'رهبری'], media_visual_id, source_internal_id, admin_user_id, true, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'رهبری مؤثر تیم', 'تکنیک‌های عملی برای هدایت و انگیزش اعضای تیم', 'https://example.com/team-leadership.pdf', 30, 'intermediate', ARRAY['رهبری', 'تیم', 'انگیزش'], media_digital_id, source_internal_id, admin_user_id, true, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'تصمیم‌گیری استراتژیک', 'چارچوب‌های تصمیم‌گیری در شرایط عدم قطعیت', 'https://example.com/strategic-decisions.mp4', 60, 'advanced', ARRAY['استراتژی', 'تصمیم‌گیری'], media_visual_id, source_internal_id, admin_user_id, true, CURRENT_TIMESTAMP);
END $$;
