const { faker } = require("@faker-js/faker");

const generateMockBook = () => {
  return {
    title: faker.commerce.productName(),
    author: faker.person.fullName(),
    publisher: faker.company.name(),
    isbn: faker.string.numeric(13),
    publicationDate: faker.date
      .between({
        from: "2000-01-01",
        to: new Date(),
      })
      .toISOString(),
    price: parseFloat(faker.commerce.price({ min: 10, max: 100 })),
    descriptiveAtributes: {
      series: faker.commerce.productName(),
      numberOfPages: faker.number.int({ min: 120, max: 500 }),
    },
    category: {
      genre: faker.helpers.arrayElement([
        "Fiction",
        "Non-Fiction",
        "Science Fiction",
        "Mystery",
        "Romance",
      ]),
      format: faker.helpers.arrayElement([
        "Hardcover",
        "Paperback",
        "E-book",
        "Audiobook",
      ]),
    },
    stock: {
      quantity: faker.number.int({ min: 1, max: 100 }),
      warehouse: faker.location.city(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

module.exports = { generateMockBook };
