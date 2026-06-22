// backend/src/roadmapEngine.js
// ============================================================
// ROADMAP ENGINE - Tính lộ trình học cá nhân hóa
// Input: trình độ hiện tại + mục tiêu thời gian (+ kết quả placement test nếu có)
// Output: lịch học ngày/tuần/tháng, ngày dự kiến hoàn thành
// ============================================================

const TOTAL_LESSONS = 30;       // HSK 1 = 30 bài
const WORDS_PER_LESSON = 10;    // mỗi bài 10 từ
const TOTAL_WORDS = 300;

/**
 * Tính tốc độ học (bài/tuần) dựa trên mục tiêu thời gian
 * @param {number} targetMonths - 3 (2-3 tháng) hoặc 6 (3-6 tháng)
 * @param {number} startingLessonOrder - bài bắt đầu (1 nếu mới, >1 nếu đã có kiến thức)
 */
function calculateLessonsPerWeek(targetMonths, startingLessonOrder = 1) {
  const remainingLessons = TOTAL_LESSONS - (startingLessonOrder - 1);
  const totalWeeks = targetMonths * 4.33; // tuần trung bình/tháng

  // Để lại 20% thời gian cuối để ôn tập + quiz tuần + test tháng
  const studyWeeks = totalWeeks * 0.8;

  const lessonsPerWeek = Math.ceil(remainingLessons / studyWeeks);

  // Giới hạn hợp lý: tối thiểu 2 bài/tuần, tối đa 7 bài/tuần (1 bài/ngày)
  return Math.max(2, Math.min(7, lessonsPerWeek));
}

/**
 * Xác định bài học bắt đầu dựa trên trình độ user
 * @param {string} level - 'absolute_beginner' | 'beginner' | 'some_knowledge'
 * @param {number} placementScore - % đúng trong placement test (0-100), null nếu chưa làm
 */
function determineStartingPoint(level, placementScore = null) {
  if (level === 'absolute_beginner') {
    return { startingLessonOrder: 1, reason: 'Bắt đầu từ bài đầu tiên - phù hợp người mới hoàn toàn' };
  }

  if (level === 'beginner') {
    return { startingLessonOrder: 1, reason: 'Bắt đầu từ bài đầu nhưng có thể học nhanh hơn ở các bài đầu' };
  }

  if (level === 'some_knowledge' && placementScore !== null) {
    // Dựa trên % đúng để xếp vào bài phù hợp
    // 0-30%: bắt đầu bài 1 (kiến thức còn yếu, cần học lại từ đầu)
    // 31-50%: bắt đầu bài 6 (đã biết số đếm cơ bản + chào hỏi)
    // 51-70%: bắt đầu bài 13 (đã biết giao tiếp cơ bản, ngữ pháp đơn giản)
    // 71-85%: bắt đầu bài 20 (đã khá vững, chỉ cần học phần nâng cao)
    // 86-100%: bắt đầu bài 26 (gần như đã biết hết, chỉ cần ôn tập)
    if (placementScore <= 30) return { startingLessonOrder: 1, reason: 'Kiến thức nền còn yếu, nên học lại từ đầu để chắc gốc' };
    if (placementScore <= 50) return { startingLessonOrder: 6, reason: 'Đã nắm cơ bản (số đếm, chào hỏi), bắt đầu từ phần nâng cao hơn' };
    if (placementScore <= 70) return { startingLessonOrder: 13, reason: 'Đã giao tiếp được cơ bản, tiếp tục từ chủ đề công việc/sức khỏe' };
    if (placementScore <= 85) return { startingLessonOrder: 20, reason: 'Khá vững, tập trung vào phần nâng cao và mở rộng từ vựng' };
    return { startingLessonOrder: 26, reason: 'Gần như đã thành thạo HSK 1, tập trung ôn tập và làm test tổng' };
  }

  return { startingLessonOrder: 1, reason: 'Mặc định bắt đầu từ bài 1' };
}

/**
 * Tạo roadmap đầy đủ: ngày bắt đầu, ngày kết thúc dự kiến, lịch tuần
 */
function generateRoadmap({ level, targetMonths, placementScore = null, startDate = new Date() }) {
  const { startingLessonOrder, reason } = determineStartingPoint(level, placementScore);
  const lessonsPerWeek = calculateLessonsPerWeek(targetMonths, startingLessonOrder);
  const remainingLessons = TOTAL_LESSONS - (startingLessonOrder - 1);
  const studyWeeksNeeded = Math.ceil(remainingLessons / lessonsPerWeek);
  const totalWeeksWithReview = Math.ceil(studyWeeksNeeded * 1.25); // +25% cho quiz/ôn tập

  const targetEndDate = new Date(startDate);
  targetEndDate.setDate(targetEndDate.getDate() + totalWeeksWithReview * 7);

  const wordsPerDay = Math.ceil((lessonsPerWeek * WORDS_PER_LESSON) / 7);

  return {
    startingLessonOrder,
    startingReason: reason,
    lessonsPerWeek,
    wordsPerDay,
    totalWeeksEstimate: totalWeeksWithReview,
    roadmapStartDate: startDate.toISOString().split('T')[0],
    roadmapTargetEndDate: targetEndDate.toISOString().split('T')[0],
    totalLessonsToStudy: remainingLessons,
    weeklyQuizEnabled: true,
    monthlyTestEnabled: true,
  };
}

/**
 * Tính lại roadmap khi user học chậm/nhanh hơn dự kiến hoặc nghỉ học
 * @param {object} profile - user_profile hiện tại từ DB
 * @param {number} lessonsCompletedCount - số bài đã hoàn thành thực tế
 * @param {number} daysSinceStart - số ngày kể từ roadmap_start_date
 * @param {number} daysSinceLastStudy - số ngày kể từ lần học cuối
 */
function recalculateRoadmap(profile, lessonsCompletedCount, daysSinceStart, daysSinceLastStudy) {
  const expectedLessonsByNow = Math.floor((daysSinceStart / 7) * profile.lessons_per_week);
  const pace = lessonsCompletedCount - expectedLessonsByNow; // dương = nhanh hơn, âm = chậm hơn

  let adjustment = {
    needsRecalculation: false,
    needsReviewBeforeContinuing: false,
    message: '',
    suggestedLessonsPerWeek: profile.lessons_per_week,
  };

  // Nghỉ học lâu (>7 ngày) -> gợi ý ôn tập lại / re-test trước khi tiếp tục
  if (daysSinceLastStudy >= 7) {
    adjustment.needsReviewBeforeContinuing = true;
    adjustment.message = `Bạn đã nghỉ học ${daysSinceLastStudy} ngày. Nên ôn lại bài gần nhất trước khi học bài mới, hoặc làm bài test nhanh để kiểm tra mức độ ghi nhớ.`;
  }

  // Học chậm hơn dự kiến đáng kể (-3 bài trở lên)
  if (pace <= -3) {
    adjustment.needsRecalculation = true;
    const remainingLessons = TOTAL_LESSONS - lessonsCompletedCount;
    const remainingWeeksOriginal = Math.ceil((TOTAL_LESSONS - expectedLessonsByNow) / profile.lessons_per_week);
    // Tăng nhẹ tốc độ để bù lại, nhưng không quá sức (+30% max)
    const newPace = Math.min(7, Math.ceil(profile.lessons_per_week * 1.3));
    adjustment.suggestedLessonsPerWeek = newPace;
    adjustment.message = adjustment.message ||
      `Bạn đang học chậm hơn lộ trình ${Math.abs(pace)} bài. Đề xuất tăng nhẹ tốc độ lên ${newPace} bài/tuần để theo kịp mục tiêu, hoặc điều chỉnh lại deadline.`;
  }

  // Học nhanh hơn dự kiến (+3 bài trở lên) -> có thể giảm tải hoặc rút ngắn mục tiêu
  if (pace >= 3) {
    adjustment.needsRecalculation = true;
    adjustment.message = `Bạn đang học nhanh hơn lộ trình ${pace} bài! Có thể hoàn thành sớm hơn dự kiến, hoặc dành thêm thời gian ôn tập sâu.`;
  }

  return adjustment;
}

module.exports = {
  TOTAL_LESSONS,
  WORDS_PER_LESSON,
  TOTAL_WORDS,
  calculateLessonsPerWeek,
  determineStartingPoint,
  generateRoadmap,
  recalculateRoadmap,
};
