import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function OwnerDashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const refresh = useCallback(async () => {
    try {
      const lib = await api.myLibrary(session.token);
      const full = await api.dashboard(lib.library.id, session.token);
      setData(full);
    } catch (err) {
      if (err.message.includes('not created')) {
        navigate('/owner/create');
      } else {
        setError(err.message);
      }
    }
  }, [session.token, navigate]);

  useEffect(() => { refresh(); }, [refresh]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  async function addSeat() {
    const n = parseInt(prompt('How many seats to add?', '1'), 10);
    if (!n || n < 1) return;
    try {
      await api.addSeats(data.library.id, n, session.token);
      showToast(`Added ${n} seat(s).`);
      refresh();
    } catch (err) { alert(err.message); }
  }

  async function addCoupon() {
    const code = prompt('Coupon code (e.g. SAVE10):');
    if (!code) return;
    const percent = parseInt(prompt('Discount percentage (e.g. 10):', '10'), 10) || 0;
    try {
      await api.addCoupon(data.library.id, code, percent, session.token);
      showToast('Coupon added.');
      refresh();
    } catch (err) { alert(err.message); }
  }

  async function addFacility() {
    const f = prompt('Facility name (e.g. Air Conditioning):');
    if (!f) return;
    try {
      await api.addFacility(data.library.id, f, session.token);
      showToast('Facility added.');
      refresh();
    } catch (err) { alert(err.message); }
  }

  if (error) return <div className="container"><div className="error-box">{error}</div></div>;
  if (!data) return <div className="container"><p className="note">Loading dashboard…</p></div>;

  const { library, stats, bookings } = data;

  return (
    <div className="container wide">
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--text)', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: '.88rem', zIndex: 100 }}>
          {toast}
        </div>
      )}

      <div className="lib-head" style={{ marginBottom: 14 }}>
        <div>
          <h1>📊 {library.name}</h1>
          <p className="note">Owner: {library.ownerName} · {library.structure} · ₹{library.fees}/month</p>
        </div>
        <span className="badge-small">Listing charge paid: ₹{library.charge}</span>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat"><div className="num">{stats.joinedStudents}</div><div className="lbl">Joined students</div></div>
        <div className="stat"><div className="num">₹{stats.totalRevenue.toLocaleString('en-IN')}</div><div className="lbl">Total revenue</div></div>
        <div className="stat"><div className="num">{stats.bookedSeats}/{stats.totalSeats}</div><div className="lbl">Seats filled</div></div>
        <div className="stat"><div className="num">{stats.progressPercent}%</div><div className="lbl">Progress</div></div>
      </div>

      <div className="card">
        <h2>Joined students</h2>
        {bookings.length ? (
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Seat</th><th>Amount</th><th>Method</th></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}><td>{b.studentName}</td><td>{b.phone}</td><td>{b.seatLabel}</td><td>₹{b.amount}</td><td>{b.method}</td></tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">No bookings yet — share your library to get your first student.</div>}
      </div>

      <div className="card">
        <h2>Facilities</h2>
        {library.facilities.length
          ? library.facilities.map((f, i) => <span key={i} className="facility-tag">{f}</span>)
          : <span className="note">None added yet.</span>}
        <div style={{ height: 10 }} />
        <h2>Coupons</h2>
        {library.coupons.length ? (
          <table>
            <thead><tr><th>Code</th><th>Discount</th></tr></thead>
            <tbody>{library.coupons.map((c, i) => <tr key={i}><td>{c.code}</td><td>{c.percent}%</td></tr>)}</tbody>
          </table>
        ) : <span className="note">None added yet.</span>}
      </div>

      <div className="card">
        <h2>Owner actions</h2>
        <div className="row">
          <button className="btn btn-owner" onClick={addSeat}>➕ Add seat</button>
          <button className="btn btn-owner" onClick={addCoupon}>🏷️ Add coupon</button>
          <button className="btn btn-owner" onClick={addFacility}>🛠️ Add facility</button>
        </div>
      </div>
    </div>
  );
}
