// frontend/src/pages/Login.jsx
import { useState } from 'react';
export default function Login({ onLogin }) {
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