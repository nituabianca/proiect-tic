<template>
  <div v-if="toast" :class="['toast', toast.type]">
    {{ toast.message }}
  </div>
</template>

<script>
import { useToast } from "@/composables/useToast";

export default {
  name: "ToastNotification",
  setup() {
    const { toast } = useToast();
    return { toast };
  },
};
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem;
  border-radius: 4px;
  color: white;
  z-index: 1100;
}

.success {
  background: #4caf50;
}
.error {
  background: #f44336;
}
.info {
  background: #2196f3;
}
</style>
