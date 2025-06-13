export default {
  initializeApp: jest.fn(),
  auth: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(),
  })),
  storage: jest.fn(),
};
