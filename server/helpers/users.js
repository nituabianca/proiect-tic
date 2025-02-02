const { faker } = require("@faker-js/faker");

const generateMockUser = () => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const isAdmin = faker.datatype.boolean({ probability: 0.1 }); // 10% chance of being an admin

  return {
    id: faker.string.uuid(),
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    password: faker.internet.password(),
    role: isAdmin ? "admin" : "user", // Add role to the user
    address: {
      street: faker.location.street(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
    },
    preferences: {
      language: faker.helpers.arrayElement(["EN", "RO", "FR"]),
      newsletter: faker.datatype.boolean(),
      notifications: faker.datatype.boolean(),
    },
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  };
};

module.exports = { generateMockUser };
