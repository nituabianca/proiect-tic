// backend/helpers/users.js
const { faker } = require("@faker-js/faker");

const generateMockUser = () => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const isAdmin = faker.datatype.boolean({ probability: 0.1 }); // 10% chance of being an admin

  return {
    // ID-ul va fi setat la Firebase UID în controller, nu generat aici
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    password: faker.internet.password(), // Doar pentru Firebase Auth, nu stocat în Firestore
    role: isAdmin ? "admin" : "user", // Add role to the user
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
    },
    preferences: {
      language: faker.helpers.arrayElement(["EN", "RO", "FR"]),
      newsletter: faker.datatype.boolean(),
      notifications: faker.datatype.boolean(),
      preferredGenres: faker.helpers.arrayElements(
        [
          "Fantasy",
          "Science Fiction",
          "Thriller",
          "Romance",
          "History",
          "Biography",
          "Mystery",
          "Horror",
          "Poetry",
          "Self-Help",
        ],
        { min: 1, max: 3 }
      ),
      readingLevel: faker.helpers.arrayElement([
        "Beginner",
        "Intermediate",
        "Advanced",
      ]),
    },
    stats: {
      totalBooksRead: faker.number.int({ min: 0, max: 50 }),
      totalPagesRead: faker.number.int({ min: 0, max: 25000 }),
      averageRatingGiven: parseFloat(
        faker.finance.amount({ min: 2.0, max: 5.0, dec: 2 })
      ),
      booksInWishlist: faker.number.int({ min: 0, max: 10 }),
      loyaltyPoints: faker.number.int({ min: 0, max: 1000 }),
      lastActivityDate: faker.date.recent(),
    },
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    emailVerified: true, // Setăm implicit true dacă renunțăm la verificare
  };
};

module.exports = { generateMockUser };
