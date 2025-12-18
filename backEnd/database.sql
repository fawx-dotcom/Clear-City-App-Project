

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (cu poză profil și locație)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  profile_image VARCHAR(500),
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports table (complet)
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_name VARCHAR(500),
  type VARCHAR(100),
  description TEXT,
  image_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  ai_classification JSONB,
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements table
CREATE TABLE user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL,
  achievement_title VARCHAR(255),
  achievement_description TEXT,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

-- Tabel pentru statistici (cache pentru performanță)
CREATE TABLE statistics (
  id SERIAL PRIMARY KEY,
  stat_key VARCHAR(100) UNIQUE NOT NULL,
  stat_value JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_location ON reports(latitude, longitude);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);

-- Insert sample data for testing
-- Password for all users: "password" (hashed with bcrypt)
INSERT INTO users (name, email, password, role, level, xp, location, latitude, longitude, profile_image) VALUES
('Alex Chen', 'alex@demo.com', '$2a$10$8XkfJGJmVQ0.qKN1qwF9LuYLHbFxM8RKVZhqkVvWxXdlH0vM.fKXS', 'user', 12, 1240, 'București, România', 44.4268, 26.1025, 'https://i.pravatar.cc/150?u=alex'),
('Maria Popescu', 'maria@demo.com', '$2a$10$8XkfJGJmVQ0.qKN1qwF9LuYLHbFxM8RKVZhqkVvWxXdlH0vM.fKXS', 'user', 8, 850, 'Cluj-Napoca, România', 46.7712, 23.6236, 'https://i.pravatar.cc/150?u=maria'),
('Ion Vasile', 'ion@demo.com', '$2a$10$8XkfJGJmVQ0.qKN1qwF9LuYLHbFxM8RKVZhqkVvWxXdlH0vM.fKXS', 'user', 5, 420, 'Timișoara, România', 45.7489, 21.2087, 'https://i.pravatar.cc/150?u=ion'),
('Admin User', 'admin@clearcity.ro', '$2a$10$8XkfJGJmVQ0.qKN1qwF9LuYLHbFxM8RKVZhqkVvWxXdlH0vM.fKXS', 'admin', 99, 9999, 'București, România', 44.4268, 26.1025, 'https://i.pravatar.cc/150?u=admin'),
('Sarah Johnson', 'sarah@demo.com', '$2a$10$8XkfJGJmVQ0.qKN1qwF9LuYLHbFxM8RKVZhqkVvWxXdlH0vM.fKXS', 'user', 15, 1680, 'Brașov, România', 45.6579, 25.6012, 'https://i.pravatar.cc/150?u=sarah'),
('Mike Turner', 'mike@demo.com', '$2a$10$8XkfJGJmVQ0.qKN1qwF9LuYLHbFxM8RKVZhqkVvWxXdlH0vM.fKXS', 'user', 14, 1550, 'Iași, România', 47.1585, 27.6014, 'https://i.pravatar.cc/150?u=mike');

INSERT INTO reports (user_id, latitude, longitude, location_name, type, description, status, ai_classification, created_at) VALUES
(1, 44.4268, 26.1025, 'Parcul Herăstrău, București', 'Plastic', 'PET-uri aruncate lângă lac. Aproximativ 20 de sticle.', 'pending', '{"isWaste": true, "wasteType": "Plastic", "confidence": 0.92}', NOW() - INTERVAL '2 hours'),
(2, 44.4350, 26.0950, 'Piața Universității, București', 'Menajer', 'Gunoi lăsat pe bancă în parc. Pungi cu resturi menajere.', 'in_progress', '{"isWaste": true, "wasteType": "General Waste", "confidence": 0.88}', NOW() - INTERVAL '4 hours'),
(3, 44.4200, 26.1100, 'Parcul Carol, București', 'Sticlă', 'Cioburi pe aleea principală. Pericol pentru pietoni.', 'pending', '{"isWaste": true, "wasteType": "Glass", "confidence": 0.95}', NOW() - INTERVAL '5 hours'),
(3, 44.4400, 26.0800, 'Șoseaua Kiseleff, București', 'Metal', 'Fier vechi abandonat lângă stație autobuz.', 'resolved', '{"isWaste": true, "wasteType": "Metal", "confidence": 0.87}', NOW() - INTERVAL '1 day'),
(1, 44.4150, 26.1200, 'Parcul Tineretului, București', 'Hârtie', 'Cartoane depozitate ilegal lângă intrare.', 'resolved', '{"isWaste": true, "wasteType": "Paper", "confidence": 0.91}', NOW() - INTERVAL '2 days'),
(5, 44.4300, 26.1050, 'Piața Romană, București', 'Plastic', 'Saci de plastic aruncați în parc.', 'pending', '{"isWaste": true, "wasteType": "Plastic", "confidence": 0.89}', NOW() - INTERVAL '3 hours'),
(6, 44.4450, 26.0900, 'Parcul Cișmigiu, București', 'Menajer', 'Resturi de fast-food pe bancă.', 'in_progress', '{"isWaste": true, "wasteType": "General Waste", "confidence": 0.85}', NOW() - INTERVAL '6 hours'),
(2, 44.4180, 26.1150, 'Bulevardul Unirii, București', 'Sticlă', 'Sticle sparte pe trotuar.', 'resolved', '{"isWaste": true, "wasteType": "Glass", "confidence": 0.93}', NOW() - INTERVAL '3 days');

INSERT INTO user_achievements (user_id, achievement_id, achievement_title, achievement_description) VALUES
(1, 1, 'Primul Pas', 'Trimite prima ta sesizare'),
(1, 2, 'Patriot Ecologist', 'Reciclează 10kg de deșeuri'),
(2, 1, 'Primul Pas', 'Trimite prima ta sesizare'),
(3, 1, 'Primul Pas', 'Trimite prima ta sesizare'),
(5, 1, 'Primul Pas', 'Trimite prima ta sesizare'),
(5, 2, 'Patriot Ecologist', 'Reciclează 10kg de deșeuri'),
(5, 3, 'Ochi de Vultur', 'Trimite 5 sesizări cu poză'),
(6, 1, 'Primul Pas', 'Trimite prima ta sesizare'),
(6, 2, 'Patriot Ecologist', 'Reciclează 10kg de deșeuri');

-- Funcții pentru update automat
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pentru users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pentru reports
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funcție pentru calculare nivel bazat pe XP
CREATE OR REPLACE FUNCTION calculate_level(xp_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(SQRT(xp_points / 100)) + 1;
END;
$$ LANGUAGE plpgsql;

-- Trigger pentru auto-update nivel când se schimbă XP
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level = calculate_level(NEW.xp);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_level_on_xp_change BEFORE UPDATE OF xp ON users
FOR EACH ROW EXECUTE FUNCTION update_user_level();

-- View pentru statistici rapide
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.level,
    u.xp,
    u.role,
    COUNT(r.id) as total_reports,
    COUNT(CASE WHEN r.status = 'resolved' THEN 1 END) as resolved_reports,
    COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_reports,
    COUNT(CASE WHEN r.status = 'in_progress' THEN 1 END) as in_progress_reports
FROM users u
LEFT JOIN reports r ON u.id = r.user_id
GROUP BY u.id, u.name, u.email, u.level, u.xp, u.role;

-- View pentru leaderboard
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    u.id,
    u.name,
    u.profile_image,
    u.level,
    u.xp,
    COUNT(r.id) as report_count,
    COUNT(CASE WHEN r.status = 'resolved' THEN 1 END) as resolved_count,
    u.location
FROM users u
LEFT JOIN reports r ON u.id = r.user_id
WHERE u.role = 'user'
GROUP BY u.id, u.name, u.profile_image, u.level, u.xp, u.location
ORDER BY u.xp DESC
LIMIT 10;