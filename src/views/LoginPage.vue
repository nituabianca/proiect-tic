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
// Import Firebase auth service
import { auth } from "@/firebase"; // <--- Make sure this path is correct for your firebase.js export
import { signInWithEmailAndPassword } from "firebase/auth"; // <--- Import signInWithEmailAndPassword

export default {
  name: "LoginPage",
  setup() {
    const email = ref("");
    const password = ref("");
    const errorMessage = ref("");
    const router = useRouter();
    const store = useStore();

    const handleLogin = async () => {
      errorMessage.value = ""; // Clear previous errors
      try {
        // Step 1: Log in with Firebase Authentication (client-side)
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email.value,
          password.value
        );
        const firebaseUser = userCredential.user;

        // Step 2: Get Firebase ID Token
        const idToken = await firebaseUser.getIdToken();
        console.log("FRONTEND: Newly acquired Firebase ID Token:", idToken);
        console.log("FRONTEND: Token generation time (roughly):", new Date());
        console.log("Firebase ID Token:", idToken); // For debugging, remove in production

        // Step 3: Send Firebase ID Token to your backend for custom JWT exchange
        const response = await axios.post(`/api/auth/login`, {
          idToken: idToken, // <--- Send the Firebase ID Token
        });
        console.log("FRONTEND: Sending this ID Token to backend:", idToken);

        // Step 4: Handle response from your backend (which returns your custom JWT)
        localStorage.setItem("token", response.data.token); // Your custom JWT
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.token}`;

        store.commit("auth/SET_USER", response.data.user);
        store.commit("auth/SET_TOKEN", response.data.token);

        router.push("/dashboard");
      } catch (error) {
        console.error("Login Error:", error);
        if (error.code) {
          // Firebase specific errors
          switch (error.code) {
            case "auth/user-not-found":
            case "auth/wrong-password":
              errorMessage.value = "Invalid email or password.";
              break;
            case "auth/invalid-email":
              errorMessage.value = "Please enter a valid email address.";
              break;
            case "auth/user-disabled":
              errorMessage.value = "This account has been disabled.";
              break;
            // Add more Firebase error codes as needed
            default:
              errorMessage.value =
                "Authentication failed. Please try again. (" + error.code + ")";
          }
        } else if (error.response?.data?.error) {
          // Backend specific errors
          errorMessage.value = error.response.data.error;
        } else {
          errorMessage.value = "Login failed. An unexpected error occurred.";
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
