// frontend/src/pages/Learn.jsx
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Learn() {
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({});
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [vocabulary, setVocabulary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    loadLessons();
  }, []);

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

  const openLesson = async (lesson) => {
    setSelectedLesson(lesson);
    try {
      const res = await fetch(`${API_URL}/api/vocabulary/${lesson.id}`);
      const data = await res.json();
      setVocabulary(data);
    } catch (err) {
      console.error(err);
    }
  };

  const playAudio = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const markReadingDone = async () => {
    if (!selectedLesson) return;
    setMarking(true);
    try {
      await fetch(`${API_URL}/api/progress/update-skill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: selectedLesson.id, skill: 'reading' }),
      });
      await loadLessons();
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="page learn-page">
        <div className="loader-inline">
          <div className="loader" />
          <p>Đang tải bài học...</p>
        </div>
      </div>
    );
  }

  // ===== Lesson list view =====
  if (!selectedLesson) {
    return (
      <div className="page learn-page">
        <h2>📖 Reading - Danh sách bài học</h2>
        <p className="page-subtitle">HSK 1 · 30 bài học · 300 từ vựng</p>

        <div className="lesson-grid">
          {lessons.map((lesson) => {
            const p = progress[lesson.id];
            const isCompleted = p?.status === 'completed';
            const isInProgress = p?.status === 'in_progress';
            const readingDone = p?.reading_done;

            return (
              <button key={lesson.id} className="lesson-card" onClick={() => openLesson(lesson)}>
                <div className="lesson-card-top">
                  <span className="lesson-number">Bài {lesson.order_num}</span>
                  {isCompleted && <span className="lesson-badge done">✓ Hoàn thành</span>}
                  {!isCompleted && isInProgress && <span className="lesson-badge progress">Đang học</span>}
                  {readingDone && !isCompleted && <span className="lesson-badge reading">📖 Đã đọc</span>}
                </div>
                <h4>{lesson.title}</h4>
                <p className="lesson-desc">{lesson.description}</p>
                <span className="lesson-topic">{lesson.topic}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== Lesson detail view =====
  const p = progress[selectedLesson.id];
  const alreadyDone = p?.reading_done;

  return (
    <div className="page learn-page">
      <button className="btn-back" onClick={() => setSelectedLesson(null)}>
        ← Quay lại danh sách
      </button>

      <h2>
        Bài {selectedLesson.order_num}: {selectedLesson.title}
      </h2>
      <p className="page-subtitle">{selectedLesson.description}</p>

      <section className="lesson-section">
        <h3>📝 Từ vựng ({vocabulary.length} từ)</h3>
        <div className="vocabulary-grid">
          {vocabulary.map((word) => (
            <div key={word.id} className="vocab-card">
              <div className="vocab-hanzi">{word.hanzi}</div>
              <div className="vocab-pinyin">{word.pinyin}</div>
              <div className="vocab-meaning">{word.meaning}</div>
              {word.example_text && <div className="vocab-example">{word.example_text}</div>}
              <button className="btn-audio" onClick={() => playAudio(word.hanzi)}>
                🔊 Nghe
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h3>✅ Hoàn thành phần đọc</h3>
        <p>Đã xem hết {vocabulary.length} từ vựng trong bài này chưa?</p>
        <button
          className="btn-primary"
          onClick={markReadingDone}
          disabled={marking || alreadyDone}
        >
          {alreadyDone ? '✓ Đã hoàn thành Reading' : marking ? 'Đang lưu...' : 'Đánh dấu hoàn thành Reading'}
        </button>
        <p className="hint-text">
          💡 Tiếp theo, hãy qua tab 🎧 Listening, ✍️ Writing, 🎤 Speaking để hoàn thành đủ 4 kỹ năng của bài này!
        </p>
      </section>
    </div>
  );
}
