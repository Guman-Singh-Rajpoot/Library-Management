const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body */ }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  // auth
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),

  // pricing
  estimateCharge: (seats) => request(`/libraries/pricing/estimate?seats=${seats}`),

  // libraries
  searchLibraries: (q) => request(`/libraries${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getLibrary: (id) => request(`/libraries/${id}`),
  myLibrary: (token) => request('/libraries/mine/summary', { token }),
  createLibrary: (payload, token) => request('/libraries', { method: 'POST', body: payload, token }),
  dashboard: (libraryId, token) => request(`/libraries/${libraryId}/dashboard`, { token }),
  addSeats: (libraryId, count, token) => request(`/libraries/${libraryId}/seats`, { method: 'POST', body: { count }, token }),
  addCoupon: (libraryId, code, percent, token) => request(`/libraries/${libraryId}/coupons`, { method: 'POST', body: { code, percent }, token }),
  addFacility: (libraryId, name, token) => request(`/libraries/${libraryId}/facilities`, { method: 'POST', body: { name }, token }),

  // bookings
  createBooking: (payload, token) => request('/bookings', { method: 'POST', body: payload, token }),
  payBooking: (bookingId, payload, token) => request(`/bookings/${bookingId}/pay`, { method: 'POST', body: payload, token }),
  getBooking: (bookingId, token) => request(`/bookings/${bookingId}`, { token })
};
