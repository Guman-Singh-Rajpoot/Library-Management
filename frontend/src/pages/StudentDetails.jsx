import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function StudentDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();

  const libraryId = location.state?.libraryId;
  const [name, setName] = useState(session?.user?.name || '');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!libraryId) {
    navigate('/student/search');
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await api.createBooking({ libraryId, name, phone, aadhaar }, session.token);
      navigate('/student/payment', { state: { bookingId: r.booking.id } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="breadcrumb"><b>Step 2 of 3</b> — Your details</div>
      <div className="card">
        <h2>Student details</h2>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Phone number</label>
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" />
          </div>
          <div className="form-group">
            <label>Aadhaar number</label>
            <input type="text" required value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} placeholder="XXXX XXXX XXXX" maxLength={14} />
          </div>
          <div className="note">Demo only — no real ID data is verified against any government database.</div>
          <div style={{ height: 14 }} />
          <button className="btn btn-student btn-block" disabled={loading}>
            {loading ? 'Reserving your seat…' : 'Proceed →'}
          </button>
        </form>
      </div>
    </div>
  );
}
