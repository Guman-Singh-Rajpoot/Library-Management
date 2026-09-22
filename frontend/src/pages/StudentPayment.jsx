import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function StudentPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();

  const bookingId = location.state?.bookingId;
  const [booking, setBooking] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [method, setMethod] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bookingId) { navigate('/student/search'); return; }
    api.getBooking(bookingId, session.token).then((r) => setBooking(r.booking)).catch((e) => setError(e.message));
  }, [bookingId]); // eslint-disable-line

  async function onPay() {
    setError('');
    if (!method) { setError('Choose a payment method.'); return; }
    setLoading(true);
    try {
      const r = await api.payBooking(bookingId, { method, couponCode: couponApplied ? couponCode : undefined }, session.token);
      navigate('/student/confirmation', { state: { bookingId: r.booking.id } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!booking) return <div className="container"><p className="note">Loading order…</p></div>;

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="breadcrumb"><b>Step 3 of 3</b> — Payment</div>
      <div className="card">
        <h2>Order summary</h2>
        <div className="receipt">
          <div className="receipt-row"><span>{booking.libraryName} — Seat {booking.seatLabel}</span><span>₹{booking.amount}</span></div>
          <div className="receipt-row"><span>Total</span><span>₹{booking.amount}</span></div>
        </div>

        {error && <div className="error-box" style={{ marginTop: 14 }}>{error}</div>}

        {!couponApplied ? (
          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Have a coupon?</label>
            <div className="row" style={{ gap: 8 }}>
              <input type="text" placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
              <button className="btn btn-ghost" style={{ flex: '0 0 auto' }} onClick={() => setCouponApplied(true)}>Apply at payment</button>
            </div>
            <div className="note">Coupon is validated when you pay.</div>
          </div>
        ) : (
          <p className="note">Coupon "{couponCode}" will be applied at payment.</p>
        )}

        <div className="form-group" style={{ marginTop: 16 }}>
          <label>Payment method</label>
          <div className="chips">
            <span className={`chip ${method === 'UPI' ? 'on' : ''}`} onClick={() => setMethod('UPI')}>📱 UPI</span>
            <span className={`chip ${method === 'Card' ? 'on' : ''}`} onClick={() => setMethod('Card')}>💳 Card</span>
          </div>
        </div>

        <button className="btn btn-student btn-block" onClick={onPay} disabled={loading}>
          {loading ? 'Processing…' : `Pay ₹${booking.amount} now`}
        </button>
      </div>
    </div>
  );
}
