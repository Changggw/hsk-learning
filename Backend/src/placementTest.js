// backend/src/placementTest.js
// ============================================================
// PLACEMENT TEST - Bài test đầu vào cho user "Biết chút ít kiến thức"
// 15 câu hỏi trải đều từ dễ -> khó qua các chủ đề HSK 1
// ============================================================

// Câu hỏi được soạn từ từ vựng ở các bài học khác nhau (1, 5, 10, 15, 20, 25, 30)
// để đánh giá user biết tới đâu
const PLACEMENT_QUESTIONS = [
  // Nhóm 1: Cơ bản (bài 1-5) - 5 câu
  {
    id: 1, difficulty: 'basic', lesson_ref: 1,
    question: '"你好" có nghĩa là gì?',
    options: ['Tạm biệt', 'Xin chào', 'Cảm ơn', 'Xin lỗi'],
    correct: 1,
  },
  {
    id: 2, difficulty: 'basic', lesson_ref: 1,
    question: 'Số "五" đọc là gì?',
    options: ['sì', 'wǔ', 'liù', 'qī'],
    correct: 1,
  },
  {
    id: 3, difficulty: 'basic', lesson_ref: 3,
    question: '"我们" có nghĩa là gì?',
    options: ['Họ', 'Bạn', 'Chúng tôi', 'Anh ấy'],
    correct: 2,
  },
  {
    id: 4, difficulty: 'basic', lesson_ref: 4,
    question: '"妈妈" có nghĩa là gì?',
    options: ['Bố', 'Mẹ', 'Anh trai', 'Chị gái'],
    correct: 1,
  },
  {
    id: 5, difficulty: 'basic', lesson_ref: 5,
    question: '"叫" trong câu "你叫什么名字?" có nghĩa là gì?',
    options: ['Đi', 'Ăn', 'Gọi/tên là', 'Mua'],
    correct: 2,
  },
  // Nhóm 2: Trung bình (bài 6-15) - 5 câu
  {
    id: 6, difficulty: 'intermediate', lesson_ref: 7,
    question: '"明天" có nghĩa là gì?',
    options: ['Hôm qua', 'Hôm nay', 'Ngày mai', 'Năm sau'],
    correct: 2,
  },
  {
    id: 7, difficulty: 'intermediate', lesson_ref: 9,
    question: '"晚上" có nghĩa là gì?',
    options: ['Buổi sáng', 'Buổi trưa', 'Buổi chiều', 'Buổi tối'],
    correct: 3,
  },
  {
    id: 8, difficulty: 'intermediate', lesson_ref: 10,
    question: '"学生" có nghĩa là gì?',
    options: ['Giáo viên', 'Học sinh', 'Trường học', 'Bài học'],
    correct: 1,
  },
  {
    id: 9, difficulty: 'intermediate', lesson_ref: 13,
    question: '"工作" có nghĩa là gì?',
    options: ['Nghỉ ngơi', 'Công việc', 'Công ty', 'Bận rộn'],
    correct: 1,
  },
  {
    id: 10, difficulty: 'intermediate', lesson_ref: 15,
    question: '"喝" có nghĩa là gì?',
    options: ['Ăn', 'Uống', 'Nấu', 'Mua'],
    correct: 1,
  },
  // Nhóm 3: Nâng cao (bài 16-30) - 5 câu
  {
    id: 11, difficulty: 'advanced', lesson_ref: 18,
    question: '"出租车" có nghĩa là gì?',
    options: ['Xe buýt', 'Tàu hỏa', 'Taxi', 'Máy bay'],
    correct: 2,
  },
  {
    id: 12, difficulty: 'advanced', lesson_ref: 21,
    question: 'Từ nào dùng để hỏi "ở đâu"?',
    options: ['什么', '怎么', '哪里', '谁'],
    correct: 2,
  },
  {
    id: 13, difficulty: 'advanced', lesson_ref: 23,
    question: '"喜欢" có nghĩa là gì?',
    options: ['Ghét', 'Thích', 'Yêu', 'Buồn'],
    correct: 1,
  },
  {
    id: 14, difficulty: 'advanced', lesson_ref: 25,
    question: '"天气" có nghĩa là gì?',
    options: ['Mùa', 'Ngày', 'Thời tiết', 'Bầu trời'],
    correct: 2,
  },
  {
    id: 15, difficulty: 'advanced', lesson_ref: 28,
    question: '"做饭" có nghĩa là gì?',
    options: ['Ăn cơm', 'Nấu cơm', 'Mua đồ ăn', 'Dọn bàn'],
    correct: 1,
  },
];

function getPlacementTest() {
  // Trả về câu hỏi không kèm đáp án đúng (ẩn cho user làm)
  return PLACEMENT_QUESTIONS.map(({ id, difficulty, question, options }) => ({
    id, difficulty, question, options,
  }));
}

/**
 * Chấm bài placement test
 * @param {Array} answers - [{id: 1, selected: 2}, ...]
 * @returns {object} { score, correctCount, totalCount, breakdown }
 */
function gradePlacementTest(answers) {
  let correctCount = 0;
  const breakdown = { basic: { correct: 0, total: 0 }, intermediate: { correct: 0, total: 0 }, advanced: { correct: 0, total: 0 } };

  for (const q of PLACEMENT_QUESTIONS) {
    breakdown[q.difficulty].total++;
    const userAnswer = answers.find(a => a.id === q.id);
    if (userAnswer && userAnswer.selected === q.correct) {
      correctCount++;
      breakdown[q.difficulty].correct++;
    }
  }

  const score = Math.round((correctCount / PLACEMENT_QUESTIONS.length) * 100);

  return {
    score,
    correctCount,
    totalCount: PLACEMENT_QUESTIONS.length,
    breakdown,
  };
}

module.exports = {
  getPlacementTest,
  gradePlacementTest,
  PLACEMENT_QUESTIONS,
};
