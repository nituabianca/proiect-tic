<template>
  <div class="register-container">
    <form @submit.prevent="handleRegister" class="auth-form">
      <h2>Register</h2>
      <div class="form-group">
        <label for="username">Username</label>
        <input
          type="text"
          id="username"
          v-model="username"
          required
          placeholder="Choose a username"
        />
      </div>
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
          placeholder="Create a password"
        />
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          v-model="confirmPassword"
          required
          placeholder="Confirm your password"
        />
      </div>
      <button type="submit" class="auth-button">Register</button>
      <p class="auth-link">
        Already have an account?
        <router-link to="/login">Login here</router-link>
      </p>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

export default {
  name: "RegisterPage",
  setup() {
    const username = ref("");
    const email = ref("");
    const password = ref("");
    const confirmPassword = ref("");
    const errorMessage = ref("");
    const router = useRouter();

    const handleRegister = async () => {
      if (password.value !== confirmPassword.value) {
        errorMessage.value = "Passwords do not match";
        return;
      }

      try {
        await axios.post(
          `${process.env.VUE_APP_API_URL}/api/auth/register`,
          {
            username: username.value,
            email: email.value,
            password: password.value,
          },
          { withCredentials: true }
        );

        router.push("/dashboard");
      } catch (error) {
        errorMessage.value =
          error.response?.data?.message || "Registration failed";
        console.error("Registration error:", error);
      }
    };

    return {
      username,
      email,
      password,
      confirmPassword,
      errorMessage,
      handleRegister,
    };
  },
};
</script>

<style scoped>
/* Use the same styles as LoginPage */
.register-container {
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
