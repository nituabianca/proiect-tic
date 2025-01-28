const { faker } = require("@faker-js/faker");

const generateMockOrder = (options = {}) => {
  // Default number of products if not specified
  const numProducts = faker.number.int({ min: 1, max: 5 });

  // Generate product items
  const items = Array.from({ length: numProducts }, () => ({
    bookId: options.books
      ? faker.helpers.arrayElement(options.books).id
      : faker.string.uuid(),
    quantity: faker.number.int({ min: 1, max: 3 }),
    priceAtPurchase: parseFloat(faker.commerce.price({ min: 10, max: 100 })),
  }));

  // Calculate total
  const totalAmount = items.reduce(
    (sum, item) => sum + item.priceAtPurchase * item.quantity,
    0
  );

  return {
    id: faker.string.uuid(),
    userId: options.userId || faker.string.uuid(),
    items,
    totalAmount,
    status: faker.helpers.arrayElement([
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ]),
    shipping: {
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
      trackingNumber: faker.string.alphanumeric(8).toUpperCase(),
      provider: faker.helpers.arrayElement(["DHL", "FedEx", "UPS"]),
    },
    payment: {
      method: faker.helpers.arrayElement(["card", "paypal", "bank_transfer"]),
      status: faker.helpers.arrayElement(["pending", "completed", "failed"]),
      transactionId: faker.string.alphanumeric(10),
    },
    dates: {
      ordered: faker.date.recent(),
      processed: faker.date.recent(),
      shipped: null,
      delivered: null,
    },
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  };
};

module.exports = { generateMockOrder };
