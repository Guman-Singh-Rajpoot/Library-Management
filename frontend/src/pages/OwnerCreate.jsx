import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function OwnerCreate() {
  const [seats, setSeats] = useState(20);
  const [charge, setCharge] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    api.estimateCharge(seats || 0)
      .then((r) => { if (!cancelled) setCharge(r.charge); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [seats]);

  function continueToDetails() {
    if (!seats || seats < 1) { setError('Enter at least 1 seat.'); return; }
    navigate('/owner/details', { state: { seats: Number(seats) } });
  }

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <div className="breadcrumb"><b>Step 2 of 3</b> — Create a library</div>
      <div className="card">
        <h2>How many seats will your library offer?</h2>
        <p className="lead">Your listing charge is calculated from the number of seats.</p>
        {error && <div className="error-box">{error}</div>}
        <div className="form-group">
          <label>Total seats</label>
          <input type="number" min="1" value={seats} onChange={(e) => setSeats(e.target.value)} />
        </div>
        <div className="stat" style={{ textAlign: 'left', padding: 16 }}>
          <div className="lbl">Estimated listing charge</div>
          <div className="num" style={{ color: 'var(--owner)' }}>₹{charge.toLocaleString('en-IN')}</div>
          <div className="note">Demo formula: ₹45/seat, +₹20/seat above 50 seats.</div>
        </div>
        <div style={{ height: 14 }} />
        <button className="btn btn-owner btn-block" onClick={continueToDetails}>Continue to library details →</button>
      </div>
    </div>
  );
}
