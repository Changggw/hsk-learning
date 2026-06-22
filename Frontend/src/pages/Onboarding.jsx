// frontend/src/pages/Onboarding.jsx
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const LEVEL_OPTIONS = [
  {
    value: 'absolute_beginner',
    label: 'Chưa biết gì về tiếng Trung',
    desc: 'Hoàn toàn mới, chưa từng học',
    icon: '🌱',
  },
  {
    value: 'beginner',
    label: 'Mới bắt đầu',
    desc: 'Biết vài từ cơ bản (chào hỏi, số đếm...)',
    icon: '🌿',
  },
  {
    value: 'some_knowledge',
    label: 'Biết chút ít kiến thức',
    desc: 'Đã học qua, cần kiểm tra để xếp đúng trình độ',
    icon: '🌳',
  },
];

const TIME_OPTIONS = [
  { value: 3, label: '2-3 tháng', desc: 'Học nhanh, mục tiêu gấp', icon: '⚡' },
  { value: 6, label: '3-6 tháng', desc: 'Học từ từ, chắc chắn', icon: '🌤️' },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState('level'); // level -> time -> placement (optional) -> result
  const [level, setLevel] = useState(null);
  const [targetMonths, setTargetMonths] = useState(null);
  const [placementQuestions, setPlacementQuestions] = useState([]);
  const [placementAnswers, setPlacementAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [roadmapResult, setRoadmapResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelectLevel = (val) => {
    setLevel(val);
    setStep('time');
  };

  const handleSelectTime = async (months) => {
    setTargetMonths(months);
    if (level === 'some_knowledge') {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/onboarding/placement-test`);
        const data = await res.json();
        setPlacementQuestions(data);
        setStep('placement');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      await submitOnboarding(months, null);
    }
  };

  const handlePlacementAnswer = (selected) => {
    const qId = placementQuestions[currentQ].id;
    setPlacementAnswers({ ...placementAnswers, [qId]: selected });
  };

  const handleNextQuestion = async () => {
    if (currentQ < placementQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const answersArray = Object.entries(placementAnswers).map(([id, selected]) => ({
        id: parseInt(id),
        selected,
      }));
      await submitOnboarding(targetMonths, answersArray);
    }
  };

  const submitOnboarding = async (months, answers) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          targetMonths: months,
          placementAnswers: answers,
        }),
      });
      const data = await res.json();
      setRoadmapResult(data);
      setStep('result');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>🎓 HSK Learning</h1>
          <p>Hãy cho mình biết một chút về bạn để tạo lộ trình học phù hợp</p>
        </div>

        {/* Progress dots */}
        <div className="onboarding-progress">
          <span className={`dot ${['level', 'time', 'placement', 'result'].indexOf(step) >= 0 ? 'active' : ''}`} />
          <span className={`dot ${['time', 'placement', 'result'].indexOf(step) >= 0 ? 'active' : ''}`} />
          <span className={`dot ${['placement', 'result'].indexOf(step) >= 0 ? 'active' : ''}`} />
          <span className={`dot ${step === 'result' ? 'active' : ''}`} />
        </div>

        {loading && (
          <div className="onboarding-loading">
            <div className="loader" />
            <p>Đang xử lý...</p>
          </div>
        )}

        {!loading && step === 'level' && (
          <div className="onboarding-step">
            <h2>Trình độ tiếng Trung hiện tại của bạn?</h2>
            <div className="option-cards">
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className="option-card"
                  onClick={() => handleSelectLevel(opt.value)}
                >
                  <span className="option-icon">{opt.icon}</span>
                  <span className="option-label">{opt.label}</span>
                  <span className="option-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && step === 'time' && (
          <div className="onboarding-step">
            <h2>Bạn muốn đạt HSK 1 trong bao lâu?</h2>
            <div className="option-cards">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className="option-card"
                  onClick={() => handleSelectTime(opt.value)}
                >
                  <span className="option-icon">{opt.icon}</span>
                  <span className="option-label">{opt.label}</span>
                  <span className="option-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
            <button className="btn-back" onClick={() => setStep('level')}>
              ← Quay lại
            </button>
          </div>
        )}

        {!loading && step === 'placement' && placementQuestions.length > 0 && (
          <div className="onboarding-step">
            <div className="placement-progress-text">
              Câu {currentQ + 1}/{placementQuestions.length}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((currentQ + 1) / placementQuestions.length) * 100}%` }}
              />
            </div>

            <h2>{placementQuestions[currentQ].question}</h2>
            <div className="placement-options">
              {placementQuestions[currentQ].options.map((opt, idx) => (
                <button
                  key={idx}
                  className={`placement-option-btn ${
                    placementAnswers[placementQuestions[currentQ].id] === idx ? 'selected' : ''
                  }`}
                  onClick={() => handlePlacementAnswer(idx)}
                >
                  {opt}
                </button>
              ))}
            </div>

            <button
              className="btn-primary"
              disabled={placementAnswers[placementQuestions[currentQ].id] === undefined}
              onClick={handleNextQuestion}
            >
              {currentQ < placementQuestions.length - 1 ? 'Câu tiếp theo →' : 'Hoàn thành bài test'}
            </button>
          </div>
        )}

        {!loading && step === 'result' && roadmapResult && (
          <div className="onboarding-step result-step">
            <div className="result-icon">🎉</div>
            <h2>Lộ trình học của bạn đã sẵn sàng!</h2>

            {roadmapResult.placementBreakdown && (
              <div className="placement-result-box">
                <p>
                  Điểm placement test: <strong>{roadmapResult.profile.placement_test_score}%</strong>
                </p>
                <p className="placement-explain">{roadmapResult.roadmap.startingReason}</p>
              </div>
            )}

            <div className="roadmap-summary">
              <div className="roadmap-stat">
                <span className="roadmap-stat-value">{roadmapResult.roadmap.startingLessonOrder}</span>
                <span className="roadmap-stat-label">Bắt đầu từ bài</span>
              </div>
              <div className="roadmap-stat">
                <span className="roadmap-stat-value">{roadmapResult.roadmap.lessonsPerWeek}</span>
                <span className="roadmap-stat-label">Bài/tuần</span>
              </div>
              <div className="roadmap-stat">
                <span className="roadmap-stat-value">{roadmapResult.roadmap.wordsPerDay}</span>
                <span className="roadmap-stat-label">Từ mới/ngày</span>
              </div>
              <div className="roadmap-stat">
                <span className="roadmap-stat-value">{roadmapResult.roadmap.totalWeeksEstimate}</span>
                <span className="roadmap-stat-label">Tuần dự kiến</span>
              </div>
            </div>

            <div className="roadmap-dates">
              <p>
                📅 Bắt đầu: <strong>{new Date(roadmapResult.roadmap.roadmapStartDate).toLocaleDateString('vi-VN')}</strong>
              </p>
              <p>
                🎯 Dự kiến hoàn thành: <strong>{new Date(roadmapResult.roadmap.roadmapTargetEndDate).toLocaleDateString('vi-VN')}</strong>
              </p>
            </div>

            <div className="roadmap-features">
              <p>✅ Quiz tự động cuối mỗi tuần</p>
              <p>✅ Test tổng cuối mỗi tháng</p>
              <p>✅ Lộ trình tự điều chỉnh nếu bạn học chậm/nhanh hơn</p>
            </div>

            <button className="btn-primary btn-large" onClick={() => onComplete(roadmapResult.profile)}>
              Bắt đầu học ngay 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
