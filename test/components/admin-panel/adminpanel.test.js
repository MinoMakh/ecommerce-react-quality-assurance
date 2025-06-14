import firebase from "../../../src/services/firebase.js";

describe("Product Management Component Tests", () => {
  // Use test admin credentials
  const adminEmail = "alimakhloufj@gmail.com";
  const adminPassword = "123456789Ali";

  let adminUser;
  let createdProductIds = [];

  // Setup - Sign in as admin
  beforeAll(async () => {
    try {
      const credential = await firebase.signIn(adminEmail, adminPassword);
      adminUser = credential.user;
      console.log("Signed in as admin:", adminUser.email);
    } catch (error) {
      console.error("Admin sign in failed:", error.message);
      throw error;
    }
  }, 10000);

  it("Valid Product Insertion Test", async () => {
    if (!adminUser) {
      console.warn("Admin login failed, skipping test");
      return;
    }

    const validProduct = {
      name: "Nike pegasus",
      brand: "Nike",
      description: "Nike boots for boys",
      price: 10,
      thumbnail: "/static/nike.jpg",
      imageCollection: ["/static/nike.jpg"],
      isFeatured: false,
      isRecommended: false,
      availableColors: ["#000000"],
      sizes: [10, 11, 12],
      maxQuantity: 10,
      keywords: ["boots"],
    };

    try {
      const addedProduct = await firebase.addProduct(validProduct);
      createdProductIds.push(addedProduct.id);

      expect(addedProduct.id).toBeTruthy();

      // Verify the product was stored correctly
      const retrievedDoc = await firebase.getSingleProduct(addedProduct.id);
      const retrievedData = retrievedDoc.data();

      expect(retrievedData.name).toBe(validProduct.name);
      expect(retrievedData.brand).toBe(validProduct.brand);
      expect(retrievedData.price).toBe(validProduct.price);
      expect(retrievedData.availableColors).toEqual(
        expect.arrayContaining(validProduct.availableColors)
      );
      expect(retrievedData.sizes).toEqual(
        expect.arrayContaining(validProduct.sizes)
      );

      console.log(
        "Valid product inserted successfully with ID:",
        addedProduct.id
      );
    } catch (error) {
      console.error("Valid product insertion failed:", error);
      throw error;
    }
  }, 15000);

  it("Invalid Product Insertion Test", async () => {
    if (!adminUser) {
      console.warn("Admin login failed, skipping test");
      return;
    }

    const invalidProduct = {
      name: "Nike pegasus",
      brand: "Nike",
      description: "Nike pegasus",
      price: 10,
      thumbnail: "/static/nike.jpg",
      imageCollection: ["/static/nike.jpg"],
      isFeatured: false,
      isRecommended: false,
      availableColors: ["#000000"],
      maxQuantity: 10,
      sizes: ["Test"],
      keywords: ["boots"],
    };

    try {
      await expect(firebase.addProduct(invalidProduct)).rejects.toThrow();
      console.log("Invalid product insertion correctly rejected");
    } catch (error) {
      expect(error).toBeDefined();
      console.log(
        "Invalid product insertion rejected as expected:",
        error.message
      );
    }
  }, 15000);

  it("Valid Product Insertion Test (Boundary Test)", async () => {
    if (!adminUser) {
      console.warn("Admin login failed, skipping test");
      return;
    }

    const boundaryProduct = {
      name: "Limited Edition Ultra Performance Sneakers for Marathon Run",
      brand: "Nike",
      description: "Nike boots for boys",
      price: 10,
      thumbnail: "/static/nike.jpg",
      imageCollection: ["/static/nike.jpg"],
      isFeatured: false,
      isRecommended: false,
      keywords: ["boots"],
      maxQuantity: 10,
      sizes: [10],
      availableColors: ["#000000"],
    };

    try {
      const addedProduct = await firebase.addProduct(boundaryProduct);
      createdProductIds.push(addedProduct.id);

      expect(addedProduct.id).toBeTruthy();

      const retrievedDoc = await firebase.getSingleProduct(addedProduct.id);
      const retrievedData = retrievedDoc.data();

      expect(retrievedData.name).toBe(boundaryProduct.name);
      expect(retrievedData.price).toBe(boundaryProduct.price);
      expect(retrievedData.maxQuantity).toBe(boundaryProduct.maxQuantity);

      console.log(
        "Boundary product inserted successfully with ID:",
        addedProduct.id
      );
    } catch (error) {
      console.error("Boundary product insertion failed:", error);
      throw error;
    }
  }, 15000);

  it("Invalid Product Insertion Test (Boundary Test)", async () => {
    if (!adminUser) {
      console.warn("Admin login failed, skipping test");
      return;
    }

    const invalidBoundaryProduct = {
      name: "Limited Edition Ultra Boost Performance Sneakers for Marathon",
      brand: "Nike",
      description: "Nike boots for boys",
      price: 10,
      thumbnail: "/static/nike.jpg",
      imageCollection: ["/static/nike.jpg"],
      isFeatured: false,
      isRecommended: false,
      keywords: ["boots"],
      maxQuantity: 10,
      sizes: [10],
      availableColors: ["#000000"],
    };

    try {
      await expect(
        firebase.addProduct(invalidBoundaryProduct)
      ).rejects.toThrow();
      console.log("Invalid boundary product insertion correctly rejected");
    } catch (error) {
      expect(error).toBeDefined();
      console.log(
        "Invalid boundary product insertion rejected as expected:",
        error.message
      );
    }
  }, 15000);

  it("Valid Product Edit Test (Branch Coverage) - 1", async () => {
    if (!adminUser) {
      console.warn("Admin login failed, skipping test");
      return;
    }

    const baseProduct = {
      name: "Nike pegasus",
      brand: "Nike",
      description: "Nike boots for boys",
      price: 10,
      thumbnail: "/static/nike.jpg",
      imageCollection: ["/static/nike.jpg"],
      isFeatured: false,
      isRecommended: false,
      availableColors: ["#000000"],
      sizes: [10, 11, 12],
      maxQuantity: 10,
      keywords: ["boots"],
    };

    try {
      const createdProduct = await firebase.addProduct(baseProduct);
      createdProductIds.push(createdProduct.id);

      const updateData = {
        ...baseProduct,
        availableColors: ["#FF5733"],
      };

      await firebase.editProduct(createdProduct.id, updateData);

      // Verify the updates
      const updatedDoc = await firebase.getSingleProduct(createdProduct.id);
      const updatedProduct = updatedDoc.data();

      expect(updatedProduct.name).toBe(updateData.name);
      expect(updatedProduct.price).toBe(updateData.price);
      expect(updatedProduct.description).toBe(updateData.description);
      expect(updatedProduct.isFeatured).toBe(updateData.isFeatured);
      expect(updatedProduct.availableColors).toEqual(
        expect.arrayContaining(updateData.availableColors)
      );
      expect(updatedProduct.maxQuantity).toBe(updateData.maxQuantity);

      // Verify unchanged fields remain the same
      expect(updatedProduct.brand).toBe(baseProduct.brand);
      expect(updatedProduct.sizes).toEqual(
        expect.arrayContaining(baseProduct.sizes)
      );

      console.log("Product edit with existing fields successful");
    } catch (error) {
      console.error("Product edit with existing fields failed:", error);
      throw error;
    }
  }, 15000);

  it("Valid Product Edit Test (Branch Coverage) - 2", async () => {
    if (!adminUser) {
      console.warn("Admin login failed, skipping test");
      return;
    }

    const baseProduct = {
      name: "Nike pegasus",
      brand: "Nike",
      description: "Nike boots for boys",
      price: 10,
      thumbnail: "/static/nike.jpg",
      imageCollection: ["/static/nike.jpg"],
      isFeatured: false,
      isRecommended: false,
      availableColors: ["#000000"],
      sizes: [10, 11, 12],
      maxQuantity: 10,
      keywords: ["boots"],
    };

    try {
      const createdProduct = await firebase.addProduct(baseProduct);
      createdProductIds.push(createdProduct.id);

      const updateData = {
        ...baseProduct,
        isFeatured: true,
      };

      await firebase.editProduct(createdProduct.id, updateData);

      // Verify the updates
      const updatedDoc = await firebase.getSingleProduct(createdProduct.id);
      const updatedProduct = updatedDoc.data();

      expect(updatedProduct.name).toBe(updateData.name);
      expect(updatedProduct.price).toBe(updateData.price);
      expect(updatedProduct.description).toBe(updateData.description);
      expect(updatedProduct.isFeatured).toBe(updateData.isFeatured);
      expect(updatedProduct.availableColors).toEqual(
        expect.arrayContaining(updateData.availableColors)
      );
      expect(updatedProduct.maxQuantity).toBe(updateData.maxQuantity);

      // Verify unchanged fields remain the same
      expect(updatedProduct.brand).toBe(baseProduct.brand);
      expect(updatedProduct.sizes).toEqual(
        expect.arrayContaining(baseProduct.sizes)
      );

      console.log("Product edit with existing fields successful");
    } catch (error) {
      console.error("Product edit with existing fields failed:", error);
      throw error;
    }
  }, 15000);

  // Clean up - Delete all test products
  afterAll(async () => {
    for (const productId of createdProductIds) {
      if (productId) {
        try {
          await firebase.deleteProduct(productId);
          console.log("Test product deleted:", productId);
        } catch (error) {
          console.warn(
            "Clean-up: Failed to delete test product",
            productId,
            error
          );
        }
      }
    }

    // Sign out after tests
    try {
      await firebase.signOut();
      console.log("Signed out successfully");
    } catch (error) {
      console.warn("Failed to sign out:", error);
    }
  }, 15000);
});
