const { generateMockBook } = require("./books");
const { generateMockOrder } = require("./orders");
const { generateMockUser } = require("./users");

module.exports = {
  books: { generateMockBook },
  orders: { generateMockOrder },
  users: { generateMockUser },
};
