// frontend/src/pages/Practice.jsx
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const SKILL_CONFIG = {
  listening: { title: '🎧 Listening', subtitle: 'Nghe và chọn đáp án đúng' },
  writing: { title: '✍️ Writing', subtitle: 'Đặt câu với từ vựng đã học' },
  speaking: { title: '🎤 Speaking', subtitle: 'Đọc to và để AI chấm phát âm' },
};

export default function Practice({ skill }) {
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({});
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedLesson(null);
    loadLessons();
  }, [skill]);

  const loadLessons = async () => {
    setLoading(true);
    try {
      const [lessonsRes, progressRes] = await Promise.all([
        fetch(`${API_URL}/api/lessons`).then((r) => r.json()),
        fetch(`${API_URL}/api/progress`).then((r) => r.json()),
      ]);
      setLessons(lessonsRes);
      const progressMap = {};
      progressRes.forEach((p) => {
        progressMap[p.lesson_id] = p;
      });
      setProgress(progressMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const config = SKILL_CONFIG[skill];

  if (loading) {
    return (
      <div className="page practice-page">
        <div className="loader-inline">
          <div className="loader" />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!selectedLesson) {
    return (
      <div className="page practice-page">
        <h2>{config.title} - Chọn bài học</h2>
        <p className="page-subtitle">{config.subtitle}</p>

        <div className="lesson-grid">
          {lessons.map((lesson) => {
            const p = progress[lesson.id];
            const skillDone = p?.[`${skill}_done`];
            const readingDone = p?.reading_done;

            return (
              <button
                key={lesson.id}
                className={`lesson-card ${!readingDone ? 'lesson-card-locked' : ''}`}
                onClick={() => readingDone && setSelectedLesson(lesson)}
                disabled={!readingDone}
              >
                <div className="lesson-card-top">
                  <span className="lesson-number">Bài {lesson.order_num}</span>
                  {skillDone && <span className="lesson-badge done">✓ Hoàn thành</span>}
                  {!readingDone && <span className="lesson-badge locked">🔒 Cần đọc trước</span>}
                </div>
                <h4>{lesson.title}</h4>
                <span className="lesson-topic">{lesson.topic}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (skill === 'listening') {
    return <ListeningExercise lesson={selectedLesson} onBack={() => setSelectedLesson(null)} onComplete={loadLessons} />;
  }
  if (skill === 'writing') {
    return <WritingExercise lesson={selectedLesson} onBack={() => setSelectedLesson(null)} onComplete={loadLessons} />;
  }
  if (skill === 'speaking') {
    return <SpeakingExercise lesson={selectedLesson} onBack={() => setSelectedLesson(null)} onComplete={loadLessons} />;
  }
  return null;
}

// ============================================================
// LISTENING EXERCISE
// ============================================================
function ListeningExercise({ lesson, onBack, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/skills/listening/${lesson.id}`)
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.questions);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [lesson.id]);

  const playAudio = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.7;
    window.speechSynthesis.speak(utterance);
  };

  const handleSelect = (idx) => {
    setSelected(idx);
    if (idx === questions[current].correct) {
      setScore(score + 1);
    }
  };

  const handleNext = async () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setSelected(null);
    } else {
      setFinished(true);
      setMarking(true);
      try {
        await fetch(`${API_URL}/api/progress/update-skill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson_id: lesson.id, skill: 'listening' }),
        });
        onComplete();
      } catch (err) {
        console.error(err);
      } finally {
        setMarking(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="page practice-page">
        <div className="loader-inline">
          <div className="loader" />
        </div>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="page practice-page">
        <div className="result-box">
          <h2>{pct >= 70 ? '🎉 Hoàn thành tốt!' : '😊 Tiếp tục cố gắng!'}</h2>
          <div className="score-big">{score}/{questions.length}</div>
          <p>Độ chính xác: {pct}%</p>
          <button className="btn-primary" onClick={onBack}>
            Quay lại danh sách bài học
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="page practice-page">
      <button className="btn-back" onClick={onBack}>← Quay lại</button>
      <h2>🎧 Listening - Bài {lesson.order_num}</h2>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="progress-label">Câu {current + 1}/{questions.length}</p>

      <div className="listening-box">
        <p>{q.question}</p>
        <button className="btn-play-audio" onClick={() => playAudio(q.audio_text)}>
          🔊 Nghe từ
        </button>

        <div className="options">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              className={`option-btn ${selected === idx ? (idx === q.correct ? 'correct' : 'incorrect') : ''}`}
              onClick={() => selected === null && handleSelect(idx)}
              disabled={selected !== null}
            >
              {opt}
            </button>
          ))}
        </div>

        {selected !== null && (
          <button className="btn-primary" onClick={handleNext} disabled={marking}>
            {current < questions.length - 1 ? 'Câu tiếp theo →' : marking ? 'Đang lưu...' : 'Hoàn thành'}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// WRITING EXERCISE
// ============================================================
function WritingExercise({ lesson, onBack, onComplete }) {
  const [vocabulary, setVocabulary] = useState([]);
  const [current, setCurrent] = useState(0);
  const [sentence, setSentence] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/vocabulary/${lesson.id}`)
      .then((r) => r.json())
      .then((data) => {
        // Chỉ lấy 5 từ để luyện viết (tránh quá tải)
        setVocabulary(data.slice(0, 5));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [lesson.id]);

  const handleSubmit = async () => {
    if (!sentence.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/skills/writing/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vocabulary_id: vocabulary[current].id,
          lesson_id: lesson.id,
          prompt_word: vocabulary[current].hanzi,
          user_sentence: sentence,
        }),
      });
      const data = await res.json();
      setFeedback(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (current < vocabulary.length - 1) {
      setCurrent(current + 1);
      setSentence('');
      setFeedback(null);
    } else {
      setFinished(true);
      setMarking(true);
      try {
        await fetch(`${API_URL}/api/progress/update-skill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson_id: lesson.id, skill: 'writing' }),
        });
        onComplete();
      } catch (err) {
        console.error(err);
      } finally {
        setMarking(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="page practice-page">
        <div className="loader-inline">
          <div className="loader" />
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="page practice-page">
        <div className="result-box">
          <h2>🎉 Hoàn thành Writing!</h2>
          <p>Bạn đã luyện viết {vocabulary.length} câu trong bài {lesson.order_num}</p>
          <button className="btn-primary" onClick={onBack}>
            Quay lại danh sách bài học
          </button>
        </div>
      </div>
    );
  }

  const word = vocabulary[current];

  return (
    <div className="page practice-page">
      <button className="btn-back" onClick={onBack}>← Quay lại</button>
      <h2>✍️ Writing - Bài {lesson.order_num}</h2>
      <p className="progress-label">Từ {current + 1}/{vocabulary.length}</p>

      <div className="writing-box">
        <div className="writing-prompt">
          <span className="vocab-hanzi-large">{word.hanzi}</span>
          <span className="vocab-pinyin">{word.pinyin}</span>
          <span className="vocab-meaning">{word.meaning}</span>
        </div>

        <p className="instruction-text">Hãy đặt một câu có sử dụng từ này:</p>
        <textarea
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder="Gõ câu tiếng Trung của bạn vào đây..."
          disabled={!!feedback}
          rows={3}
        />

        {!feedback && (
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting || !sentence.trim()}>
            {submitting ? 'Đang chấm...' : '✅ Kiểm tra'}
          </button>
        )}

        {feedback && (
          <div className="writing-feedback">
            <div className="feedback-scores">
              <div className="feedback-score-item">
                <span>Ngữ pháp</span>
                <strong>{feedback.grammar_score}%</strong>
              </div>
              <div className="feedback-score-item">
                <span>Từ vựng</span>
                <strong>{feedback.vocab_score}%</strong>
              </div>
              <div className="feedback-score-item">
                <span>Tự nhiên</span>
                <strong>{feedback.naturalness_score}%</strong>
              </div>
            </div>
            <p className="feedback-text">{feedback.feedback}</p>
            <button className="btn-primary" onClick={handleNext} disabled={marking}>
              {current < vocabulary.length - 1 ? 'Từ tiếp theo →' : marking ? 'Đang lưu...' : 'Hoàn thành'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SPEAKING EXERCISE
// ============================================================
function SpeakingExercise({ lesson, onBack, onComplete }) {
  const [vocabulary, setVocabulary] = useState([]);
  const [current, setCurrent] = useState(0);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/vocabulary/${lesson.id}`)
      .then((r) => r.json())
      .then((data) => {
        setVocabulary(data.slice(0, 5)); // 5 từ để luyện nói
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [lesson.id]);

  const playAudio = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.7;
    window.speechSynthesis.speak(utterance);
  };

  const handleRecord = async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await analyzeAudio(blob);
      };

      recorder.start();
      setRecording(true);

      setTimeout(() => {
        recorder.stop();
        setRecording(false);
      }, 3000);
    } catch (err) {
      alert('Cần quyền microphone để ghi âm');
      console.error(err);
    }
  };

  const analyzeAudio = async (blob) => {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('vocabulary_id', vocabulary[current].id);
      formData.append('lesson_id', lesson.id);
      formData.append('target_hanzi', vocabulary[current].hanzi);
      formData.append('target_pinyin', vocabulary[current].pinyin);

      const res = await fetch(`${API_URL}/api/skills/speaking/analyze`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleNext = async () => {
    if (current < vocabulary.length - 1) {
      setCurrent(current + 1);
      setResult(null);
    } else {
      setFinished(true);
      setMarking(true);
      try {
        await fetch(`${API_URL}/api/progress/update-skill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson_id: lesson.id, skill: 'speaking' }),
        });
        onComplete();
      } catch (err) {
        console.error(err);
      } finally {
        setMarking(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="page practice-page">
        <div className="loader-inline">
          <div className="loader" />
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="page practice-page">
        <div className="result-box">
          <h2>🎉 Hoàn thành Speaking!</h2>
          <p>Bạn đã luyện nói {vocabulary.length} từ trong bài {lesson.order_num}</p>
          <button className="btn-primary" onClick={onBack}>
            Quay lại danh sách bài học
          </button>
        </div>
      </div>
    );
  }

  const word = vocabulary[current];

  return (
    <div className="page practice-page">
      <button className="btn-back" onClick={onBack}>← Quay lại</button>
      <h2>🎤 Speaking - Bài {lesson.order_num}</h2>
      <p className="progress-label">Từ {current + 1}/{vocabulary.length}</p>

      <div className="practice-container">
        <div className="speaking-prompt">
          <span className="vocab-hanzi-large">{word.hanzi}</span>
          <span className="vocab-pinyin">{word.pinyin}</span>
          <span className="vocab-meaning">{word.meaning}</span>
        </div>

        <div className="instruction-box">
          <p>1️⃣ Nghe mẫu → 2️⃣ Ghi âm (3 giây) → 3️⃣ AI chấm</p>
        </div>

        <button className="btn-secondary" onClick={() => playAudio(word.hanzi)}>
          🔊 Nghe mẫu
        </button>

        <button className={`btn-record ${recording ? 'recording' : ''}`} onClick={handleRecord} disabled={recording || analyzing}>
          {recording ? '🔴 Đang ghi âm...' : analyzing ? '⏳ Đang phân tích...' : '🎤 Ghi âm'}
        </button>

        {result && (
          <div className="result-box speaking-result">
            <p>
              <strong>Độ chính xác:</strong> {result.accuracy}%
            </p>
            {result.tone_accuracy && (
              <div className="tone-breakdown">
                {result.tone_accuracy.map((t, idx) => (
                  <span key={idx} className={`tone-chip ${t.correct ? 'tone-correct' : 'tone-wrong'}`}>
                    {t.syllable} {t.correct ? '✔' : '✘'}
                  </span>
                ))}
              </div>
            )}
            <p>
              <strong>Nhận xét:</strong> {result.feedback}
            </p>
            <button className="btn-primary" onClick={handleNext} disabled={marking}>
              {current < vocabulary.length - 1 ? 'Từ tiếp theo →' : marking ? 'Đang lưu...' : 'Hoàn thành'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
