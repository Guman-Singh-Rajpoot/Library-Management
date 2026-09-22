import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function StudentConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const bookingId = location.state?.bookingId;
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) { navigate('/student/search'); return; }
    api.getBooking(bookingId, session.token).then((r) => setBooking(r.booking)).catch((e) => setError(e.message));
  }, [bookingId]); // eslint-disable-line

  if (error) return <div className="container"><div className="error-box">{error}</div></div>;
  if (!booking) return <div className="container"><p className="note">Loading receipt…</p></div>;

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.4rem' }}>✅</div>
        <h2>Booking confirmed!</h2>
        <p className="lead">Your seat at {booking.libraryName} is reserved.</p>
        <div className="receipt" style={{ textAlign: 'left' }}>
          <div className="receipt-row"><span>Booking ID</span><span>{booking.id.slice(0, 8).toUpperCase()}</span></div>
          <div className="receipt-row"><span>Library</span><span>{booking.libraryName}</span></div>
          <div className="receipt-row"><span>Seat</span><span>{booking.seatLabel}</span></div>
          <div className="receipt-row"><span>Student</span><span>{booking.studentName}</span></div>
          <div className="receipt-row"><span>Payment method</span><span>{booking.method}</span></div>
          {booking.coupon && <div className="receipt-row"><span>Coupon</span><span>{booking.coupon}</span></div>}
          <div className="receipt-row"><span>Amount paid</span><span>₹{booking.amount}</span></div>
        </div>
        <div className="row no-print" style={{ marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={() => window.print()}>🖨️ Print / Save receipt</button>
          <Link to="/student/search"><button className="btn btn-student btn-block">Browse more libraries</button></Link>
        </div>
      </div>
    </div>
  );
}
