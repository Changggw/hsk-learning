// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [roadmapStatus, setRoadmapStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, roadmapRes] = await Promise.all([
        fetch(`${API_URL}/api/stats/dashboard`).then((r) => r.json()),
        fetch(`${API_URL}/api/roadmap/status`).then((r) => r.json()),
      ]);
      setStats(statsRes);
      setRoadmapStatus(roadmapRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAdjustment = async () => {
    if (!roadmapStatus?.adjustment?.suggestedLessonsPerWeek) return;
    setAdjusting(true);
    try {
      await fetch(`${API_URL}/api/roadmap/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newLessonsPerWeek: roadmapStatus.adjustment.suggestedLessonsPerWeek }),
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setAdjusting(false);
    }
  };

  if (loading) {
    return (
      <div className="page dashboard-page">
        <div className="loader-inline">
          <div className="loader" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const wordsProgress = stats ? Math.round((stats.wordsLearned / stats.totalWords) * 100) : 0;
  const lessonsProgress = stats ? Math.round((stats.lessonsCompleted / stats.totalLessons) * 100) : 0;

  return (
    <div className="page dashboard-page">
      <h2>Chào buổi sáng! 👋</h2>

      {/* Cảnh báo điều chỉnh lộ trình */}
      {roadmapStatus?.adjustment?.message && (
        <div
          className={`roadmap-alert ${
            roadmapStatus.adjustment.needsReviewBeforeContinuing ? 'alert-warning' : 'alert-info'
          }`}
        >
          <span className="alert-icon">
            {roadmapStatus.adjustment.needsReviewBeforeContinuing ? '⚠️' : '💡'}
          </span>
          <div className="alert-content">
            <p>{roadmapStatus.adjustment.message}</p>
            {roadmapStatus.adjustment.needsRecalculation && (
              <button className="btn-secondary btn-small" onClick={handleApplyAdjustment} disabled={adjusting}>
                {adjusting ? 'Đang áp dụng...' : `Áp dụng (${roadmapStatus.adjustment.suggestedLessonsPerWeek} bài/tuần)`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Streak Display */}
      <div className="streak-display">
        <div className="streak-number">{stats?.streak || 0}</div>
        <div className="streak-label">Ngày học liên tiếp 🔥</div>
        {stats?.longestStreak > 0 && (
          <div className="streak-best">Kỷ lục: {stats.longestStreak} ngày</div>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value">
            {stats?.wordsLearned || 0}/{stats?.totalWords || 300}
          </div>
          <div className="stat-label">Từ đã học</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">
            {stats?.lessonsCompleted || 0}/{stats?.totalLessons || 30}
          </div>
          <div className="stat-label">Bài hoàn thành</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{stats?.avgTestScore ?? '--'}{stats?.avgTestScore != null ? '%' : ''}</div>
          <div className="stat-label">Điểm test TB</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">HSK 1</div>
          <div className="stat-label">Mục tiêu hiện tại</div>
        </div>
      </div>

      {/* Roadmap Info */}
      {stats?.roadmapTargetEndDate && (
        <section className="section">
          <h3>🗺️ Lộ trình học</h3>
          <div className="roadmap-info-grid">
            <p>📖 Tốc độ: <strong>{stats.lessonsPerWeek} bài/tuần</strong> (~{stats.wordsPerDay} từ mới/ngày)</p>
            <p>🎯 Dự kiến hoàn thành: <strong>{new Date(stats.roadmapTargetEndDate).toLocaleDateString('vi-VN')}</strong></p>
          </div>
        </section>
      )}

      {/* Progress bars */}
      <section className="section">
        <h3>📈 Tiến độ tổng thể</h3>
        <p className="progress-label">Từ vựng: {wordsProgress}%</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${wordsProgress}%` }} />
        </div>
        <p className="progress-label" style={{ marginTop: 12 }}>Bài học: {lessonsProgress}%</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${lessonsProgress}%` }} />
        </div>
      </section>

      {/* Quick actions */}
      <section className="section">
        <h3>🚀 Bắt đầu ngay</h3>
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={() => onNavigate('learn')}>
            <span className="qa-icon">📖</span>
            <span>Học bài mới</span>
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate('quiz')}>
            <span className="qa-icon">📝</span>
            <span>Quiz tuần</span>
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate('test')}>
            <span className="qa-icon">🏆</span>
            <span>Test tháng</span>
          </button>
        </div>
      </section>

      {/* Recent test results */}
      {stats?.recentTests?.length > 0 && (
        <section className="section">
          <h3>📊 Kết quả gần đây</h3>
          <div className="recent-tests-list">
            {stats.recentTests.slice(0, 5).map((t) => (
              <div key={t.id} className="recent-test-item">
                <span className="test-type-badge">
                  {t.test_type === 'weekly_quiz' ? 'Quiz tuần' : t.test_type === 'monthly_test' ? 'Test tháng' : 'Placement'}
                </span>
                <span className="test-score">{t.overall_score}%</span>
                <span className="test-date">{new Date(t.taken_at).toLocaleDateString('vi-VN')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tips */}
      <section className="section tips-section">
        <h3>💡 Mẹo hôm nay</h3>
        <div className="tip-box">
          <p>
            <strong>Tone tiếng Trung:</strong> Có 4 tone, nếu nói sai tone thì từ sai. Luyện nói thường xuyên ở tab 🎤 Speaking!
          </p>
        </div>
      </section>
    </div>
  );
}
