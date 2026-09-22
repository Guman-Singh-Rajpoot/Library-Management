import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Landing() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  function onSearch(e) {
    e.preventDefault();
    navigate(`/student/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <div className="hero">
        <h1>Find a seat. Fill your seats.</h1>
        <p className="lead">One platform for library owners to list seats, and students to find and book them.</p>
        <div className="container" style={{ maxWidth: 560, paddingTop: 0 }}>
          <form className="search-bar" onSubmit={onSearch}>
            <input
              type="text"
              placeholder="Search libraries by name…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn btn-student" type="submit">🔍 Search</button>
          </form>
        </div>
      </div>

      <div className="container">
        <div className="role-select">
          <div className="role-card">
            <div className="emoji">👤</div>
            <h3>I'm a Library Owner</h3>
            <p className="note">List your library, manage seats, fees, shifts &amp; facilities, and track bookings.</p>
            <Link to="/auth?role=owner"><button className="btn btn-owner btn-block">Register / Log in as Owner</button></Link>
          </div>
          <div className="role-card">
            <div className="emoji">🎓</div>
            <h3>I'm a Student</h3>
            <p className="note">Search nearby libraries, check live seat availability, and book instantly.</p>
            <Link to="/auth?role=student"><button className="btn btn-student btn-block">Register / Log in as Student</button></Link>
          </div>
        </div>
      </div>
    </>
  );
}
