import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Auth() {
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get('role') === 'student' ? 'student' : 'owner');
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = mode === 'signup'
        ? await api.signup({ name, phone, password, role })
        : await api.login({ phone, password });

      login(result.token, result.user);

      if (result.user.role === 'owner') {
        // Does this owner already have a library?
        try {
          await api.myLibrary(result.token);
          navigate('/owner/dashboard');
        } catch {
          navigate('/owner/create');
        }
      } else {
        navigate('/student/search');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <div className="breadcrumb"><b>Step 1</b> — {mode === 'signup' ? 'Create your account' : 'Sign in'}</div>
      <div className="card">
        <h2>{role === 'owner' ? '👤 Owner' : '🎓 Student'} {mode === 'signup' ? 'sign up' : 'sign in'}</h2>

        <div className="chips" style={{ marginBottom: 16 }}>
          <span className={`chip ${role === 'owner' ? 'on' : ''}`} onClick={() => setRole('owner')}>Owner</span>
          <span className={`chip ${role === 'student' ? 'on' : ''}`} onClick={() => setRole('student')}>Student</span>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={onSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label>Your name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
            </div>
          )}
          <div className="form-group">
            <label>Phone number</label>
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <button className={`btn ${role === 'owner' ? 'btn-owner' : 'btn-student'} btn-block`} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="note" style={{ marginTop: 14, textAlign: 'center' }}>
          {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}>
            {mode === 'signup' ? 'Log in' : 'Sign up'}
          </a>
        </p>
      </div>
    </div>
  );
}
