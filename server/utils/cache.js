// backend/utils/cache.js
const cache = new Map();

const setCache = (key, value, ttl = 3600000) => {
  // Default TTL: 1 hour (in milliseconds)
  cache.set(key, {
    value: value,
    expiry: Date.now() + ttl,
  });
  // console.log(`Cache set for key: ${key}, expires in ${ttl / 1000} seconds`);
};

const getCache = (key) => {
  const item = cache.get(key);
  if (!item) {
    // console.log(`Cache miss for key: ${key}`);
    return null;
  }
  if (Date.now() > item.expiry) {
    cache.delete(key);
    // console.log(`Cache expired for key: ${key}`);
    return null;
  }
  // console.log(`Cache hit for key: ${key}`);
  return item.value;
};

const deleteCache = (key) => {
  cache.delete(key);
  // console.log(`Cache deleted for key: ${key}`);
};

const clearAllCache = () => {
  cache.clear();
  // console.log("All cache cleared.");
};

module.exports = {
  setCache,
  getCache,
  deleteCache,
  clearAllCache,
};
