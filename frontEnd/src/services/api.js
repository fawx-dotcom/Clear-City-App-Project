// src/services/api.js - Serviciu API Complet Actualizat

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ceva nu a mers bine');
  }
  return data;
};

// ======================
// AUTHENTICATION
// ======================

export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(response);
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  register: async (name, email, password, location, latitude, longitude) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, location, latitude, longitude })
    });
    const data = await handleResponse(response);
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

// ======================
// REPORTS
// ======================

export const reportsAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_URL}/reports?${params}`);
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/reports/${id}`);
    return handleResponse(response);
  },

  create: async (reportData) => {
    const formData = new FormData();
    formData.append('latitude', reportData.latitude);
    formData.append('longitude', reportData.longitude);
    formData.append('description', reportData.description);
    
    if (reportData.location_name) {
      formData.append('location_name', reportData.location_name);
    }
    
    if (reportData.image) {
      formData.append('image', reportData.image);
    }

    const response = await fetch(`${API_URL}/reports`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    });
    
    return handleResponse(response);
  },

  updateStatus: async (id, status) => {
    const response = await fetch(`${API_URL}/reports/${id}`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/reports/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    return handleResponse(response);
  }
};

// ======================
// USER PROFILE
// ======================

export const userAPI = {
  getProfile: async () => {
    const response = await fetch(`${API_URL}/users/profile`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  updateProfile: async (profileData) => {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });
    return handleResponse(response);
  },

  uploadProfileImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('profileImage', imageFile);

    const response = await fetch(`${API_URL}/users/profile/image`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    });
    return handleResponse(response);
  },

  getLeaderboard: async () => {
    const response = await fetch(`${API_URL}/users/leaderboard`);
    return handleResponse(response);
  }
};

// ======================
// ADMIN
// ======================

export const adminAPI = {
  getStats: async () => {
    const response = await fetch(`${API_URL}/admin/stats`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  getAllUsers: async () => {
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  getAdmins: async () => {
    const response = await fetch(`${API_URL}/admin/admins`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  promoteToAdmin: async (email) => {
    const response = await fetch(`${API_URL}/admin/promote/${email}`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  demoteAdmin: async (email) => {
    const response = await fetch(`${API_URL}/admin/demote/${email}`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    return handleResponse(response);
  }
};

// Export default
export default {
  auth: authAPI,
  reports: reportsAPI,
  user: userAPI,
  admin: adminAPI
};