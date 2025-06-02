// backend/helpers/books.js
const { faker } = require("@faker-js/faker");

const generateMockBook = () => {
  const title = faker.lorem.words({ min: 2, max: 5 });
  const author = faker.person.fullName();
  const genre = faker.helpers.arrayElement([
    "Fantasy",
    "Science Fiction",
    "Mystery",
    "Thriller",
    "Romance",
    "Horror",
    "Historical Fiction",
    "Biography",
    "Self-Help",
    "Poetry",
    "Young Adult",
    "Children",
  ]);
  const publisher = faker.company.name();
  const pages = faker.number.int({ min: 100, max: 1000 });
  const price = parseFloat(faker.commerce.price({ min: 5, max: 50, dec: 2 }));
  const stockQuantity = faker.number.int({ min: 0, max: 200 });
  const isbn = faker.commerce.isbn();
  const coverImageUrl = faker.image.urlLoremFlickr({
    category: "books",
    width: 480,
    height: 640,
  });

  return {
    id: faker.string.uuid(), // This will be overwritten by Firestore doc ID
    title: title,
    author: author,
    description: faker.lorem.paragraph({ min: 3, max: 7 }),
    genre: genre, // MODIFICAT: Acum este direct 'genre', nu 'category.genre'
    publisher: publisher,
    publicationDate: faker.date.past({ years: 20 }).toISOString().split("T")[0],
    language: faker.helpers.arrayElement([
      "English",
      "Romanian",
      "French",
      "German",
      "Spanish",
    ]),
    pages: pages,
    price: price,
    stock: {
      quantity: stockQuantity,
      lastUpdated: faker.date.recent(),
    },
    isbn: isbn,
    averageRating: parseFloat(
      faker.finance.amount({ min: 3.0, max: 5.0, dec: 1 })
    ),
    numRatings: faker.number.int({ min: 0, max: 500 }),
    coverImageUrl: coverImageUrl,
    availableFormats: faker.helpers.arrayElements(
      ["Hardcover", "Paperback", "Ebook", "Audiobook"],
      { min: 1, max: 3 }
    ),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  };
};

module.exports = { generateMockBook };
