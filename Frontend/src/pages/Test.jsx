// frontend/src/pages/Test.jsx
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Test() {
  const [mode, setMode] = useState('select'); // select | taking | result
  const [testType, setTestType] = useState(null); // weekly_quiz | monthly_test
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Answers state
  const [readingAnswers, setReadingAnswers] = useState({});
  const [listeningAnswers, setListeningAnswers] = useState({});
  const [writingAnswers, setWritingAnswers] = useState({});
  const [speakingDone, setSpeakingDone] = useState({});
  const [currentSection, setCurrentSection] = useState('reading'); // reading -> listening -> writing -> speaking
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const startTest = async (type) => {
    setLoading(true);
    setError(null);
    setTestType(type);
    try {
      const endpoint =
        type === 'weekly_quiz' ? '/api/quiz/weekly/generate' : '/api/test/monthly/generate';
      const res = await fetch(`${API_URL}${endpoint}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      setTest(data);
      setMode('taking');
      setCurrentSection('reading');
      setReadingAnswers({});
      setListeningAnswers({});
      setWritingAnswers({});
      setSpeakingDone({});
    } catch (err) {
      console.error(err);
      setError('Không thể tạo bài test. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.7;
    window.speechSynthesis.speak(utterance);
  };

  const calcReadingScore = () => {
    const qs = test.reading_questions;
    const correct = qs.filter((q) => readingAnswers[q.id] === q.correct).length;
    return Math.round((correct / qs.length) * 100);
  };

  const calcListeningScore = () => {
    const qs = test.listening_questions;
    const correct = qs.filter((q) => listeningAnswers[q.id] === q.correct).length;
    return Math.round((correct / qs.length) * 100);
  };

  const calcWritingScore = () => {
    const qs = test.writing_questions;
    const answered = qs.filter((q) => writingAnswers[q.id]?.trim().length > 0).length;
    // Mock scoring: dựa trên việc có viết câu chứa từ yêu cầu không
    let totalScore = 0;
    qs.forEach((q) => {
      const ans = writingAnswers[q.id] || '';
      if (ans.includes(q.prompt_word) && ans.length >= 4) totalScore += 100;
      else if (ans.trim().length > 0) totalScore += 50;
    });
    return qs.length ? Math.round(totalScore / qs.length) : 0;
  };

  const calcSpeakingScore = () => {
    const qs = test.speaking_questions;
    const scores = qs.map((q) => speakingDone[q.id]?.accuracy || 0);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  };

  const handleSubmitTest = async () => {
    setSubmitting(true);
    try {
      const readingScore = calcReadingScore();
      const listeningScore = calcListeningScore();
      const writingScore = calcWritingScore();
      const speakingScore = calcSpeakingScore();

      const res = await fetch(`${API_URL}/api/tests/${test.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readingScore,
          listeningScore,
          writingScore,
          speakingScore,
          test_type: testType,
          answers: { readingAnswers, listeningAnswers, writingAnswers },
        }),
      });
      const data = await res.json();
      setResult(data);
      setMode('result');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const recordSpeaking = async (question) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        formData.append('target_hanzi', question.target_hanzi);
        formData.append('target_pinyin', question.target_pinyin);

        const res = await fetch(`${API_URL}/api/skills/speaking/analyze`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        setSpeakingDone({ ...speakingDone, [question.id]: data });
      };
      recorder.start();
      setTimeout(() => recorder.stop(), 3000);
    } catch (err) {
      alert('Cần quyền microphone để ghi âm');
    }
  };

  // ===== SELECT MODE =====
  if (mode === 'select') {
    return (
      <div className="page test-page">
        <h2>📝 Quiz & Test</h2>
        <p className="page-subtitle">Kiểm tra kiến thức dựa trên các bài đã học</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="test-type-cards">
          <div className="test-type-card">
            <span className="test-type-icon">📅</span>
            <h3>Quiz Tuần</h3>
            <p>10 câu Reading + 10 câu Listening + 5 câu Writing + 5 câu Speaking</p>
            <p className="test-type-note">Dựa trên các từ vựng bạn đã học</p>
            <button className="btn-primary" onClick={() => startTest('weekly_quiz')} disabled={loading}>
              {loading && testType === 'weekly_quiz' ? 'Đang tạo...' : 'Bắt đầu Quiz'}
            </button>
          </div>

          <div className="test-type-card">
            <span className="test-type-icon">🏆</span>
            <h3>Test Tổng Tháng</h3>
            <p>20 câu Reading + 20 câu Listening + 8 câu Writing + 8 câu Speaking</p>
            <p className="test-type-note">Mô phỏng kỳ thi thật, có giới hạn thời gian 60 phút</p>
            <button className="btn-primary" onClick={() => startTest('monthly_test')} disabled={loading}>
              {loading && testType === 'monthly_test' ? 'Đang tạo...' : 'Bắt đầu Test'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== TAKING MODE =====
  if (mode === 'taking' && test) {
    const sections = ['reading', 'listening', 'writing', 'speaking'];
    const sectionIdx = sections.indexOf(currentSection);

    return (
      <div className="page test-page">
        <h2>{testType === 'weekly_quiz' ? '📅 Quiz Tuần' : '🏆 Test Tổng Tháng'}</h2>

        <div className="test-section-tabs">
          {sections.map((s, idx) => (
            <span key={s} className={`test-section-tab ${currentSection === s ? 'active' : ''} ${idx < sectionIdx ? 'done' : ''}`}>
              {s === 'reading' && '📖 Đọc'}
              {s === 'listening' && '🎧 Nghe'}
              {s === 'writing' && '✍️ Viết'}
              {s === 'speaking' && '🎤 Nói'}
            </span>
          ))}
        </div>

        {currentSection === 'reading' && (
          <div className="test-section">
            {test.reading_questions.map((q) => (
              <div key={q.id} className="question-box">
                <h4>{q.question}</h4>
                <div className="options">
                  {q.options.map((opt, idx) => (
                    <button
                      key={idx}
                      className={`option-btn ${readingAnswers[q.id] === idx ? 'selected' : ''}`}
                      onClick={() => setReadingAnswers({ ...readingAnswers, [q.id]: idx })}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button className="btn-primary" onClick={() => setCurrentSection('listening')}>
              Tiếp theo: Listening →
            </button>
          </div>
        )}

        {currentSection === 'listening' && (
          <div className="test-section">
            {test.listening_questions.map((q) => (
              <div key={q.id} className="question-box">
                <button className="btn-play-audio" onClick={() => playAudio(q.audio_text)}>
                  🔊 Nghe từ
                </button>
                <div className="options">
                  {q.options.map((opt, idx) => (
                    <button
                      key={idx}
                      className={`option-btn ${listeningAnswers[q.id] === idx ? 'selected' : ''}`}
                      onClick={() => setListeningAnswers({ ...listeningAnswers, [q.id]: idx })}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button className="btn-primary" onClick={() => setCurrentSection('writing')}>
              Tiếp theo: Writing →
            </button>
          </div>
        )}

        {currentSection === 'writing' && (
          <div className="test-section">
            {test.writing_questions.map((q) => (
              <div key={q.id} className="question-box">
                <h4>{q.instruction}</h4>
                <textarea
                  rows={2}
                  placeholder="Viết câu của bạn..."
                  value={writingAnswers[q.id] || ''}
                  onChange={(e) => setWritingAnswers({ ...writingAnswers, [q.id]: e.target.value })}
                />
              </div>
            ))}
            <button className="btn-primary" onClick={() => setCurrentSection('speaking')}>
              Tiếp theo: Speaking →
            </button>
          </div>
        )}

        {currentSection === 'speaking' && (
          <div className="test-section">
            {test.speaking_questions.map((q) => (
              <div key={q.id} className="question-box">
                <span className="vocab-hanzi-large">{q.target_hanzi}</span>
                <span className="vocab-pinyin">{q.target_pinyin}</span>
                <div>
                  <button className="btn-secondary" onClick={() => playAudio(q.target_hanzi)}>
                    🔊 Nghe mẫu
                  </button>
                  <button className="btn-record" onClick={() => recordSpeaking(q)}>
                    🎤 Ghi âm
                  </button>
                </div>
                {speakingDone[q.id] && <p className="inline-result">✓ Độ chính xác: {speakingDone[q.id].accuracy}%</p>}
              </div>
            ))}
            <button className="btn-primary btn-large" onClick={handleSubmitTest} disabled={submitting}>
              {submitting ? 'Đang chấm điểm...' : '📊 Nộp bài'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ===== RESULT MODE =====
  if (mode === 'result' && result) {
    return (
      <div className="page test-page">
        <div className="result-box">
          <h2>{result.overall_score >= 70 ? '🎉 Hoàn thành tốt!' : '😊 Cố gắng thêm!'}</h2>
          <div className="score-big">{result.overall_score}%</div>

          <div className="skill-scores-grid">
            <div className="skill-score-item">
              <span>📖 Đọc</span>
              <strong>{result.reading_score}%</strong>
            </div>
            <div className="skill-score-item">
              <span>🎧 Nghe</span>
              <strong>{result.listening_score}%</strong>
            </div>
            <div className="skill-score-item">
              <span>✍️ Viết</span>
              <strong>{result.writing_score}%</strong>
            </div>
            <div className="skill-score-item">
              <span>🎤 Nói</span>
              <strong>{result.speaking_score}%</strong>
            </div>
          </div>

          <div className="recommendation-box">
            <p>{result.analysis.recommendation}</p>
          </div>

          <button
            className="btn-primary"
            onClick={() => {
              setMode('select');
              setResult(null);
              setTest(null);
            }}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return null;
}
