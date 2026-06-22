-- database/schema.sql
-- HSK Learning App - PostgreSQL Schema

-- ===== USERS TABLE =====
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  google_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== LESSONS TABLE =====
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  level INT NOT NULL, -- HSK 1, 2, 3...
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  image_url VARCHAR(255),
  order_num INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(level, order_num)
);

-- ===== VOCABULARY TABLE =====
CREATE TABLE IF NOT EXISTS vocabulary (
  id SERIAL PRIMARY KEY,
  lesson_id INT NOT NULL,
  hanzi VARCHAR(100) NOT NULL,
  pinyin VARCHAR(100) NOT NULL,
  meaning VARCHAR(255) NOT NULL,
  audio_url VARCHAR(255),
  example_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- ===== USER PROGRESS TABLE =====
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  lesson_id INT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  score INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE(user_id, lesson_id)
);

-- ===== TESTS TABLE =====
CREATE TABLE IF NOT EXISTS tests (
  id SERIAL PRIMARY KEY,
  lesson_id INT NOT NULL,
  title VARCHAR(255),
  questions JSONB NOT NULL, -- Store questions as JSON
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- ===== TEST RESULTS TABLE =====
CREATE TABLE IF NOT EXISTS test_results (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  test_id INT NOT NULL,
  answers JSONB NOT NULL,
  score INT NOT NULL,
  passed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

-- ===== AUDIO ANALYSIS TABLE =====
CREATE TABLE IF NOT EXISTS audio_analysis (
  id SERIAL PRIMARY KEY,
  user_id INT,
  pinyin VARCHAR(100),
  accuracy INT,
  tone_feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== INDEXES FOR PERFORMANCE =====
CREATE INDEX idx_vocabulary_lesson_id ON vocabulary(lesson_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_lesson_id ON user_progress(lesson_id);
CREATE INDEX idx_test_results_user_id ON test_results(user_id);
CREATE INDEX idx_lessons_level ON lessons(level);

-- ===== SEED DATA - HSK 1 BÀI 1 =====
INSERT INTO lessons (level, title, description, order_num) VALUES
  (1, 'Bài 1: Số và Lời chào', 'Học số từ 1-10 và những lời chào cơ bản', 1),
  (1, 'Bài 2: Gia đình', 'Từ vựng về thành viên gia đình', 2),
  (1, 'Bài 3: Mua sắm', 'Từ vựng mua sắm hàng ngày', 3);

-- Vocabulary for Bài 1
INSERT INTO vocabulary (lesson_id, hanzi, pinyin, meaning, example_text) VALUES
  (1, '一', 'yī', 'Một', '一个人'),
  (1, '二', 'èr', 'Hai', '两个苹果'),
  (1, '三', 'sān', 'Ba', '三個人'),
  (1, '四', 'sì', 'Bốn', '四本书'),
  (1, '五', 'wǔ', 'Năm', '五只猫'),
  (1, '六', 'liù', 'Sáu', '六个杯子'),
  (1, '七', 'qī', 'Bảy', '七个星星'),
  (1, '八', 'bā', 'Tám', '八条鱼'),
  (1, '九', 'jiǔ', 'Chín', '九个球'),
  (1, '十', 'shí', 'Mười', '十个手指'),
  (1, '你好', 'nǐ hǎo', 'Xin chào', '你好！'),
  (1, '谢谢', 'xièxiè', 'Cảm ơn', '谢谢你'),
  (1, '请', 'qǐng', 'Vui lòng', '请坐'),
  (1, '再见', 'zàijiàn', 'Tạm biệt', '再见！');

-- Test for Bài 1
INSERT INTO tests (lesson_id, title, questions) VALUES
  (1, 'Test Bài 1: Số và Lời chào', '[
    {
      "id": 1,
      "question": "\"你好\" có nghĩa là gì?",
      "options": ["Xin chào", "Cảm ơn", "Tạm biệt"],
      "correct": 0
    },
    {
      "id": 2,
      "question": "Số 3 trong tiếng Trung là gì?",
      "options": ["二", "三", "四"],
      "correct": 1
    },
    {
      "id": 3,
      "question": "\"谢谢\" là gì?",
      "options": ["Xin chào", "Cảm ơn", "Vui lòng"],
      "correct": 1
    },
    {
      "id": 4,
      "question": "Số 5 trong tiếng Trung?",
      "options": ["四", "五", "六"],
      "correct": 1
    },
    {
      "id": 5,
      "question": "\"再见\" có nghĩa là?",
      "options": ["Xin chào", "Cảm ơn", "Tạm biệt"],
      "correct": 2
    }
  ]');

-- Create test result view for easy querying
CREATE OR REPLACE VIEW user_test_summary AS
SELECT 
  u.id,
  u.email,
  u.name,
  COUNT(DISTINCT tr.test_id) as tests_taken,
  AVG(tr.score) as avg_score,
  SUM(CASE WHEN tr.passed THEN 1 ELSE 0 END) as tests_passed,
  COUNT(DISTINCT up.lesson_id) as lessons_completed
FROM users u
LEFT JOIN test_results tr ON u.id = tr.user_id
LEFT JOIN user_progress up ON u.id = up.user_id AND up.completed = true
GROUP BY u.id, u.email, u.name;

-- ===== NOTES =====
-- To restore from backup: psql -U user -d database_name < schema.sql
-- Make sure to set DATABASE_URL in .env before running
-- For Supabase: Use SQL Editor to run this file