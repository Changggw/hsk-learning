// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const multer = require('multer');
const axios = require('axios');

dotenv.config();

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ===== DATABASE SETUP =====
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test DB connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✅ Database connected');
    release();
  }
});

// ===== MULTER SETUP (for audio upload) =====
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ===== ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

// ===== LESSONS =====
app.get('/api/lessons', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM lessons 
      ORDER BY level, id
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lessons/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM lessons WHERE id = $1',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== VOCABULARY =====
app.get('/api/vocabulary/:lesson_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vocabulary WHERE lesson_id = $1 ORDER BY id',
      [req.params.lesson_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== USER PROGRESS =====
app.post('/api/progress', async (req, res) => {
  const { user_id, lesson_id, completed, score } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO user_progress (user_id, lesson_id, completed, score, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, lesson_id) DO UPDATE SET
        completed = $3, score = $4, updated_at = NOW()
      RETURNING *
    `, [user_id, lesson_id, completed, score]);
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/progress/:user_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_progress WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== iFLYTEK PRONUNCIATION ANALYSIS =====
app.post('/api/audio/analyze', upload.single('audio'), async (req, res) => {
  try {
    const { pinyin, expected_text } = req.body;
    const audioBuffer = req.file.buffer;

    // Call iFLYTEK API
    const iflytekResult = await analyzeWithiFLYTEK(audioBuffer, pinyin);

    // Save to database
    await pool.query(`
      INSERT INTO audio_analysis (user_id, pinyin, accuracy, tone_feedback, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [req.body.user_id || 'anonymous', pinyin, iflytekResult.accuracy, iflytekResult.feedback]);

    res.json(iflytekResult);
  } catch (err) {
    console.error('Audio analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== iFLYTEK HELPER FUNCTION =====
async function analyzeWithiFLYTEK(audioBuffer, expectedPinyin) {
  try {
    // Convert audio to base64
    const base64Audio = audioBuffer.toString('base64');

    // Mock analysis (replace with real iFLYTEK API when you have API key)
    // Real implementation would call iFLYTEK API here
    const accuracy = Math.floor(Math.random() * 30) + 70; // 70-100
    const tones = ['✅ Tone chính xác', '⚠️ Tone yếu', '❌ Tone sai'];
    const feedback = tones[Math.floor(Math.random() * tones.length)];

    return {
      recognized_text: expectedPinyin,
      accuracy,
      tone_feedback: feedback,
      score: accuracy,
      comment: accuracy > 85 ? 'Phát âm tốt! Tiếp tục duy trì.' : 'Cần luyện tập thêm.',
      status: 'success'
    };
  } catch (err) {
    throw new Error('iFLYTEK API error: ' + err.message);
  }
}

// ===== TEST SUBMISSION =====
app.post('/api/test/submit', async (req, res) => {
  const { user_id, test_id, answers, score } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO test_results (user_id, test_id, answers, score, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `, [user_id, test_id, JSON.stringify(answers), score]);

    // Update user progress
    await pool.query(`
      UPDATE user_progress 
      SET score = $2, completed = true, updated_at = NOW()
      WHERE user_id = $1 AND lesson_id = (SELECT lesson_id FROM tests WHERE id = $3)
    `, [user_id, score, test_id]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/test/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tests WHERE id = $1',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== STATISTICS =====
app.get('/api/stats/:user_id', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT lesson_id) as lessons_completed,
        AVG(score) as avg_score,
        MAX(score) as max_score,
        COUNT(*) as total_attempts
      FROM user_progress
      WHERE user_id = $1 AND completed = true
    `, [req.params.user_id]);

    res.json(stats.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== EXPORT DATA =====
app.get('/api/export/:user_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.title as lesson,
        up.score,
        up.completed,
        up.created_at as date
      FROM user_progress up
      JOIN lessons l ON up.lesson_id = l.id
      WHERE up.user_id = $1
      ORDER BY up.created_at DESC
    `, [req.params.user_id]);

    res.json({
      data: result.rows,
      filename: `hsk-progress-${req.params.user_id}-${new Date().toISOString()}.json`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;