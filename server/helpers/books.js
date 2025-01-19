const faker = require("faker");
const { fakerRO } = require("@faker-js/faker");

const generateMockBook = () => {
  return {
    title: faker.book.title(),
    author: faker.book.author(),
    publisher: faker.book.publisher(),
    isbn: faker.book.isbn(),
    publicationDate: faker.date.between({ from: "2000-01-01", to: Date.now() }),
    price: faker.commerce.price(),
    ratings: faker.number({ min: 1, max: 5, fractionDigits: 1 }),
    descriptiveAtributes: {
      series: faker.book.series(),
      numberOfPages: faker.number({ min: 120, max: 500 }),
    },
    category: {
      id: faker.string.uuid(),
      genre: faker.book.genre(),
      format: faker.book.format(),
    },
    stock: {
      quantity: faker.number({ min: 1, max: 100 }),
      warehouse: fakerRO.location.city(),
    },
  };
};

module.exports = { generateMockBook };
