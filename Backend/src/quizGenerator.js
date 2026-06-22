// backend/src/quizGenerator.js
// ============================================================
// QUIZ GENERATOR - Tự động tạo Quiz tuần / Test tháng
// dựa trên các từ vựng user ĐÃ HỌC (từ bảng vocabulary + user_progress)
// Bao gồm đủ 4 kỹ năng: Reading, Listening, Writing, Speaking
// ============================================================

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom(array, n) {
  return shuffle(array).slice(0, n);
}

/**
 * Tạo câu hỏi trắc nghiệm Reading: cho hanzi, chọn nghĩa đúng
 */
function buildReadingQuestions(learnedWords, count) {
  const pool = pickRandom(learnedWords, count);
  return pool.map((word, idx) => {
    // Lấy 3 đáp án sai từ các từ khác đã học
    const distractors = pickRandom(
      learnedWords.filter(w => w.hanzi !== word.hanzi),
      3
    ).map(w => w.meaning);

    const options = shuffle([word.meaning, ...distractors]);
    const correct = options.indexOf(word.meaning);

    return {
      id: idx + 1,
      type: 'reading',
      question: `"${word.hanzi}" (${word.pinyin}) có nghĩa là gì?`,
      options,
      correct,
    };
  });
}

/**
 * Tạo câu hỏi Listening: phát âm thanh (TTS) từ hanzi, chọn hanzi đúng
 * (Frontend sẽ dùng Web Speech API hoặc TTS để đọc word.hanzi)
 */
function buildListeningQuestions(learnedWords, count) {
  const pool = pickRandom(learnedWords, count);
  return pool.map((word, idx) => {
    const distractors = pickRandom(
      learnedWords.filter(w => w.hanzi !== word.hanzi),
      3
    ).map(w => w.hanzi);

    const options = shuffle([word.hanzi, ...distractors]);
    const correct = options.indexOf(word.hanzi);

    return {
      id: idx + 1,
      type: 'listening',
      audio_text: word.hanzi, // frontend TTS sẽ đọc từ này
      question: 'Nghe và chọn từ đúng:',
      options,
      correct,
    };
  });
}

/**
 * Tạo đề Writing: yêu cầu đặt câu với từ cho trước
 */
function buildWritingQuestions(learnedWords, count) {
  const pool = pickRandom(learnedWords, count);
  return pool.map((word, idx) => ({
    id: idx + 1,
    type: 'writing',
    prompt_word: word.hanzi,
    prompt_pinyin: word.pinyin,
    prompt_meaning: word.meaning,
    instruction: `Hãy đặt một câu có sử dụng từ "${word.hanzi}" (${word.meaning})`,
  }));
}

/**
 * Tạo đề Speaking: yêu cầu đọc to từ/câu
 */
function buildSpeakingQuestions(learnedWords, count) {
  const pool = pickRandom(learnedWords, count);
  return pool.map((word, idx) => ({
    id: idx + 1,
    type: 'speaking',
    target_hanzi: word.hanzi,
    target_pinyin: word.pinyin,
    target_meaning: word.meaning,
    example_sentence: word.example_text || word.hanzi,
  }));
}

/**
 * Tạo Quiz TUẦN: dựa trên các bài học hoàn thành trong tuần đó
 * Cấu trúc: 10 Reading + 10 Listening + 5 Writing + 5 Speaking (theo yêu cầu)
 */
function generateWeeklyQuiz(learnedWords) {
  if (learnedWords.length < 10) {
    return { error: 'Chưa đủ từ vựng đã học để tạo quiz (cần tối thiểu 10 từ).' };
  }

  const readingCount = Math.min(10, learnedWords.length);
  const listeningCount = Math.min(10, learnedWords.length);
  const writingCount = Math.min(5, learnedWords.length);
  const speakingCount = Math.min(5, learnedWords.length);

  return {
    test_type: 'weekly_quiz',
    reading_questions: buildReadingQuestions(learnedWords, readingCount),
    listening_questions: buildListeningQuestions(learnedWords, listeningCount),
    writing_questions: buildWritingQuestions(learnedWords, writingCount),
    speaking_questions: buildSpeakingQuestions(learnedWords, speakingCount),
  };
}

/**
 * Tạo Test THÁNG: mô phỏng thi thật, số câu nhiều hơn, có time limit
 * Cấu trúc: 20 Reading + 20 Listening + 8 Writing + 8 Speaking
 */
function generateMonthlyTest(learnedWords) {
  if (learnedWords.length < 20) {
    return { error: 'Chưa đủ từ vựng đã học để tạo test tháng (cần tối thiểu 20 từ).' };
  }

  const readingCount = Math.min(20, learnedWords.length);
  const listeningCount = Math.min(20, learnedWords.length);
  const writingCount = Math.min(8, learnedWords.length);
  const speakingCount = Math.min(8, learnedWords.length);

  return {
    test_type: 'monthly_test',
    time_limit_minutes: 60,
    reading_questions: buildReadingQuestions(learnedWords, readingCount),
    listening_questions: buildListeningQuestions(learnedWords, listeningCount),
    writing_questions: buildWritingQuestions(learnedWords, writingCount),
    speaking_questions: buildSpeakingQuestions(learnedWords, speakingCount),
  };
}

/**
 * Phân tích kết quả test và đưa ra khuyến nghị (kỹ năng yếu nhất cần tập trung)
 */
function analyzeTestResult({ readingScore, listeningScore, writingScore, speakingScore }) {
  const skills = [
    { name: 'reading', label: 'Đọc hiểu', score: readingScore },
    { name: 'listening', label: 'Nghe', score: listeningScore },
    { name: 'writing', label: 'Viết', score: writingScore },
    { name: 'speaking', label: 'Nói', score: speakingScore },
  ];

  const overall = Math.round(skills.reduce((sum, s) => sum + s.score, 0) / skills.length);
  const weakest = skills.reduce((min, s) => (s.score < min.score ? s : min), skills[0]);
  const strongest = skills.reduce((max, s) => (s.score > max.score ? s : max), skills[0]);

  let recommendation = `Tổng điểm: ${overall}%. `;
  if (weakest.score < 60) {
    recommendation += `Kỹ năng yếu nhất là ${weakest.label} (${weakest.score}%) — tuần tới nên tập trung luyện thêm phần này. `;
  } else {
    recommendation += `Tất cả kỹ năng đều ở mức ổn (trên 60%), tiếp tục duy trì đều cả 4 kỹ năng. `;
  }
  recommendation += `Kỹ năng mạnh nhất: ${strongest.label} (${strongest.score}%).`;

  return {
    overall,
    weakSkill: weakest.name,
    strongSkill: strongest.name,
    recommendation,
  };
}

module.exports = {
  generateWeeklyQuiz,
  generateMonthlyTest,
  analyzeTestResult,
  buildReadingQuestions,
  buildListeningQuestions,
  buildWritingQuestions,
  buildSpeakingQuestions,
};
