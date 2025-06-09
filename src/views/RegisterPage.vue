<template>
  <div class="register-container">
    <form @submit.prevent="handleRegister" class="auth-form">
      <h2>Register</h2>
      <div class="form-group">
        <label for="firstName">First Name</label>
        <input
          type="text"
          id="firstName"
          v-model="firstName"
          required
          placeholder="Enter your first name"
        />
      </div>
      <div class="form-group">
        <label for="lastName">Last Name</label>
        <input
          type="text"
          id="lastName"
          v-model="lastName"
          required
          placeholder="Enter your last name"
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
          minlength="6"
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
          minlength="6"
        />
      </div>
      <button type="submit" class="auth-button" :disabled="loading">
        {{ loading ? "Registering..." : "Register" }}
      </button>
      <p class="auth-link">
        Already have an account?
        <router-link to="/login">Login here</router-link>
      </p>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
    </form>
  </div>
</template>

<script>
/* eslint-disable */
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex"; // Make sure to import useStore

export default {
  name: "RegisterPage",
  setup() {
    const firstName = ref("");
    const lastName = ref("");
    const email = ref("");
    const password = ref("");
    const confirmPassword = ref("");
    const errorMessage = ref("");
    const successMessage = ref("");
    const loading = ref(false); // Make sure loading is defined
    const router = useRouter();
    const store = useStore(); // Initialize useStore

    const validateForm = () => {
      if (password.value !== confirmPassword.value) {
        errorMessage.value = "Passwords do not match";
        return false;
      }
      if (password.value.length < 6) {
        errorMessage.value = "Password must be at least 6 characters long";
        return false;
      }
      return true;
    };

    const handleRegister = async () => {
      if (!validateForm()) return;

      loading.value = true;
      errorMessage.value = "";
      successMessage.value = "";

      try {
        await store.dispatch("auth/register", {
          firstName: firstName.value,
          lastName: lastName.value,
          email: email.value,
          password: password.value,
        });

        successMessage.value =
          "Registration successful! Redirecting to login...";
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch (error) {
        // Error handling from Vuex action
        errorMessage.value =
          store.getters["auth/authError"] || "Registration failed";
        console.error("Registration error:", error);
      } finally {
        loading.value = false;
      }
    };

    return {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      errorMessage,
      successMessage,
      loading,
      handleRegister,
    };
  },
};
</script>

<style scoped>
/* Your existing styles */
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
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
  margin-bottom: 1.5rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}
.form-group input:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}
.auth-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.3s ease;
}
.auth-button:hover:not(:disabled) {
  background-color: #45a049;
}
.auth-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.auth-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}
.auth-link a {
  color: #4caf50;
  text-decoration: none;
  font-weight: 500;
}
.auth-link a:hover {
  text-decoration: underline;
}
.error-message {
  color: #dc3545;
  text-align: center;
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: rgba(220, 53, 69, 0.1);
}
.success-message {
  color: #28a745;
  text-align: center;
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: rgba(40, 167, 69, 0.1);
}
</style>
