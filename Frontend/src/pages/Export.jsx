// frontend/src/pages/Export.jsx
import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Export() {
  const [loading, setLoading] = useState(false);

  const handleExportJSON = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/export`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hsk-progress-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi export dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/export`);
      const data = await res.json();

      let csv = 'Lesson ID,Status,Reading,Listening,Writing,Speaking,Completed At\n';
      data.progress.forEach((p) => {
        csv += `${p.lesson_id},${p.status},${p.reading_done},${p.listening_done},${p.writing_done},${p.speaking_done},${p.completed_at || ''}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hsk-progress-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi export dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page export-page">
      <h2>📥 Export Dữ liệu</h2>

      <section className="section">
        <h3>Xuất dữ liệu học tập</h3>
        <div className="export-options">
          <div className="export-card">
            <h4>📊 CSV (Excel)</h4>
            <p>Xuất tiến độ ra file CSV, mở được bằng Excel/Google Sheets</p>
            <button className="btn-primary" onClick={handleExportCSV} disabled={loading}>
              {loading ? 'Đang xuất...' : '📥 Tải CSV'}
            </button>
          </div>

          <div className="export-card">
            <h4>📋 JSON Backup</h4>
            <p>Backup toàn bộ dữ liệu (profile, tiến độ, kết quả test) dạng JSON</p>
            <button className="btn-primary" onClick={handleExportJSON} disabled={loading}>
              {loading ? 'Đang xuất...' : '💾 Tải JSON'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
