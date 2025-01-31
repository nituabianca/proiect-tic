import axios from "axios";

const state = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  isAuthenticated: !!localStorage.getItem("token"),
  error: null,
  loading: false,
};

const mutations = {
  SET_LOADING(state, status) {
    state.loading = status;
  },
  SET_USER(state, user) {
    state.user = user;
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  },
  SET_TOKEN(state, token) {
    state.token = token;
    state.isAuthenticated = !!token;
    if (token) {
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    }
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
};

const actions = {
  async register({ commit }, userData) {
    commit("SET_LOADING", true);
    try {
      const response = await axios.post("/api/auth/register", userData);
      console.log("Registration response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Registration error:", error.response?.data);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async login({ commit }, credentials) {
    commit("SET_LOADING", true);
    try {
      const response = await axios.post("/api/auth/login", credentials);
      commit("SET_USER", response.data.user);
      commit("SET_TOKEN", response.data.token);
      return response.data;
    } catch (error) {
      commit("SET_ERROR", error.response?.data?.error || "Login failed");
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async logout({ commit }) {
    try {
      await axios.post("/api/auth/logout");
      commit("SET_USER", null);
      commit("SET_TOKEN", null);
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear user data even if logout request fails
      commit("SET_USER", null);
      commit("SET_TOKEN", null);
      throw error;
    }
  },

  // Simplified verification actions
  async resendVerification(_, email) {
    return await axios.post("/api/auth/verify/resend", { email });
  },

  // Simple status check without unnecessary wrapper
  async checkVerificationStatus(_, email) {
    return await axios.get(`/api/auth/verify/check?email=${email}`);
  },
};

const getters = {
  isAuthenticated: (state) => state.isAuthenticated,
  currentUser: (state) => state.user,
  authError: (state) => state.error,
  isLoading: (state) => state.loading,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
