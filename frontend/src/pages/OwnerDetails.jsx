import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const SHIFT_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Full day', '24 hours'];
const FACILITY_OPTIONS = ['WiFi', 'AC', 'Locker', 'Drinking water', 'Power backup', 'Printer', 'Cafeteria'];

function toggle(arr, value) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export default function OwnerDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();

  const seats = location.state?.seats;
  const [name, setName] = useState('');
  const [structure, setStructure] = useState('Open hall seating');
  const [fees, setFees] = useState('');
  const [shifts, setShifts] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [videoName, setVideoName] = useState('');
  const [other, setOther] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!seats) {
    navigate('/owner/create');
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Library name is required.'); return; }
    setLoading(true);
    try {
      await api.createLibrary({
        name, structure, fees: Number(fees) || 0, shifts, facilities,
        seats, other, videoName: videoName || null
      }, session.token);
      navigate('/owner/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="breadcrumb"><b>Step 3 of 3</b> — Library details</div>
      <div className="card">
        <h2>Tell students about your library</h2>
        <span className="badge-small">{seats} seats</span>
        <div style={{ height: 12 }} />
        {error && <div className="error-box">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="row">
            <div className="form-group">
              <label>Library name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunrise Study Hub" />
            </div>
            <div className="form-group">
              <label>Owner name</label>
              <input type="text" value={session.user.name} disabled />
            </div>
          </div>

          <div className="row">
            <div className="form-group">
              <label>Seating structure</label>
              <select value={structure} onChange={(e) => setStructure(e.target.value)}>
                <option>Open hall seating</option>
                <option>Individual cabins</option>
                <option>Mixed (cabins + open hall)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Fees (per month)</label>
              <input type="number" value={fees} onChange={(e) => setFees(e.target.value)} placeholder="e.g. 1200" />
            </div>
          </div>

          <div className="form-group">
            <label>Shifts offered</label>
            <div className="chips">
              {SHIFT_OPTIONS.map((s) => (
                <span key={s} className={`chip ${shifts.includes(s) ? 'on' : ''}`} onClick={() => setShifts(toggle(shifts, s))}>{s}</span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Facilities</label>
            <div className="chips">
              {FACILITY_OPTIONS.map((f) => (
                <span key={f} className={`chip ${facilities.includes(f) ? 'on' : ''}`} onClick={() => setFacilities(toggle(facilities, f))}>{f}</span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Intro video (optional)</label>
            <input type="file" accept="video/*" onChange={(e) => setVideoName(e.target.files[0]?.name || '')} />
            {videoName && <div className="note">{videoName}</div>}
          </div>

          <div className="form-group">
            <label>Other details</label>
            <textarea rows={3} value={other} onChange={(e) => setOther(e.target.value)} placeholder="Anything else students should know…" />
          </div>

          <button className="btn btn-owner btn-block" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit library details ✓'}
          </button>
        </form>
      </div>
    </div>
  );
}
