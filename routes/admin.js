const path = require("path");

const express = require("express");
const { check, body } = require("express-validator");

const adminController = require("../controllers/admin");

const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/add-product", isAuth, adminController.getAddProduct);

router.get("/products", isAuth, adminController.getProducts);

router.post(
  "/add-product",
  [
    body("title")
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body("price").isFloat(),
    body("category").isLength({ min: 3 }),
    body("description")
      .isLength({ min: 5, max: 400 })
      .trim()
  ],
  isAuth,
  adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product",
  [
    body("title")
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body("price").isFloat(),
    body("description")
      .isLength({ min: 5, max: 400 })
      .trim()
  ],
  isAuth,
  adminController.postEditProduct
);

router.post(
  "/product/delete/:productId",
  isAuth,
  adminController.postDeleteProduct
);

router.get("/user/:userId", isAuth, adminController.getUserProfile);

router.get("/user/messages/:userId", isAuth, adminController.getMessages);

router.get("/user/messages/new/:userId", isAuth, adminController.getNewMessage);

router.post(
  "/user/messages/new/:userId",
  isAuth,
  adminController.postNewMessage
);

router.get("/deleteAccount", isAuth, adminController.getDeleteAccount);

router.post("/deleteAccount", isAuth, adminController.postDeleteAccount);

router.post(
  "/user/update/description",
  [
    body("description")
      .isLength({ min: 5, max: 5 })
      .trim()
  ],
  isAuth,
  adminController.postUpdateDescription
);

router.post(
  "/addProfilePicture",
  isAuth,
  adminController.postAddProfilePicture
);

router.delete(
  "/user/messages/delete/:messageId",
  isAuth,
  adminController.deleteMessage
);

router.post("/favorite/:productId", isAuth, adminController.postFavorite);

router.get("/user/favorites/:userId", isAuth, adminController.getFavorites);

router.delete(
  "/user/favorites/delete/:productId",
  isAuth,
  adminController.deleteFavorite
);

router.post("/user/offer/:productId", isAuth, adminController.postAddOffer);

module.exports = router;
