const faker = require("@faker-js/faker");
const { generateMockBook } = require("./books");
const { generateMockUser } = require("./users");

const generateMockOrder = () => {
  const user = generateMockUser();
  const numProducts = faker.datatype.number({ min: 1, max: 5 });
  const products = [];
  for (let i = 0; i < numProducts; i++) {
    products.push(generateMockBook());
  }

  const orderId = faker.datatype.uuid();
  const orderStatus = faker.random.arrayElement([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]);
  const shippingLocation = faker.address.streetAddress();
  const createdAt = faker.date.past();
  const updatedAt = faker.date.recent();

  return {
    orderId,
    userId: user.id,
    products,
    orderStatus,
    shippingLocation,
    createdAt,
    updatedAt,
  };
};

module.exports = { generateMockOrder };
