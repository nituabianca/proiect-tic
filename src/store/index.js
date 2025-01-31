import { createStore } from "vuex";
import axios from "axios";

// Define the `auth` module within the Vuex store
const store = createStore({
  modules: {
    auth: {
      state: {
        user: JSON.parse(localStorage.getItem("user")) || null,
        isAuthenticated: !!localStorage.getItem("user"),
        error: null,
      },
      mutations: {
        setUser(state, user) {
          state.user = user;
          state.isAuthenticated = true;
          localStorage.setItem("user", JSON.stringify(user)); // Store user in localStorage
        },
        setError(state, error) {
          state.error = error;
        },
        logoutUser(state) {
          state.user = null;
          state.isAuthenticated = false;
          localStorage.removeItem("user"); // Clear user data
        },
      },
      actions: {
        async login({ commit }, credentials) {
          try {
            const response = await axios.post(
              "http://localhost:3000/api/auth/login",
              credentials,
              { withCredentials: true }
            );
            commit("setUser", response.data.user);
            return response.data;
          } catch (error) {
            commit("setError", error.response?.data?.error || "Login failed");
            throw error;
          }
        },

        async register({ commit }, userData) {
          try {
            await axios.post(
              "http://localhost:3000/api/auth/register",
              userData,
              {
                withCredentials: true,
              }
            );
          } catch (error) {
            commit(
              "setError",
              error.response?.data?.error || "Registration failed"
            );
            throw error;
          }
        },

        async fetchUser({ commit }) {
          try {
            const response = await axios.get(
              "http://localhost:3000/api/auth/profile",
              { withCredentials: true }
            );
            commit("setUser", response.data.user);
          } catch (error) {
            commit("logoutUser");
          }
        },

        async logout({ commit }) {
          try {
            await axios.post(
              "http://localhost:3000/api/auth/logout",
              {},
              { withCredentials: true }
            );
            commit("logoutUser");
          } catch (error) {
            console.error("Logout failed", error);
          }
        },
      },
      getters: {
        isAuthenticated: (state) => state.isAuthenticated,
        getUser: (state) => state.user,
      },
    },
  },
});

export default store;
