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
import { useStore } from "vuex";
import axios from "axios";

export default {
  name: "LoginPage",
  setup() {
    const email = ref("");
    const password = ref("");
    const errorMessage = ref("");
    const router = useRouter();
    const store = useStore();

    const handleLogin = async () => {
      try {
        const response = await axios.post(`/api/auth/login`, {
          email: email.value,
          password: password.value
        });

        // Store token
        localStorage.setItem('token', response.data.token);

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

        // Update store if using Vuex
        store.commit('auth/SET_USER', response.data.user);
        store.commit('auth/SET_TOKEN', response.data.token);

        // Navigate to dashboard
        router.push('/dashboard');
      } catch (error) {
        if (error.response?.data?.needsVerification) {
          router.push({
            path: '/verify-email',
            query: { email: email.value }
          });
        } else {
          errorMessage.value = error.response?.data?.error || 'Login failed';
        }
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
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
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
