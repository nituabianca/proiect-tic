const { db, admin, auth } = require("../firebase/firebase");
const { generateMockBook } = require("../helpers/books");
const { generateMockUser } = require("../helpers/users");
const { generateMockOrder } = require("../helpers/orders"); // <-- Add the order helper
const { faker } = require("@faker-js/faker");
/**
 * Seeds the database with mock data.
 * @param {object} options
 * @param {number} [options.bookCount=50] The number of books to create.
 * @param {number} [options.userCount=10] The number of users to create.
 * @param {number} [options.orderCount=25] The number of orders to create.
 */
const seedDatabase = async ({ bookCount, userCount, orderCount }) => {
  if (process.env.NODE_ENV !== 'development') throw new Error("Seeding is only allowed in dev mode.");
  console.log('--- STARTING DATABASE SEED ---');
  await seedBooks({ count: bookCount });
  await seedUsers({ count: userCount });
  await seedOrders({ count: orderCount });
  console.log('--- DATABASE SEED COMPLETE ---');
  return { status: "success", message: `Seeded ${bookCount} books, ${userCount} users, and ${orderCount} orders.` };
};

/**
 * Deletes all documents within a specified collection in batches.
 * @param {string} collectionPath - The name of the collection to delete.
 * @param {number} batchSize - The number of documents to delete at a time.
 */
async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  while (true) {
    const snapshot = await query.get();
    if (snapshot.size === 0) {
      return; // No more documents to delete.
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Loop until all documents are deleted.
    if (snapshot.size < batchSize) {
      return;
    }
  }
}

/**
 * Wipes all users from Firebase Authentication.
 */
async function deleteAllAuthUsers(nextPageToken) {
  const listUsersResult = await admin.auth().listUsers(100, nextPageToken);

  if (listUsersResult.users.length === 0) {
    console.log('No more auth users to delete.');
    return;
  }

  const uidsToDelete = listUsersResult.users.map(user => user.uid);
  await admin.auth().deleteUsers(uidsToDelete);
  console.log(`Deleted ${uidsToDelete.length} auth users.`);

  if (listUsersResult.pageToken) {
    await deleteAllAuthUsers(listUsersResult.pageToken);
  }
}

/**
 * Main service function to reset the entire database.
 */
const resetDatabase = async () => {
  if (process.env.NODE_ENV !== 'development') throw new Error("Reset is only allowed in dev mode.");
  console.log('--- STARTING DATABASE RESET ---');
  await Promise.all([deleteBooks(), deleteOrders(), deleteRatings(), deleteUsers()]);
  console.log('--- DATABASE RESET COMPLETE ---');
  return { status: "success", message: "Database has been reset." };
};


// --- INDIVIDUAL SEEDING FUNCTIONS ---
const seedBooks = async ({ count = 50 }) => {
  console.log(`Seeding ${count} books...`);
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(db.collection('books').add(generateMockBook()));
  }
  await Promise.all(promises);
  return { message: `Successfully seeded ${count} books.` };
};

const seedUsers = async ({ count = 10 }) => {
  console.log(`Seeding ${count} users...`);
  const promises = [];
  for (let i = 0; i < count; i++) {
    const mockUser = generateMockUser();
    const p = auth.createUser({
      email: mockUser.email,
      password: 'password123',
      displayName: `${mockUser.firstName} ${mockUser.lastName}`,
    }).then(userRecord => {
      const { password, ...userData } = mockUser;
      return db.collection('users').doc(userRecord.uid).set({ ...userData, role: 'user' });
    });
    promises.push(p);
  }
  await Promise.all(promises);
  return { message: `Successfully seeded ${count} users.` };
};

const seedOrders = async ({ count = 25 }) => {
  console.log(`Seeding ${count} orders...`);
  const usersSnapshot = await db.collection('users').get();
  const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const booksSnapshot = await db.collection('books').get();
  const allBooks = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (allUsers.length === 0 || allBooks.length === 0) {
    throw new Error("Cannot seed orders without existing users and books.");
  }

  const promises = [];
  for (let i = 0; i < count; i++) {
    const randomUser = faker.helpers.arrayElement(allUsers);
    const mockOrder = generateMockOrder({ userId: randomUser.id });
    const numItems = faker.number.int({ min: 1, max: 3 });
    const orderItems = faker.helpers.arrayElements(allBooks, numItems).map(book => ({
      bookId: book.id,
      quantity: faker.number.int({ min: 1, max: 2 }),
      priceAtPurchase: book.price,
    }));
    const finalOrder = {
      ...mockOrder,
      userId: randomUser.id,
      userEmail: randomUser.email,
      items: orderItems,
      totalAmount: orderItems.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0),
    };
    promises.push(db.collection('orders').add(finalOrder));
  }
  await Promise.all(promises);
  return { message: `Successfully seeded ${count} orders.` };
};

// --- INDIVIDUAL DELETION FUNCTIONS ---
const deleteBooks = async () => { await deleteCollection('books'); return { message: 'Books collection deleted.' }; };
const deleteOrders = async () => { await deleteCollection('orders'); return { message: 'Orders collection deleted.' }; };
const deleteRatings = async () => { await deleteCollection('ratings'); return { message: 'Ratings collection deleted.' }; };
const deleteUsers = async () => {
  await deleteCollection('users');
  await deleteAllAuthUsers();
  return { message: 'Users collection and all Auth users deleted.' };
};



module.exports = {   seedBooks, seedUsers, seedOrders,
  deleteBooks, deleteUsers, deleteOrders, deleteRatings,
  resetDatabase, seedDatabase };