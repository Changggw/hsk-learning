// backend/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const multer = require('multer');

const roadmapEngine = require('./roadmapEngine');
const placementTest = require('./placementTest');
const quizGenerator = require('./quizGenerator');

dotenv.config();

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ===== SUPABASE REST API SETUP =====
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  },
});

// ===== MULTER (audio upload cho Speaking) =====
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running v2' });
});

// ============================================================
// USER PROFILE / ONBOARDING
// ============================================================

// Lấy profile hiện tại (single-user, luôn lấy row đầu tiên)
app.get('/api/profile', async (req, res) => {
  try {
    const { data } = await supabase.get('/user_profile?id=eq.1');
    res.json(data[0] || null);
  } catch (err) {
    console.error('Profile fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Lấy bộ câu hỏi placement test
app.get('/api/onboarding/placement-test', (req, res) => {
  res.json(placementTest.getPlacementTest());
});

// Hoàn tất onboarding: nhận trình độ + mục tiêu (+ kết quả placement test nếu có) -> tạo roadmap
app.post('/api/onboarding/complete', async (req, res) => {
  try {
    const { level, targetMonths, placementAnswers } = req.body;
    // level: 'absolute_beginner' | 'beginner' | 'some_knowledge'

    let placementScore = null;
    let placementBreakdown = null;

    if (level === 'some_knowledge' && placementAnswers) {
      const result = placementTest.gradePlacementTest(placementAnswers);
      placementScore = result.score;
      placementBreakdown = result.breakdown;
    }

    const roadmap = roadmapEngine.generateRoadmap({
      level,
      targetMonths,
      placementScore,
      startDate: new Date(),
    });

    const { data } = await supabase.patch('/user_profile?id=eq.1', {
      current_level: level,
      target_months: targetMonths,
      placement_test_taken: level === 'some_knowledge',
      placement_test_score: placementScore,
      starting_lesson_order: roadmap.startingLessonOrder,
      words_per_day: roadmap.wordsPerDay,
      lessons_per_week: roadmap.lessonsPerWeek,
      roadmap_start_date: roadmap.roadmapStartDate,
      roadmap_target_end_date: roadmap.roadmapTargetEndDate,
      onboarding_completed: true,
      updated_at: new Date(),
    });

    res.json({
      profile: data[0],
      roadmap,
      placementBreakdown,
    });
  } catch (err) {
    console.error('Onboarding error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Lấy roadmap hiện tại + kiểm tra có cần điều chỉnh không (gọi mỗi khi mở Dashboard)
app.get('/api/roadmap/status', async (req, res) => {
  try {
    const { data: profiles } = await supabase.get('/user_profile?id=eq.1');
    const profile = profiles[0];
    if (!profile || !profile.onboarding_completed) {
      return res.json({ onboardingRequired: true });
    }

    const { data: progressRows } = await supabase.get(
      '/user_progress?status=eq.completed&select=id'
    );
    const lessonsCompletedCount = progressRows.length;

    const startDate = new Date(profile.roadmap_start_date);
    const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / 86400000);

    const lastStudyDate = profile.last_study_date ? new Date(profile.last_study_date) : null;
    const daysSinceLastStudy = lastStudyDate
      ? Math.floor((Date.now() - lastStudyDate.getTime()) / 86400000)
      : 999;

    const adjustment = roadmapEngine.recalculateRoadmap(
      profile,
      lessonsCompletedCount,
      daysSinceStart,
      daysSinceLastStudy
    );

    res.json({
      onboardingRequired: false,
      profile,
      lessonsCompletedCount,
      daysSinceStart,
      daysSinceLastStudy,
      adjustment,
    });
  } catch (err) {
    console.error('Roadmap status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Áp dụng điều chỉnh roadmap (user xác nhận đồng ý tăng tốc độ học)
app.post('/api/roadmap/adjust', async (req, res) => {
  try {
    const { newLessonsPerWeek } = req.body;
    const wordsPerDay = Math.ceil((newLessonsPerWeek * roadmapEngine.WORDS_PER_LESSON) / 7);

    const { data } = await supabase.patch('/user_profile?id=eq.1', {
      lessons_per_week: newLessonsPerWeek,
      words_per_day: wordsPerDay,
      updated_at: new Date(),
    });

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// LESSONS & VOCABULARY
// ============================================================

app.get('/api/lessons', async (req, res) => {
  try {
    const { data } = await supabase.get('/lessons?level=eq.1&order=order_num.asc');
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lessons/:id', async (req, res) => {
  try {
    const { data } = await supabase.get(`/lessons?id=eq.${req.params.id}`);
    res.json(data[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vocabulary/:lesson_id', async (req, res) => {
  try {
    const { data } = await supabase.get(
      `/vocabulary?lesson_id=eq.${req.params.lesson_id}&order=word_order.asc`
    );
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy TẤT CẢ từ vựng đã học (dùng để tạo quiz)
async function getLearnedWords() {
  const { data: completedLessons } = await supabase.get(
    '/user_progress?status=eq.completed&select=lesson_id'
  );
  if (!completedLessons.length) return [];

  const lessonIds = completedLessons.map(l => l.lesson_id).join(',');
  const { data: words } = await supabase.get(`/vocabulary?lesson_id=in.(${lessonIds})`);
  return words;
}

// ============================================================
// PROGRESS TRACKING
// ============================================================

app.get('/api/progress', async (req, res) => {
  try {
    const { data } = await supabase.get('/user_progress?order=updated_at.desc');
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/progress/:lesson_id', async (req, res) => {
  try {
    const { data } = await supabase.get(`/user_progress?lesson_id=eq.${req.params.lesson_id}`);
    res.json(data[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật tiến độ 1 kỹ năng trong bài học (gọi mỗi khi hoàn thành 1 phần: reading/listening/writing/speaking)
app.post('/api/progress/update-skill', async (req, res) => {
  try {
    const { lesson_id, skill } = req.body; // skill: 'reading'|'listening'|'writing'|'speaking'

    const { data: existing } = await supabase.get(`/user_progress?lesson_id=eq.${lesson_id}`);

    const skillField = `${skill}_done`;
    let progressRow;

    if (existing.length > 0) {
      const updateBody = {
        [skillField]: true,
        status: 'in_progress',
        updated_at: new Date(),
      };
      const { data } = await supabase.patch(`/user_progress?lesson_id=eq.${lesson_id}`, updateBody);
      progressRow = data[0];
    } else {
      const insertBody = {
        lesson_id,
        [skillField]: true,
        status: 'in_progress',
        started_at: new Date(),
      };
      const { data } = await supabase.post('/user_progress', insertBody);
      progressRow = data[0];
    }

    // Kiểm tra nếu đủ 4 kỹ năng -> đánh dấu hoàn thành bài học
    if (
      progressRow.reading_done &&
      progressRow.listening_done &&
      progressRow.writing_done &&
      progressRow.speaking_done &&
      progressRow.status !== 'completed'
    ) {
      const { data: completedData } = await supabase.patch(`/user_progress?lesson_id=eq.${lesson_id}`, {
        status: 'completed',
        completed_at: new Date(),
      });
      progressRow = completedData[0];
    }

    // Cập nhật streak
    await updateStreak();

    // Log session
    await supabase.post('/study_sessions', {
      lesson_id,
      skill,
      session_date: new Date().toISOString().split('T')[0],
    });

    res.json(progressRow);
  } catch (err) {
    console.error('Update skill error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Helper: cập nhật streak khi user học
async function updateStreak() {
  const { data: profiles } = await supabase.get('/user_profile?id=eq.1');
  const profile = profiles[0];
  const today = new Date().toISOString().split('T')[0];

  if (profile.last_study_date === today) return; // đã học hôm nay rồi, không cộng thêm

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak;
  if (profile.last_study_date === yesterdayStr) {
    newStreak = (profile.current_streak || 0) + 1; // liên tục
  } else {
    newStreak = 1; // bắt đầu lại streak (do nghỉ hoặc lần đầu)
  }

  const longestStreak = Math.max(newStreak, profile.longest_streak || 0);

  await supabase.patch('/user_profile?id=eq.1', {
    last_study_date: today,
    current_streak: newStreak,
    longest_streak: longestStreak,
    updated_at: new Date(),
  });
}

// ============================================================
// SKILL: READING
// ============================================================
app.get('/api/skills/reading/:lesson_id', async (req, res) => {
  try {
    const { data: lesson } = await supabase.get(`/lessons?id=eq.${req.params.lesson_id}`);
    const { data: words } = await supabase.get(
      `/vocabulary?lesson_id=eq.${req.params.lesson_id}&order=word_order.asc`
    );
    res.json({ lesson: lesson[0], vocabulary: words });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SKILL: LISTENING
// ============================================================
app.get('/api/skills/listening/:lesson_id', async (req, res) => {
  try {
    const { data: words } = await supabase.get(
      `/vocabulary?lesson_id=eq.${req.params.lesson_id}&order=word_order.asc`
    );
    // Tạo câu hỏi nghe (trắc nghiệm chọn hanzi đúng) từ chính 10 từ trong bài
    const questions = quizGenerator.buildListeningQuestions(words, Math.min(10, words.length));
    res.json({ vocabulary: words, questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SKILL: WRITING (mock chấm tạm thời)
// ============================================================
app.post('/api/skills/writing/submit', async (req, res) => {
  try {
    const { vocabulary_id, lesson_id, prompt_word, user_sentence } = req.body;

    // ===== MOCK GRADING (tạm thời, sẽ nâng cấp Claude API sau) =====
    const containsWord = user_sentence.includes(prompt_word);
    const lengthOk = user_sentence.length >= 4;

    const grammarScore = containsWord && lengthOk ? 75 + Math.floor(Math.random() * 20) : 40 + Math.floor(Math.random() * 20);
    const vocabScore = containsWord ? 80 + Math.floor(Math.random() * 20) : 30;
    const naturalnessScore = lengthOk ? 70 + Math.floor(Math.random() * 25) : 45;

    let feedback = '';
    if (!containsWord) {
      feedback = `Câu của bạn chưa sử dụng từ "${prompt_word}". Hãy thử lại và đảm bảo có dùng từ này nhé!`;
    } else if (!lengthOk) {
      feedback = 'Câu hơi ngắn, hãy thử viết câu đầy đủ hơn (chủ ngữ + vị ngữ).';
    } else {
      feedback = 'Câu khá tốt! Đã sử dụng đúng từ và ngữ pháp cơ bản hợp lý.';
    }

    const { data } = await supabase.post('/writing_submissions', {
      vocabulary_id,
      lesson_id,
      prompt_word,
      user_sentence,
      grammar_score: grammarScore,
      vocab_score: vocabScore,
      naturalness_score: naturalnessScore,
      feedback,
      is_mock: true,
    });

    res.json(data[0]);
  } catch (err) {
    console.error('Writing submit error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SKILL: SPEAKING (iFLYTEK)
// ============================================================
app.post('/api/skills/speaking/analyze', upload.single('audio'), async (req, res) => {
  try {
    const { vocabulary_id, lesson_id, target_hanzi, target_pinyin } = req.body;

    // ===== iFLYTEK INTEGRATION =====
    // TODO: Khi có IFLYTEK_APP_ID + IFLYTEK_API_KEY thật, thay đoạn dưới bằng call API thật
    const iflytekResult = await analyzeWithIflytek(req.file?.buffer, target_pinyin);

    const { data } = await supabase.post('/speaking_submissions', {
      vocabulary_id,
      lesson_id,
      target_hanzi,
      target_pinyin,
      accuracy: iflytekResult.accuracy,
      tone_accuracy: iflytekResult.toneDetails,
      fluency_score: iflytekResult.fluency,
      feedback: iflytekResult.feedback,
    });

    res.json({ ...data[0], tone_accuracy: iflytekResult.toneDetails });
  } catch (err) {
    console.error('Speaking analyze error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

async function analyzeWithIflytek(audioBuffer, targetPinyin) {
  // Nếu chưa có API key thật, dùng mock có cấu trúc giống thật để frontend test UI
  if (!process.env.IFLYTEK_APP_ID || process.env.IFLYTEK_APP_ID === 'your_app_id_here') {
    const syllables = targetPinyin.split(' ');
    const toneDetails = syllables.map(syl => ({
      syllable: syl,
      correct: Math.random() > 0.25,
    }));
    const accuracy = Math.round((toneDetails.filter(t => t.correct).length / toneDetails.length) * 100);

    return {
      accuracy,
      fluency: 70 + Math.floor(Math.random() * 25),
      toneDetails,
      feedback:
        accuracy >= 85
          ? 'Phát âm rất tốt! Tiếp tục duy trì.'
          : `Một số âm chưa chuẩn. Hãy nghe lại mẫu và luyện tập thêm phần thanh điệu.`,
    };
  }

  // TODO: Real iFLYTEK API call khi có key thật
  // const base64Audio = audioBuffer.toString('base64');
  // const response = await axios.post('https://iflytek-api-endpoint...', {...});
  // return parseIflytekResponse(response.data);

  return { accuracy: 0, fluency: 0, toneDetails: [], feedback: 'iFLYTEK chưa được cấu hình.' };
}

// ============================================================
// QUIZ TUẦN / TEST THÁNG
// ============================================================

app.get('/api/quiz/weekly/generate', async (req, res) => {
  try {
    const learnedWords = await getLearnedWords();
    const quiz = quizGenerator.generateWeeklyQuiz(learnedWords);
    if (quiz.error) return res.status(400).json(quiz);

    const { data } = await supabase.post('/tests', {
      test_type: 'weekly_quiz',
      title: `Quiz tuần - ${new Date().toLocaleDateString('vi-VN')}`,
      reading_questions: quiz.reading_questions,
      listening_questions: quiz.listening_questions,
      writing_questions: quiz.writing_questions,
      speaking_questions: quiz.speaking_questions,
    });

    res.json(data[0]);
  } catch (err) {
    console.error('Weekly quiz gen error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/test/monthly/generate', async (req, res) => {
  try {
    const learnedWords = await getLearnedWords();
    const test = quizGenerator.generateMonthlyTest(learnedWords);
    if (test.error) return res.status(400).json(test);

    const { data } = await supabase.post('/tests', {
      test_type: 'monthly_test',
      title: `Test tổng tháng - ${new Date().toLocaleDateString('vi-VN')}`,
      reading_questions: test.reading_questions,
      listening_questions: test.listening_questions,
      writing_questions: test.writing_questions,
      speaking_questions: test.speaking_questions,
    });

    res.json(data[0]);
  } catch (err) {
    console.error('Monthly test gen error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tests/:id', async (req, res) => {
  try {
    const { data } = await supabase.get(`/tests?id=eq.${req.params.id}`);
    res.json(data[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Nộp bài quiz/test -> chấm điểm + phân tích
app.post('/api/tests/:id/submit', async (req, res) => {
  try {
    const { readingScore, listeningScore, writingScore, speakingScore, answers, test_type } = req.body;

    const analysis = quizGenerator.analyzeTestResult({
      readingScore,
      listeningScore,
      writingScore,
      speakingScore,
    });

    const { data } = await supabase.post('/test_results', {
      test_id: req.params.id,
      test_type,
      reading_score: readingScore,
      listening_score: listeningScore,
      writing_score: writingScore,
      speaking_score: speakingScore,
      overall_score: analysis.overall,
      answers,
      weak_skill: analysis.weakSkill,
      recommendation: analysis.recommendation,
    });

    res.json({ ...data[0], analysis });
  } catch (err) {
    console.error('Test submit error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tests/results/history', async (req, res) => {
  try {
    const { data } = await supabase.get('/test_results?order=taken_at.desc&limit=20');
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DASHBOARD / STATS (data thật)
// ============================================================
app.get('/api/stats/dashboard', async (req, res) => {
  try {
    const { data: profiles } = await supabase.get('/user_profile?id=eq.1');
    const profile = profiles[0];

    const { data: allProgress } = await supabase.get('/user_progress');
    const completedLessons = allProgress.filter(p => p.status === 'completed');

    const { data: allVocab } = await supabase.get('/vocabulary?select=id,lesson_id');
    const completedLessonIds = new Set(completedLessons.map(p => p.lesson_id));
    const wordsLearned = allVocab.filter(v => completedLessonIds.has(v.lesson_id)).length;

    const { data: testResults } = await supabase.get('/test_results?order=taken_at.desc&limit=10');
    const avgTestScore = testResults.length
      ? Math.round(testResults.reduce((sum, t) => sum + (t.overall_score || 0), 0) / testResults.length)
      : null;

    res.json({
      streak: profile?.current_streak || 0,
      longestStreak: profile?.longest_streak || 0,
      wordsLearned,
      totalWords: roadmapEngine.TOTAL_WORDS,
      lessonsCompleted: completedLessons.length,
      totalLessons: roadmapEngine.TOTAL_LESSONS,
      avgTestScore,
      recentTests: testResults,
      roadmapTargetEndDate: profile?.roadmap_target_end_date,
      lessonsPerWeek: profile?.lessons_per_week,
      wordsPerDay: profile?.words_per_day,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// EXPORT DATA
// ============================================================
app.get('/api/export', async (req, res) => {
  try {
    const { data: progress } = await supabase.get('/user_progress?order=updated_at.desc');
    const { data: testResults } = await supabase.get('/test_results?order=taken_at.desc');
    const { data: profile } = await supabase.get('/user_profile?id=eq.1');

    res.json({
      profile: profile[0],
      progress,
      testResults,
      exportedAt: new Date().toISOString(),
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
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server v2 running on port ${PORT}`);
  console.log(`📡 Connected to Supabase: ${SUPABASE_URL}`);
});

module.exports = app;
