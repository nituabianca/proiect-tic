<template>
  <div class="star-rating">
    <span v-for="n in fullStars" :key="'full-' + n" class="star">
      <font-awesome-icon icon="star" />
    </span>
    <span v-if="halfStar" class="star">
      <font-awesome-icon icon="star-half-alt" />
    </span>
    <span v-for="n in emptyStars" :key="'empty-' + n" class="star empty-star">
      <font-awesome-icon :icon="['far', 'star']" />
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from "@fortawesome/fontawesome-svg-core";
import { faStar, faStarHalfAlt } from "@fortawesome/free-solid-svg-icons";
import { faStar as farStar } from "@fortawesome/free-regular-svg-icons"; // Import regular star for empty

// Add all required star icons to the library npm install @fortawesome/free-regular-svg-icons
library.add(faStar, faStarHalfAlt, farStar);

const props = defineProps({
  rating: {
    type: Number,
    required: true,
    default: 0,
  },
});

const fullStars = computed(() => Math.floor(props.rating));
const halfStar = computed(() => (props.rating % 1 >= 0.25 ? 1 : 0)); // A threshold for showing a half star
const emptyStars = computed(() => 5 - fullStars.value - halfStar.value);
</script>

<style scoped>
.star-rating {
  color: #f39c12; /* A nice gold color for stars */
  display: inline-flex;
  gap: 2px;
}
.star {
  font-size: 0.9em; /* Adjust size as needed */
}
.empty-star {
  color: #bdc3c7; /* A light gray for empty stars */
}
</style>
