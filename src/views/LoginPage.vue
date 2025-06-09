<template>
  <div class="login-container">
    <form @submit.prevent="handleLogin" class="auth-form">
      <h2>Login</h2>
      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          v-model="email"
          required
          placeholder="Enter your email"
        />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          v-model="password"
          required
          placeholder="Enter your password"
        />
      </div>
      <button type="submit" class="auth-button">Login</button>
      <p class="auth-link">
        Don't have an account?
        <router-link to="/register">Register here</router-link>
      </p>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script>
/* eslint-disable */
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex"; // Make sure to import useStore

export default {
  name: "LoginPage",
  setup() {
    const email = ref("");
    const password = ref("");
    const errorMessage = ref("");
    const router = useRouter();
    const store = useStore(); // Initialize useStore

    const handleLogin = async () => {
      errorMessage.value = ""; // Clear previous errors
      try {
        await store.dispatch("auth/login", {
          email: email.value,
          password: password.value,
        });
        router.push("/dashboard"); // Redirect on success
      } catch (error) {
        // Error handling from Vuex action
        errorMessage.value =
          store.getters["auth/authError"] ||
          "Login failed. An unexpected error occurred.";
        console.error("Login Error:", error);
      }
    };

    return {
      email,
      password,
      errorMessage,
      handleLogin,
    };
  },
};
</script>

<style scoped>
/* Your existing styles */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.auth-form {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}
.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.auth-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.auth-button:hover {
  background-color: #45a049;
}
.auth-link {
  text-align: center;
  margin-top: 1rem;
}
.error-message {
  color: red;
  text-align: center;
  margin-top: 1rem;
}
</style>
