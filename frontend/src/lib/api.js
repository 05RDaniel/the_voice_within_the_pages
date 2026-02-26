const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://la-voz-de-las-paginas-api.onrender.com' : 'http://localhost:5000');

async function safeFetch(url, options = {}) {
  let response;
  try {
    response = await fetch(url, { ...options, credentials: 'include' });
  } catch (err) {
    console.error('API request failed:', err);
    return { error: 'CONNECTION_ERROR' };
  }
  try {
    const data = await response.json();
    if (!response.ok && !data.error) {
      data.error = data.message || `Error ${response.status}`;
    }
    return data;
  } catch {
    return { error: response.ok ? 'Error inesperado' : `Error ${response.status}` };
  }
}

export const api = {
  async get(endpoint) {
    return safeFetch(`${API_URL}${endpoint}`);
  },

  async post(endpoint, data) {
    return safeFetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async put(endpoint, data) {
    return safeFetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async delete(endpoint) {
    return safeFetch(`${API_URL}${endpoint}`, { method: 'DELETE' });
  },
};

