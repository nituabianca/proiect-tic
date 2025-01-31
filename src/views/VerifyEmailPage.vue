<template>
  <div class="verify-container">
    <div class="verify-card">
      <h2>Verify Your Email</h2>
      <p class="info-text" v-if="!verificationLink">
        Requesting verification link...
      </p>

      <div v-if="verificationLink" class="verification-section">
        <p>Click the button below to verify your email:</p>
        <a :href="verificationLink" target="_blank" class="verify-button">
          Verify Email
        </a>
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div class="actions">
        <router-link to="/login" class="login-link">
          Back to Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";

export default {
  name: "VerifyEmailPage",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const email = ref(route.query.email);
    const verificationLink = ref("");
    const errorMessage = ref("");

    const requestVerificationLink = async () => {
      try {
        const response = await axios.post("/api/auth/verify/resend", {
          email: email.value,
        });
        verificationLink.value = response.data.verificationLink;
      } catch (error) {
        errorMessage.value =
          error.response?.data?.error || "Failed to get verification link";
      }
    };

    onMounted(() => {
      if (email.value) {
        requestVerificationLink();
      } else {
        router.push("/login");
      }
    });

    return {
      email,
      verificationLink,
      errorMessage,
    };
  },
};
</script>

<style scoped>
.verify-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f0f2f5;
}

.verify-card {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.verify-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #4caf50;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  margin: 1rem 0;
  transition: background-color 0.3s;
}

.verify-button:hover {
  background-color: #45a049;
}

.error-message {
  color: #dc3545;
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: rgba(220, 53, 69, 0.1);
  border-radius: 4px;
}

.login-link {
  color: #4caf50;
  text-decoration: none;
  margin-top: 1rem;
  display: inline-block;
}

.login-link:hover {
  text-decoration: underline;
}
</style>
