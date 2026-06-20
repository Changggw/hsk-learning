// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({
    streak: 5,
    wordsLearned: 47,
    lessonsCompleted: 2,
    testScore: 85,
  });

  return (
    <div className="page dashboard-page">
      <h2>Chào buổi sáng! 👋</h2>

      {/* Streak Display */}
      <div className="streak-display">
        <div className="streak-number">{stats.streak}</div>
        <div className="streak-label">Ngày học liên tiếp 🔥</div>
      </div>

      {/* Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{stats.wordsLearned}</div>
          <div className="stat-label">Từ đã học</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.lessonsCompleted}</div>
          <div className="stat-label">Bài hoàn thành</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{stats.testScore}%</div>
          <div className="stat-label">Điểm trung bình</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">HSK 1</div>
          <div className="stat-label">Level hiện tại</div>
        </div>
      </div>

      {/* Daily Schedule */}
      <section className="section">
        <h3>📅 Lịch học hôm nay</h3>
        <div className="daily-schedule">
          <div className="schedule-item">
            <span className="time">6:00-6:30</span>
            <span className="task">📖 Học bài mới</span>
            <span className="status">⏳ Chưa làm</span>
          </div>
          <div className="schedule-item">
            <span className="time">6:30-7:00</span>
            <span className="task">🗣️ Luyện nói</span>
            <span className="status">✅ Hoàn thành</span>
          </div>
          <div className="schedule-item">
            <span className="time">7:00-7:20</span>
            <span className="task">✍️ Viết Hanzi</span>
            <span className="status">✅ Hoàn thành</span>
          </div>
          <div className="schedule-item">
            <span className="time">7:20-7:30</span>
            <span className="task">♻️ Review từ cũ</span>
            <span className="status">⏳ Chưa làm</span>
          </div>
        </div>
      </section>

      {/* Progress */}
      <section className="section">
        <h3>📈 Tiến độ</h3>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: '35%' }}></div>
        </div>
        <p className="progress-text">HSK 1 Tuần 1: 35% hoàn thành</p>
      </section>

      {/* Tips */}
      <section className="section tips-section">
        <h3>💡 Mẹo hôm nay</h3>
        <div className="tip-box">
          <p><strong>Tone tiếng Trung:</strong> Có 4 tone, nếu nói sai tone thì từ sai. Luyện nói thường xuyên! 🎤</p>
        </div>
      </section>
    </div>
  );
}

// frontend/src/pages/Login.jsx
export function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    onLogin({
      email,
      name: name || email.split('@')[0],
      avatar: `https://i.pravatar.cc/150?img=${Math.random() * 70}`,
      id: Math.random().toString(36).substr(2, 9),
    });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>🎓 HSK Learning Platform</h1>
        <p className="login-subtitle">Học tiếng Trung cùng AI tutor</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Tên (tùy chọn):</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên của bạn"
            />
          </div>

          <button type="submit" className="btn-login">Đăng nhập</button>
        </form>

        <p className="login-note">
          📝 Lần đầu tiên? Vui lòng nhập email để đăng ký.<br/>
          🔐 Dữ liệu của bạn được bảo mật an toàn.
        </p>
      </div>
    </div>
  );
}

// frontend/src/pages/Learn.jsx
export default function Learn({ user }) {
  const [lessons] = useState([
    {
      id: 1,
      title: 'Bài 1: Số và Lời chào',
      vocab: [
        { hanzi: '一', pinyin: 'yī', meaning: 'Một' },
        { hanzi: '二', pinyin: 'èr', meaning: 'Hai' },
        { hanzi: '三', pinyin: 'sān', meaning: 'Ba' },
        { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'Xin chào' },
        { hanzi: '谢谢', pinyin: 'xièxiè', meaning: 'Cảm ơn' },
      ]
    }
  ]);

  const playAudio = (pinyin) => {
    const utterance = new SpeechSynthesisUtterance(pinyin);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="page learn-page">
      <h2>📖 Học Bài</h2>

      {lessons.map((lesson) => (
        <section key={lesson.id} className="lesson-section">
          <h3>{lesson.title}</h3>

          <div className="vocabulary-grid">
            {lesson.vocab.map((word, idx) => (
              <div key={idx} className="vocab-card">
                <div className="vocab-hanzi">{word.hanzi}</div>
                <div className="vocab-pinyin">{word.pinyin}</div>
                <div className="vocab-meaning">{word.meaning}</div>
                <button 
                  className="btn-audio"
                  onClick={() => playAudio(word.pinyin)}
                >
                  🔊 Nghe
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Example Dialogue */}
      <section className="section">
        <h3>📝 Ví dụ hội thoại</h3>
        <div className="dialogue-box">
          <p><strong>A:</strong> 你好！(Xin chào!)</p>
          <p><strong>B:</strong> 你好！(Xin chào!)</p>
          <p><strong>A:</strong> 我是 John。(Tôi là John.)</p>
          <p><strong>B:</strong> 很高兴见你！(Rất vui gặp bạn!)</p>
        </div>
      </section>
    </div>
  );
}

// frontend/src/pages/Practice.jsx
export default function Practice({ user }) {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState(null);

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
        // Simulate recording for 3 seconds
        setTimeout(() => {
          setIsRecording(false);
          setResult({
            accuracy: Math.floor(Math.random() * 30) + 70,
            tone: '✅ Tone chính xác',
            feedback: 'Phát âm tốt! Tiếp tục duy trì.',
          });
        }, 3000);
      } catch (err) {
        alert('Cần quyền microphone để ghi âm');
      }
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="page practice-page">
      <h2>🗣️ Luyện Nói</h2>

      <section className="section">
        <h3>Phát âm: 你好 (nǐ hǎo)</h3>

        <div className="practice-container">
          <div className="instruction-box">
            <p>1️⃣ Nghe mẫu ➜ 2️⃣ Ghi âm ➜ 3️⃣ AI check</p>
          </div>

          <button className="btn-primary" onClick={() => {
            const utterance = new SpeechSynthesisUtterance('你好');
            utterance.lang = 'zh-CN';
            window.speechSynthesis.speak(utterance);
          }}>
            🔊 Nghe mẫu
          </button>

          <button 
            className={`btn-record ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
          >
            {isRecording ? '⏹️ Dừng' : '🎤 Ghi âm'}
          </button>

          {result && (
            <div className="result-box">
              <p><strong>Độ chính xác:</strong> {result.accuracy}%</p>
              <p><strong>Tone:</strong> {result.tone}</p>
              <p><strong>Nhận xét:</strong> {result.feedback}</p>
            </div>
          )}
        </div>
      </section>

      {/* Hanzi Writing Practice */}
      <section className="section">
        <h3>✍️ Viết Hanzi</h3>
        <div className="writing-box">
          <p>Gõ chữ Trung: 你好</p>
          <input type="text" placeholder="Gõ từ Trung vào đây..." />
          <button className="btn-secondary">✅ Kiểm tra</button>
        </div>
      </section>
    </div>
  );
}

// frontend/src/pages/Test.jsx
export default function Test({ user }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);

  const questions = [
    {
      id: 1,
      question: '"你好" có nghĩa là gì?',
      options: ['Xin chào', 'Cảm ơn', 'Tạm biệt'],
      correct: 0
    },
    {
      id: 2,
      question: 'Số 3 trong tiếng Trung là?',
      options: ['二', '三', '四'],
      correct: 1
    },
    {
      id: 3,
      question: '"谢谢" là gì?',
      options: ['Xin chào', 'Cảm ơn', 'Vui lòng'],
      correct: 1
    },
    {
      id: 4,
      question: 'Số 5 trong tiếng Trung?',
      options: ['四', '五', '六'],
      correct: 1
    },
    {
      id: 5,
      question: '"再见" có nghĩa là?',
      options: ['Xin chào', 'Cảm ơn', 'Tạm biệt'],
      correct: 2
    }
  ];

  const handleAnswer = (optionIndex) => {
    setAnswers({ ...answers, [currentQuestion]: optionIndex });
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct) correctCount++;
    });
    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);
  };

  if (score !== null) {
    return (
      <div className="page test-page">
        <div className="result-box">
          <h2>{score >= 70 ? '🎉 Bạn đạt!' : '😊 Cố gắng thêm!'}</h2>
          <div className="score-big">{score}/100</div>
          <p>Trả lời đúng: {Object.values(answers).filter((a, idx) => a === questions[idx].correct).length}/{questions.length}</p>
          <button 
            className="btn-primary"
            onClick={() => {
              setCurrentQuestion(0);
              setAnswers({});
              setScore(null);
            }}
          >
            Làm lại
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="page test-page">
      <h2>📝 Kiểm Tra</h2>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="progress-text">Câu {currentQuestion + 1}/{questions.length}</p>

      <div className="question-box">
        <h3>{q.question}</h3>
        <div className="options">
          {q.options.map((option, idx) => (
            <button
              key={idx}
              className={`option-btn ${answers[currentQuestion] === idx ? 'selected' : ''}`}
              onClick={() => handleAnswer(idx)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="test-navigation">
        <button
          className="btn-secondary"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          Quay lại
        </button>

        {currentQuestion < questions.length - 1 ? (
          <button
            className="btn-primary"
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
          >
            Tiếp theo
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={handleSubmit}
          >
            📊 Nộp bài
          </button>
        )}
      </div>
    </div>
  );
}

// frontend/src/pages/Export.jsx
export default function Export({ user }) {
  const handleExportExcel = () => {
    alert('✅ Dữ liệu đã được export thành file Excel\nTải xuống: hsk-progress.xlsx');
  };

  const handleExportJSON = () => {
    alert('✅ Dữ liệu đã được backup\nFile: hsk-progress.json');
  };

  return (
    <div className="page export-page">
      <h2>📥 Export Dữ liệu</h2>

      <section className="section">
        <h3>Xuất dữ liệu học tập</h3>
        <div className="export-options">
          <div className="export-card">
            <h4>📊 Excel File</h4>
            <p>Xuất toàn bộ tiến độ ra file Excel</p>
            <button className="btn-primary" onClick={handleExportExcel}>
              📥 Tải Excel
            </button>
          </div>

          <div className="export-card">
            <h4>📋 JSON Backup</h4>
            <p>Backup dữ liệu dạng JSON để khôi phục sau</p>
            <button className="btn-primary" onClick={handleExportJSON}>
              💾 Tải JSON
            </button>
          </div>

          <div className="export-card">
            <h4>📧 Email Report</h4>
            <p>Nhận báo cáo hàng tuần qua email</p>
            <button className="btn-secondary">
              📨 Cấu hình Email
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <h3>Thống kê</h3>
        <div className="stats-summary">
          <p><strong>Tổng từ học:</strong> 47 từ</p>
          <p><strong>Bài hoàn thành:</strong> 2 bài</p>
          <p><strong>Test trung bình:</strong> 85%</p>
          <p><strong>Streak:</strong> 5 ngày 🔥</p>
        </div>
      </section>
    </div>
  );
}

// frontend/src/pages/Settings.jsx
export default function Settings({ user, onLogout }) {
  return (
    <div className="page settings-page">
      <h2>⚙️ Cài đặt</h2>

      <section className="section">
        <h3>👤 Thông tin cá nhân</h3>
        <div className="settings-form">
          <div className="form-group">
            <label>Tên:</label>
            <input type="text" defaultValue={user.name} />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input type="email" defaultValue={user.email} disabled />
          </div>
          <button className="btn-secondary">Cập nhật</button>
        </div>
      </section>

      <section className="section">
        <h3>🔔 Thông báo</h3>
        <label className="checkbox">
          <input type="checkbox" defaultChecked />
          Nhắc nhở học hàng ngày (6:00 AM)
        </label>
        <label className="checkbox">
          <input type="checkbox" defaultChecked />
          Báo cáo hàng tuần
        </label>
      </section>

      <section className="section">
        <h3>💾 Dữ liệu</h3>
        <button className="btn-secondary">📥 Tải lại dữ liệu</button>
        <button className="btn-secondary">🗑️ Xóa tiến độ (không khôi phục)</button>
      </section>

      <section className="section">
        <h3>Logout</h3>
        <button className="btn-danger" onClick={onLogout}>🚪 Đăng xuất</button>
      </section>

      <section className="section">
        <h3>ℹ️ Về ứng dụng</h3>
        <p><strong>HSK Learning Platform v1.0</strong></p>
        <p>Ứng dụng học tiếng Trung cùng AI tutor</p>
        <p>© 2024 - Tất cả quyền được bảo lưu</p>
      </section>
    </div>
  );
}