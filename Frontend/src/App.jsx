// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Practice from './pages/Practice';
import Test from './pages/Test';
import Export from './pages/Export';
import Settings from './pages/Settings';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []); 

  const checkOnboarding = async () => {
    try {
      const res = await fetch(`${API_URL}/api/roadmap/status`);
      const data = await res.json();
      setNeedsOnboarding(!!data.onboardingRequired);
    } catch (err) {
      console.error('Onboarding check failed:', err);
    } finally {
      setOnboardingChecked(true);
    }
  };

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
    navigate('/dashboard');
  };

  if (!onboardingChecked) {
    return (
      <div className="loading-container">
        <div className="loader" />
        <p>Đang tải...</p>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const activeTab = location.pathname.replace('/', '') || 'dashboard';

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1>🎓 HSK Learning</h1>
          <p className="subtitle">Học tiếng Trung theo hệ thống HSK</p>
        </div>
      </header>

      <nav className="nav-tabs">
        <button className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => navigate('/dashboard')}>📊 Dashboard</button>
        <button className={`nav-tab ${activeTab === 'learn' ? 'active' : ''}`} onClick={() => navigate('/learn')}>📖 Reading</button>
        <button className={`nav-tab ${activeTab === 'listening' ? 'active' : ''}`} onClick={() => navigate('/listening')}>🎧 Listening</button>
        <button className={`nav-tab ${activeTab === 'writing' ? 'active' : ''}`} onClick={() => navigate('/writing')}>✍️ Writing</button>
        <button className={`nav-tab ${activeTab === 'speaking' ? 'active' : ''}`} onClick={() => navigate('/speaking')}>🎤 Speaking</button>
        <button className={`nav-tab ${activeTab === 'quiz' ? 'active' : ''}`} onClick={() => navigate('/quiz')}>📝 Quiz/Test</button>
        <button className={`nav-tab ${activeTab === 'export' ? 'active' : ''}`} onClick={() => navigate('/export')}>📥 Export</button>
        <button className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => navigate('/settings')}>⚙️ Cài đặt</button>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard onNavigate={(tab) => navigate(`/${tab}`)} />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/listening" element={<Practice skill="listening" />} />
          <Route path="/writing" element={<Practice skill="writing" />} />
          <Route path="/speaking" element={<Practice skill="speaking" />} />
          <Route path="/quiz" element={<Test />} />
          <Route path="/export" element={<Export />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Dashboard onNavigate={(tab) => navigate(`/${tab}`)} />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>🚀 HSK Learning Platform v2.0 | Học tiếng Trung dễ dàng hơn</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
