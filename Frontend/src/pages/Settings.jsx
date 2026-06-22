// frontend/src/pages/Settings.jsx
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/profile`)
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const levelLabel = {
    absolute_beginner: 'Chưa biết gì về tiếng Trung',
    beginner: 'Mới bắt đầu',
    some_knowledge: 'Biết chút ít kiến thức',
  };

  if (loading) {
    return (
      <div className="page settings-page">
        <div className="loader-inline">
          <div className="loader" />
        </div>
      </div>
    );
  }

  return (
    <div className="page settings-page">
      <h2>⚙️ Cài đặt</h2>

      <section className="section">
        <h3>👤 Thông tin học tập</h3>
        <div className="settings-info-list">
          <p>
            <strong>Trình độ ban đầu:</strong> {levelLabel[profile?.current_level] || '--'}
          </p>
          <p>
            <strong>Mục tiêu:</strong> HSK {profile?.target_hsk_level} trong {profile?.target_months} tháng
          </p>
          <p>
            <strong>Tốc độ học:</strong> {profile?.lessons_per_week} bài/tuần (~{profile?.words_per_day} từ/ngày)
          </p>
          <p>
            <strong>Ngày bắt đầu:</strong>{' '}
            {profile?.roadmap_start_date ? new Date(profile.roadmap_start_date).toLocaleDateString('vi-VN') : '--'}
          </p>
          <p>
            <strong>Dự kiến hoàn thành:</strong>{' '}
            {profile?.roadmap_target_end_date
              ? new Date(profile.roadmap_target_end_date).toLocaleDateString('vi-VN')
              : '--'}
          </p>
        </div>
      </section>

      <section className="section">
        <h3>🔥 Streak</h3>
        <div className="settings-info-list">
          <p>
            <strong>Hiện tại:</strong> {profile?.current_streak || 0} ngày
          </p>
          <p>
            <strong>Kỷ lục:</strong> {profile?.longest_streak || 0} ngày
          </p>
        </div>
      </section>

      <section className="section">
        <h3>ℹ️ Về ứng dụng</h3>
        <p>
          <strong>HSK Learning Platform v2.0</strong>
        </p>
        <p>Học tiếng Trung theo chuẩn HSK 3.0 (2025) - HSK 1: 300 từ, 30 bài học</p>
        <p>4 kỹ năng: Đọc - Nghe - Viết - Nói, với AI chấm phát âm (iFLYTEK)</p>
      </section>
    </div>
  );
}
