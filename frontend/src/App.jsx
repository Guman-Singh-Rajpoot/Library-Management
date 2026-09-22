import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

import Landing from './pages/Landing';
import Auth from './pages/Auth';
import OwnerCreate from './pages/OwnerCreate';
import OwnerDetails from './pages/OwnerDetails';
import OwnerDashboard from './pages/OwnerDashboard';
import StudentSearch from './pages/StudentSearch';
import StudentDetails from './pages/StudentDetails';
import StudentPayment from './pages/StudentPayment';
import StudentConfirmation from './pages/StudentConfirmation';

function RequireRole({ role, children }) {
  const { session } = useAuth();
  if (!session || session.user.role !== role) {
    return <Navigate to={`/auth?role=${role}`} replace />;
  }
  return children;
}

function Topbar() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="topbar no-print">
      <Link to="/" className="brand">📚 <span>StudySeat</span> <span className="dot" /></Link>
      <div className="top-actions">
        {session ? (
          <>
            <span className={`pill role-${session.user.role}`}>
              {session.user.role === 'owner' ? '👤' : '🎓'} {session.user.name} · {session.user.role}
            </span>
            {session.user.role === 'owner' ? (
              <Link to="/owner/dashboard"><button className="btn btn-ghost">Dashboard</button></Link>
            ) : (
              <Link to="/student/search"><button className="btn btn-ghost">Search Libraries</button></Link>
            )}
            <button className="btn btn-ghost" onClick={() => { logout(); navigate('/'); }}>Log out</button>
          </>
        ) : (
          <Link to="/auth"><button className="btn btn-ghost">Log in / Sign up</button></Link>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Topbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />

        <Route path="/owner/create" element={<RequireRole role="owner"><OwnerCreate /></RequireRole>} />
        <Route path="/owner/details" element={<RequireRole role="owner"><OwnerDetails /></RequireRole>} />
        <Route path="/owner/dashboard" element={<RequireRole role="owner"><OwnerDashboard /></RequireRole>} />

        <Route path="/student/search" element={<StudentSearch />} />
        <Route path="/student/details" element={<RequireRole role="student"><StudentDetails /></RequireRole>} />
        <Route path="/student/payment" element={<RequireRole role="student"><StudentPayment /></RequireRole>} />
        <Route path="/student/confirmation" element={<RequireRole role="student"><StudentConfirmation /></RequireRole>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
