import { ref } from "vue";

const toast = ref(null);
const timeout = ref(null);

export function useToast() {
  const showToast = (message, type = "info", duration = 3000) => {
    if (timeout.value) clearTimeout(timeout.value);
    toast.value = { message, type };
    timeout.value = setTimeout(() => {
      toast.value = null;
    }, duration);
  };

  return { toast, showToast };
}
