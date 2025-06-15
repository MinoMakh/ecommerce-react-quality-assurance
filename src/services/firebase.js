import { initializeApp } from "firebase/app"; 

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  startAfter,
  limit,
  getDocs,
  where,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import firebaseConfig from "./config.js";

class Firebase {
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);
  }

  // AUTH ACTIONS ------------

  createAccount = (email, password) =>
    createUserWithEmailAndPassword(this.auth, email, password);

  signIn = (email, password) =>
    signInWithEmailAndPassword(this.auth, email, password);

  signInWithGoogle = () =>
    signInWithPopup(this.auth, new GoogleAuthProvider());

  signInWithFacebook = () =>
    signInWithPopup(this.auth, new FacebookAuthProvider());

  signInWithGithub = () =>
    signInWithPopup(this.auth, new GithubAuthProvider());

  signOut = () => signOut(this.auth);

  passwordReset = (email) => sendPasswordResetEmail(this.auth, email);

  addUser = (id, user) => setDoc(doc(this.db, "users", id), user);

  getUser = (id) => getDoc(doc(this.db, "users", id));

  passwordUpdate = (password) => updatePassword(this.auth.currentUser, password);

  changePassword = (currentPassword, newPassword) =>
    new Promise((resolve, reject) => {
      this.reauthenticate(currentPassword)
        .then(() => {
          const user = this.auth.currentUser;
          updatePassword(user, newPassword)
            .then(() => {
              resolve("Password updated successfully!");
            })
            .catch((error) => reject(error));
        })
        .catch((error) => reject(error));
    });

  reauthenticate = (currentPassword) => {
    const user = this.auth.currentUser;
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    return reauthenticateWithCredential(user, credential);
  };

  updateEmail = (currentPassword, newEmail) =>
    new Promise((resolve, reject) => {
      this.reauthenticate(currentPassword)
        .then(() => {
          const user = this.auth.currentUser;
          updateEmail(user, newEmail)
            .then(() => {
              resolve("Email Successfully updated");
            })
            .catch((error) => reject(error));
        })
        .catch((error) => reject(error));
    });

  updateProfile = (id, updates) =>
    updateDoc(doc(this.db, "users", id), updates);

  onAuthStateChanged = () =>
    new Promise((resolve, reject) => {
      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          resolve(user);
        } else {
          reject(new Error("Auth State Changed failed"));
        }
      });
    });

  saveBasketItems = (items, userId) =>
    updateDoc(doc(this.db, "users", userId), { basket: items });

  setAuthPersistence = () =>
    setPersistence(this.auth, browserLocalPersistence);

  // -------------- PRODUCT ACTIONS --------------

  getSingleProduct = (id) => {
    return getDoc(doc(this.db, "products", id));
  };

  getProducts = (lastRefKey) => {
    let didTimeout = false;

    return new Promise((resolve, reject) => {
      (async () => {
        if (lastRefKey) {
          try {
            const q = query(
              collection(this.db, "products"),
              orderBy("__name__"),
              startAfter(lastRefKey),
              limit(12)
            );

            const snapshot = await getDocs(q);
            const products = [];
            snapshot.forEach((document) =>
              products.push({ id: document.id, ...document.data() })
            );
            const lastKey = snapshot.docs[snapshot.docs.length - 1];

            resolve({ products, lastKey });
          } catch (e) {
            reject(e?.message || ":( Failed to fetch products.");
          }
        } else {
          const timeout = setTimeout(() => {
            didTimeout = true;
            reject(new Error("Request timeout, please try again"));
          }, 15000);

          try {
            const totalQuery = await getDocs(collection(this.db, "products"));
            const total = totalQuery.docs.length;
            
            const q = query(
              collection(this.db, "products"),
              orderBy("__name__"),
              limit(12)
            );
            const snapshot = await getDocs(q);

            clearTimeout(timeout);
            if (!didTimeout) {
              const products = [];
              snapshot.forEach((document) =>
                products.push({ id: document.id, ...document.data() })
              );
              const lastKey = snapshot.docs[snapshot.docs.length - 1];

              resolve({ products, lastKey, total });
            }
          } catch (e) {
            if (didTimeout) return;
            reject(e?.message || ":( Failed to fetch products.");
          }
        }
      })();
    });
  };

  searchProducts = (searchKey) => {
    let didTimeout = false;

    return new Promise((resolve, reject) => {
      (async () => {
        const productsRef = collection(this.db, "products");

        const timeout = setTimeout(() => {
          didTimeout = true;
          reject(new Error("Request timeout, please try again"));
        }, 15000);

        try {
          const searchedNameQuery = query(
            productsRef,
            orderBy("name_lower"),
            where("name_lower", ">=", searchKey),
            where("name_lower", "<=", `${searchKey}\uf8ff`),
            limit(12)
          );
          
          const searchedKeywordsQuery = query(
            productsRef,
            orderBy("dateAdded", "desc"),
            where("keywords", "array-contains-any", searchKey.split(" ")),
            limit(12)
          );

          const nameSnaps = await getDocs(searchedNameQuery);
          const keywordsSnaps = await getDocs(searchedKeywordsQuery);

          clearTimeout(timeout);
          if (!didTimeout) {
            const searchedNameProducts = [];
            const searchedKeywordsProducts = [];
            let lastKey = null;

            if (!nameSnaps.empty) {
              nameSnaps.forEach((document) => {
                searchedNameProducts.push({ id: document.id, ...document.data() });
              });
              lastKey = nameSnaps.docs[nameSnaps.docs.length - 1];
            }

            if (!keywordsSnaps.empty) {
              keywordsSnaps.forEach((document) => {
                searchedKeywordsProducts.push({ id: document.id, ...document.data() });
              });
            }

            // MERGE PRODUCTS
            const mergedProducts = [
              ...searchedNameProducts,
              ...searchedKeywordsProducts,
            ];
            const hash = {};

            mergedProducts.forEach((product) => {
              hash[product.id] = product;
            });

            resolve({ products: Object.values(hash), lastKey });
          }
        } catch (e) {
          if (didTimeout) return;
          reject(e);
        }
      })();
    });
  };

  getFeaturedProducts = (itemsCount = 12) => {
    const q = query(
      collection(this.db, "products"),
      where("isFeatured", "==", true),
      limit(itemsCount)
    );
    return getDocs(q);
  };

  getRecommendedProducts = (itemsCount = 12) => {
    const q = query(
      collection(this.db, "products"),
      where("isRecommended", "==", true),
      limit(itemsCount)
    );
    return getDocs(q);
  };

  addProduct = (productOrId, productData) => {
    // If only one parameter is provided (the product object)
    if (!productData) {
      // Auto-generate ID
      const newDocRef = doc(collection(this.db, "products"));
      return setDoc(newDocRef, productOrId).then(() => ({
        id: newDocRef.id,
        ...productOrId,
      }));
    }
    // If both ID and product are provided
    else {
      return setDoc(doc(this.db, "products", productOrId), productData)
        .then(() => ({
          id: productOrId,
          ...productData,
        }));
    }
  };

  deleteProduct = (id) =>
    deleteDoc(doc(this.db, "products", id))
      .then(() => id);

  generateKey = () => doc(collection(this.db, "products")).id;

  storeImage = async (id, folder, imageFile) => {
    const imageRef = ref(this.storage, `${folder}/${id}`);
    const snapshot = await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  };

  deleteImage = (id) => {
    const imageRef = ref(this.storage, `products/${id}`);
    return deleteObject(imageRef);
  };

  editProduct = (id, updates) =>
    updateDoc(doc(this.db, "products", id), updates);

  removeProduct = (id) => deleteDoc(doc(this.db, "products", id));
}

const firebaseInstance = new Firebase();

export default firebaseInstance;