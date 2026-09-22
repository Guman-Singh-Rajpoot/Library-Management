import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';

function availabilityClass(available, total) {
  if (available === 0) return 'full';
  if (available / total < 0.25) return 'low';
  return 'ok';
}

export default function StudentSearch() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function load(query) {
    setLoading(true);
    setError('');
    try {
      const r = await api.searchLibraries(query);
      setLibraries(r.libraries);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(params.get('q') || ''); }, []); // eslint-disable-line

  function onSearch(e) {
    e.preventDefault();
    setParams(q ? { q } : {});
    load(q);
  }

  function bookNow(libId) {
    navigate('/student/details', { state: { libraryId: libId } });
  }

  return (
    <div className="container wide">
      <h1>🔍 Find a library</h1>
      <form className="search-bar" style={{ marginBottom: 22 }} onSubmit={onSearch}>
        <input type="text" placeholder="Search by library name…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-student" type="submit">Search</button>
      </form>

      {error && <div className="error-box">{error}</div>}
      {loading && <p className="note">Loading libraries…</p>}

      {!loading && libraries.length === 0 && (
        <div className="empty">No libraries match yet. Try a different search, or check back once an owner has listed one.</div>
      )}

      {libraries.map((lib) => {
        const cls = availabilityClass(lib.availableSeats, lib.totalSeats);
        return (
          <div key={lib.id} className="lib-card">
            <div className="lib-head">
              <div>
                <h3>{lib.name}</h3>
                <p className="note">{lib.structure} · ₹{lib.fees}/month{lib.videoName ? ' · 🎬 intro video available' : ''}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={`avail ${cls}`}>{lib.availableSeats === 0 ? 'Fully booked' : `${lib.availableSeats} seats available`}</div>
                <div className="note">{lib.bookedSeats} booked · {lib.totalSeats} total</div>
              </div>
            </div>
            <div className="note" style={{ margin: '8px 0 4px' }}><b>Shifts:</b> {lib.shifts.length ? lib.shifts.join(', ') : 'Not specified'}</div>
            <div>
              {lib.facilities.length
                ? lib.facilities.map((f, i) => <span key={i} className="facility-tag">{f}</span>)
                : <span className="note">No facilities listed</span>}
            </div>
            {lib.coupons.length > 0 && (
              <p className="note" style={{ marginTop: 8 }}>
                🏷️ Coupons available: {lib.coupons.map((c) => `${c.code} (${c.percent}% off)`).join(', ')}
              </p>
            )}
            {lib.other && <p className="note">{lib.other}</p>}
            <div style={{ height: 10 }} />
            <button className="btn btn-student" disabled={lib.availableSeats === 0} onClick={() => bookNow(lib.id)}>
              📌 Book Now
            </button>
          </div>
        );
      })}
    </div>
  );
}
