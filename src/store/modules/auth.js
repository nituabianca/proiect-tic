import axios from "axios";
import { auth } from "@/firebase"; // Make sure this path is correct for your Firebase client setup
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile, // Import updateProfile
} from "firebase/auth";

const state = {
  // Initialize user from localStorage or null. Role should be part of this user object.
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  // isAuthenticated should be derived from token presence
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
    state.isAuthenticated = !!token; // Update isAuthenticated based on token presence
    console.log(
      "SET_TOKEN: Token received:",
      token ? "YES" : "NO",
      "Length:",
      token ? token.length : 0
    );
    if (token) {
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log(
        "SET_TOKEN: Axios Authorization header set to:",
        axios.defaults.headers.common["Authorization"]
      );
    } else {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      console.log("SET_TOKEN: Axios Authorization header cleared.");
    }
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  CLEAR_AUTH_STATE(state) {
    state.user = null;
    state.token = null;
    state.isAuthenticated = false;
    state.error = null;
    state.loading = false;
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    console.log("CLEAR_AUTH_STATE: Auth state cleared.");
  },
};

const actions = {
async register({ commit, dispatch }, { firstName, lastName, email, password }) {
    commit("SET_LOADING", true);
    commit("SET_ERROR", null);
    try {
      // 1. Call OUR backend API directly. It will handle creating the user.
      // We no longer use the Firebase Client SDK's createUserWithEmailAndPassword here.
      const response = await axios.post("/api/auth/register", {
        email,
        password,
        firstName,
        lastName,
      });

      // 2. Our backend, upon successful registration, returns our custom JWT and user object.
      // We commit this to the store immediately.
      commit("SET_USER", response.data.user);
      commit("SET_TOKEN", response.data.token);

      return response.data;
    } catch (error) {
      // Error handling remains largely the same.
      const errorMessage = error.response?.data?.error || "Registration failed.";
      commit("SET_ERROR", errorMessage);
      throw new Error(errorMessage);
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async login({ commit }, { email, password }) {
    commit("SET_LOADING", true);
    commit("SET_ERROR", null);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      const idToken = await firebaseUser.getIdToken();
      console.log(
        "FRONTEND (Vuex Login): Newly acquired Firebase ID Token for backend login:",
        idToken
      );

      // Send Firebase ID Token to your backend for custom JWT exchange
      const response = await axios.post("/api/auth/login", {
        idToken: idToken,
      });

      // Commit state changes with the custom JWT and user data from backend
      commit("SET_USER", response.data.user); // Backend response should include user object with role
      commit("SET_TOKEN", response.data.token);

      return response.data;
    } catch (error) {
      console.error("Vuex Login Error:", error);
      let errorMessage = "Login failed. An unexpected error occurred.";
      if (error.code) {
        switch (error.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
            errorMessage = "Invalid email or password.";
            break;
          case "auth/invalid-email":
            errorMessage = "Please enter a valid email address.";
            break;
          case "auth/user-disabled":
            errorMessage = "This account has been disabled.";
            break;
          default:
            errorMessage = `Authentication failed. (${error.code})`;
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      commit("SET_ERROR", errorMessage);
      throw new Error(errorMessage);
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async logout({ commit }) {
    commit("SET_LOADING", true);
    try {
      await auth.signOut(); // Sign out from Firebase client-side
      await axios.post("/api/auth/logout"); // Inform backend (optional, for session invalidation)
      commit("CLEAR_AUTH_STATE"); // Clear all auth related state
    } catch (error) {
      console.error("Vuex Logout Error:", error);
      commit("CLEAR_AUTH_STATE"); // Always clear local state even if backend fails
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  initializeAuth({ commit }) {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    console.log("initializeAuth: Checking localStorage for token...");
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        // Set token first, which also sets the Axios header
        commit("SET_TOKEN", token);
        // Then set the user object
        commit("SET_USER", parsedUser);
        console.log("initializeAuth: Token and user found and re-initialized.");
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
        commit("CLEAR_AUTH_STATE"); // Clear if localStorage data is corrupt
      }
    } else {
      console.log(
        "initializeAuth: No token or user found in localStorage. Clearing auth state."
      );
      commit("CLEAR_AUTH_STATE"); // Clear if state is incomplete or missing
    }
  },

  async fetchUserProfile({ commit, state }) {
    if (!state.token) {
      console.warn(
        "fetchUserProfile: No token available in state. Cannot fetch profile."
      );
      // This throw will be caught by the router guard, which should then initiate a logout.
      throw new Error("No authentication token found.");
    }

    try {
      // Axios will automatically add the 'Authorization' header because it was set by SET_TOKEN.
      const response = await axios.get("/api/auth/profile");
      const userProfile = response.data.user; // Assuming backend sends { user: profileData }

      // Update the user state with the fetched profile data (e.g., to ensure role is current)
      commit("SET_USER", userProfile);

      console.log(
        "fetchUserProfile: User profile fetched successfully:",
        userProfile
      );
      return userProfile; // Return the user object (including role) for the router guard to use
    } catch (error) {
      console.error("Vuex: Failed to fetch user profile:", error);
      // If the error is 401, it suggests the token is invalid/expired.
      if (error.response && error.response.status === 401) {
        console.warn(
          "fetchUserProfile: Token invalid or expired (401 response). Clearing auth state."
        );
        commit("CLEAR_AUTH_STATE"); // Clear local state to force re-authentication
      }
      throw error; // Re-throw to propagate the error to the router guard's catch block
    }
  },
};

const getters = {
  isAuthenticated: (state) => state.isAuthenticated,
  currentUser: (state) => state.user,
  authError: (state) => state.error,
  isLoading: (state) => state.loading,
  // Add this crucial getter for role-based access
  isAdmin: (state) => state.user && state.user.role === "admin",
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
