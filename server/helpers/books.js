const faker = require("@faker-js/faker");
const { fakerRO } = require("@faker-js/faker");

const generateMockBook = () => {
  return {
    id: faker.string.uuid(),
    title: faker.commerce.productName(),
    author: faker.person.fullName(),
    publisher: faker.company.name(),
    isbn: faker.string.numeric(13),
    publicationDate: faker.date.between({ from: "2000-01-01", to: new Date() }),
    price: parseFloat(faker.commerce.price({ min: 10, max: 100 })),
    ratings: {
      average: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
      count: faker.number.int({ min: 0, max: 1000 }),
    },
    descriptiveAttributes: {
      series: faker.commerce.productName(),
      numberOfPages: faker.number.int({ min: 120, max: 500 }),
      language: faker.helpers.arrayElement(["English", "Romanian", "French"]),
      dimensions: {
        width: faker.number.int({ min: 5, max: 8 }),
        height: faker.number.int({ min: 7, max: 11 }),
        weight: faker.number.float({ min: 0.2, max: 2.0, precision: 0.1 }),
      },
    },
    category: {
      id: faker.string.uuid(),
      genre: faker.helpers.arrayElement([
        "Fiction",
        "Non-Fiction",
        "Science Fiction",
        "Mystery",
        "Romance",
        "History",
        "Biography",
        "Business",
        "Technology",
      ]),
      format: faker.helpers.arrayElement([
        "Hardcover",
        "Paperback",
        "E-book",
        "Audiobook",
      ]),
    },
    stock: {
      quantity: faker.number.int({ min: 0, max: 100 }),
      warehouse: fakerRO.location.city(),
      lastRestocked: faker.date.recent(),
      reorderPoint: faker.number.int({ min: 5, max: 20 }),
    },
    features: {
      bestSeller: faker.datatype.boolean(),
      newRelease: faker.datatype.boolean(),
      preOrder: faker.datatype.boolean(),
    },
    marketing: {
      tags: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () =>
        faker.commerce.productAdjective()
      ),
      discount: faker.helpers.maybe(
        () => ({
          percentage: faker.number.int({ min: 5, max: 50 }),
          validUntil: faker.date.future(),
        }),
        { probability: 0.3 }
      ),
    },
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  };
};

module.exports = { generateMockBook };
