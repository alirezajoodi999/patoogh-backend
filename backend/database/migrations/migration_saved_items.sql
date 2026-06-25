-- ──────────────────────────────────────────────────────────────────────────────
-- Migration: ایجاد جدول user_saved_items (ذخیره‌شده‌ها / بوک‌مارک‌ها)
-- اجرا کنید: psql -d your_database -f migration_saved_items.sql
-- ──────────────────────────────────────────────────────────────────────────────

-- جدول ذخیره‌شده‌ها
CREATE TABLE IF NOT EXISTS user_saved_items (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_item_id    UUID NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
    note             TEXT,                          -- یادداشت اختیاری کاربر
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, media_item_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_user       ON user_saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_media      ON user_saved_items(media_item_id);
CREATE INDEX IF NOT EXISTS idx_saved_created    ON user_saved_items(created_at DESC);

-- Trigger برای updated_at
CREATE TRIGGER update_saved_items_updated_at
    BEFORE UPDATE ON user_saved_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────────────────────
-- ایندکس‌های بهینه‌سازی برای جستجو و فیلتر در media_items
-- ──────────────────────────────────────────────────────────────────────────────

-- ایندکس full-text برای جستجوی عنوان و توضیحات
CREATE INDEX IF NOT EXISTS idx_media_items_title_fts
    ON media_items USING GIN (to_tsvector('simple', coalesce(title, '')));

CREATE INDEX IF NOT EXISTS idx_media_items_desc_fts
    ON media_items USING GIN (to_tsvector('simple', coalesce(description, '')));

-- ایندکس ترکیبی برای فیلترهای متداول
CREATE INDEX IF NOT EXISTS idx_media_published_type
    ON media_items(is_published, media_type_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_published_difficulty
    ON media_items(is_published, difficulty_level, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_published_language
    ON media_items(is_published, language, published_at DESC);

-- ایندکس برای مرتب‌سازی
CREATE INDEX IF NOT EXISTS idx_media_view_count
    ON media_items(is_published, view_count DESC);

CREATE INDEX IF NOT EXISTS idx_media_like_count
    ON media_items(is_published, like_count DESC);

-- تأیید
SELECT 'Migration completed successfully' AS status;
