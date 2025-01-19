const faker = require("faker");
const { fakerRO } = require("@faker-js/faker");

const generateMockUser = () => {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();

  return {
    firstName: firstName,
    lastName: lastName,
    email: `${firstName}.${lastName}@example.com`.toLowerCase(),
    phone: fakerRO.phone.number({ style: "international" }),
    password: faker.internet.password(),
  };
};

module.exports = { generateMockUser };
