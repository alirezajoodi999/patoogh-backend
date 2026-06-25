-- ============================================
-- PATOOGH PLATFORM - DATABASE SCHEMA
-- PostgreSQL 14+
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

-- نقش‌های سیستم بر اساس مستندات پاتوق:
-- 'manager'  → مدیران سازمان (کاربران اصلی پلتفرم)
-- 'hr_admin' → ادمین آموزش و توسعه (مدیریت محتوا، شایستگی‌ها، گزارش‌ها)
-- 'admin'    → ادمین فنی (مدیریت کامل سیستم)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'manager'
        CHECK (role IN ('admin', 'hr_admin', 'manager')),
    department VARCHAR(255),
    position VARCHAR(255),
    avatar_url VARCHAR(1000),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP,
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- ============================================
-- 2. COMPETENCIES (7 محور شایستگی)
-- ============================================

CREATE TABLE competencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fa VARCHAR(255) NOT NULL UNIQUE,
    name_en VARCHAR(255),
    description TEXT,
    icon VARCHAR(255),
    color VARCHAR(50),
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_competencies_active ON competencies(is_active);
CREATE INDEX idx_competencies_order ON competencies(display_order);

-- ============================================
-- 3. MEDIA TYPES (8 نوع رسانه)
-- ============================================

CREATE TABLE media_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fa VARCHAR(255) NOT NULL UNIQUE,
    name_en VARCHAR(255),
    description TEXT,
    icon VARCHAR(255),
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_types_active ON media_types(is_active);

-- ============================================
-- 4. CONTENT SOURCES (منابع محتوا)
-- ============================================

CREATE TABLE content_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type VARCHAR(100) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_external BOOLEAN DEFAULT false,
    contact_info JSONB,
    website_url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_sources_type ON content_sources(source_type);

-- ============================================
-- 5. MEDIA ITEMS / CONTENT (بانک محتوا)
-- ============================================

CREATE TABLE media_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    media_type_id UUID REFERENCES media_types(id) ON DELETE SET NULL,
    content_source_id UUID REFERENCES content_sources(id) ON DELETE SET NULL,
    file_url VARCHAR(1000),
    file_type VARCHAR(100),
    file_size BIGINT,
    duration INTEGER,
    thumbnail_url VARCHAR(1000),
    language VARCHAR(10) DEFAULT 'fa',
    difficulty_level VARCHAR(50),
    tags TEXT[],
    metadata JSONB,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_items_type ON media_items(media_type_id);
CREATE INDEX idx_media_items_published ON media_items(is_published);
CREATE INDEX idx_media_items_tags ON media_items USING GIN(tags);
CREATE INDEX idx_media_items_created_by ON media_items(created_by);

-- ============================================
-- 6. COMPETENCY-MEDIA MAPPING
-- ============================================

CREATE TABLE competency_media_map (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competency_id UUID REFERENCES competencies(id) ON DELETE CASCADE,
    media_item_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    -- وزن اثرگذاری محتوا بر شایستگی (1 تا 5) - بر اساس مستندات پاتوق صفحه 11
    weight INTEGER DEFAULT 1 CHECK (weight >= 1 AND weight <= 5),
    relevance_score DECIMAL(3,2) DEFAULT 1.0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(competency_id, media_item_id)
);

CREATE INDEX idx_comp_media_competency ON competency_media_map(competency_id);
CREATE INDEX idx_comp_media_item ON competency_media_map(media_item_id);

-- ============================================
-- 7. EVALUATION CRITERIA (معیارهای ارزیابی)
-- ============================================

CREATE TABLE evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fa VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description TEXT,
    weight DECIMAL(3,2) DEFAULT 1.0,
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. CONTENT EVALUATIONS (ارزیابی محتوا)
-- ============================================

CREATE TABLE content_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_item_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    criterion_id UUID REFERENCES evaluation_criteria(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_evaluations_media ON content_evaluations(media_item_id);
CREATE INDEX idx_evaluations_user ON content_evaluations(user_id);

-- ============================================
-- 9. USER PROGRESS (پیشرفت کاربران)
-- ============================================

CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    media_item_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    competency_id UUID REFERENCES competencies(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'not_started',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    time_spent INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    last_accessed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, media_item_id)
);

CREATE INDEX idx_progress_user ON user_progress(user_id);
CREATE INDEX idx_progress_media ON user_progress(media_item_id);
CREATE INDEX idx_progress_status ON user_progress(status);

-- ============================================
-- 10. REMINDERS (یادآورها)
-- ============================================

CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    media_item_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL,
    reminder_date TIMESTAMP NOT NULL,
    message TEXT,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminders_user ON reminders(user_id);
CREATE INDEX idx_reminders_date ON reminders(reminder_date);
CREATE INDEX idx_reminders_sent ON reminders(is_sent);

-- ============================================
-- 11. NOTIFICATIONS (اعلان‌ها)
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT,
    link_url VARCHAR(1000),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- 12. CONTENT SUGGESTIONS (پیشنهادات محتوا)
-- ============================================

CREATE TABLE content_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    suggested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    suggested_media_type_id UUID REFERENCES media_types(id) ON DELETE SET NULL,
    suggested_competency_id UUID REFERENCES competencies(id) ON DELETE SET NULL,
    external_url VARCHAR(1000),
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suggestions_user ON content_suggestions(user_id);
CREATE INDEX idx_suggestions_status ON content_suggestions(status);

-- ============================================
-- 13. USER FAVORITES (علاقه‌مندی‌ها)
-- ============================================

CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    media_item_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, media_item_id)
);

CREATE INDEX idx_favorites_user ON user_favorites(user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competencies_updated_at BEFORE UPDATE ON competencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_types_updated_at BEFORE UPDATE ON media_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_sources_updated_at BEFORE UPDATE ON content_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_items_updated_at BEFORE UPDATE ON media_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_evaluations_updated_at BEFORE UPDATE ON content_evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_suggestions_updated_at BEFORE UPDATE ON content_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================
-- PATOOGH PLATFORM - DATABASE SCHEMA
-- PostgreSQL 14+
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'manager'
        CHECK (role IN ('admin', 'hr_admin', 'manager')),
    department VARCHAR(255),
    position VARCHAR(255),
    avatar_url VARCHAR(1000),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP,
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- ============================================
-- 2. COMPETENCIES (7 محور شایستگی)
-- ============================================

CREATE TABLE competencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fa VARCHAR(255) NOT NULL UNIQUE,
    name_en VARCHAR(255),
    description TEXT,
    icon VARCHAR(255),
    color VARCHAR(50),
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_competencies_active ON competencies(is_active);
CREATE INDEX idx_competencies_order ON competencies(display_order);

-- ============================================
-- 3. MEDIA TYPES (8 نوع رسانه)
-- ============================================

CREATE TABLE media_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fa VARCHAR(255) NOT NULL UNIQUE,
    name_en VARCHAR(255),
    description TEXT,
    icon VARCHAR(255),
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_types_active ON media_types(is_active);

-- ============================================
-- 4. CONTENT SOURCES (منابع محتوا)
-- ============================================

CREATE TABLE content_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type VARCHAR(100) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_external BOOLEAN DEFAULT false,
    contact_info JSONB,
    website_url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_sources_type ON content_sources(source_type);

-- ============================================
-- 5. MEDIA ITEMS / CONTENT (بانک محتوا)
-- ============================================

CREATE TABLE media_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    media_type_id UUID REFERENCES media_types(id) ON DELETE SET NULL,
    content_source_id UUID REFERENCES content_sources(id) ON DELETE SET NULL,
    file_url VARCHAR(1000),
    file_type VARCHAR(100),
    file_size BIGINT,
    duration INTEGER,
    thumbnail_url VARCHAR(1000),
    language VARCHAR(10) DEFAULT 'fa',
    difficulty_level VARCHAR(50),
    tags TEXT[],
    metadata JSONB,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_items_type ON media_items(media_type_id);
CREATE INDEX idx_media_items_published ON media_items(is_published);
CREATE INDEX idx_media_items_tags ON media_items USING GIN(tags);
CREATE INDEX idx_media_items_created_by ON media_items(created_by);

-- ============================================
-- 6. COMPETENCY-MEDIA MAPPING
-- ============================================

CREATE TABLE competency_media_map (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competency_id UUID REFERENCES competencies(id) ON DELETE CASCADE,
    media_item_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    -- وزن اثرگذاری محتوا بر شایستگی (1 تا 5) - بر اساس مستندات پاتوق صفحه 11
    weight INTEGER DEFAULT 1 CHECK (weight >= 1 AND weight <= 5),
    relevance_score DECIMAL(3,2) DEFAULT 1.0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(competency_id, media_item_id)
);

CREATE INDEX idx_comp_media_competency ON competency_media_map(competency_id);
CREATE INDEX idx_comp_media_item ON competency_media_map(media_item_id);

-- ============================================
-- 7. EVALUATION CRITERIA (معیارهای ارزیابی)
-- ============================================

CREATE TABLE evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fa VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description TEXT,
    weight DECIMAL(3,2) DEFAULT 1.0,
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. CONTENT EVALUATIONS (ارزیابی محتوا)
-- ============================================

CREATE TABLE content_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_item_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    criterion_id UUID REFERENCES evaluation_criteria(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_evaluations_media ON content_evaluations(media_item_id);
CREATE INDEX idx_evaluations_user ON content_evaluations(user_id);

-- ============================================
-- 9. USER PROGRESS (پیشرفت کاربران)
-- ============================================

CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    media_item_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    competency_id UUID REFERENCES competencies(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'not_started',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    time_spent INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    last_accessed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, media_item_id)
);

CREATE INDEX idx_progress_user ON user_progress(user_id);
CREATE INDEX idx_progress_media ON user_progress(media_item_id);
CREATE INDEX idx_progress_status ON user_progress(status);

-- ============================================
-- 10. REMINDERS (یادآورها)
-- ============================================

CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    media_item_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL,
    reminder_date TIMESTAMP NOT NULL,
    message TEXT,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminders_user ON reminders(user_id);
CREATE INDEX idx_reminders_date ON reminders(reminder_date);
CREATE INDEX idx_reminders_sent ON reminders(is_sent);

-- ============================================
-- 11. NOTIFICATIONS (اعلان‌ها)
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT,
    link_url VARCHAR(1000),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- 12. CONTENT SUGGESTIONS (پیشنهادات محتوا)
-- ============================================

CREATE TABLE content_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    suggested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    suggested_media_type_id UUID REFERENCES media_types(id) ON DELETE SET NULL,
    suggested_competency_id UUID REFERENCES competencies(id) ON DELETE SET NULL,
    external_url VARCHAR(1000),
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suggestions_user ON content_suggestions(user_id);
CREATE INDEX idx_suggestions_status ON content_suggestions(status);

-- ============================================
-- 13. USER FAVORITES (علاقه‌مندی‌ها)
-- ============================================

CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    media_item_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, media_item_id)
);

CREATE INDEX idx_favorites_user ON user_favorites(user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competencies_updated_at BEFORE UPDATE ON competencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_types_updated_at BEFORE UPDATE ON media_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_sources_updated_at BEFORE UPDATE ON content_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_items_updated_at BEFORE UPDATE ON media_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_evaluations_updated_at BEFORE UPDATE ON content_evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_suggestions_updated_at BEFORE UPDATE ON content_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
