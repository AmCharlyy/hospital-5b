// src/api.ts
export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('hospital_token');
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) window.location.href = '/login'; // O lo que uses para redireccionar
  return res;
};