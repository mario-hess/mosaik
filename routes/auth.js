const express = require("express");
const { check, body } = require("express-validator");

const authController = require("../controllers/auth");

const User = require("../models/user");

const router = express.Router();

router.post(
  "/login",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email."),
    body("password", "Please enter a valid password.")
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim()
  ],
  authController.postLogin
);

router.post("/logout", authController.postLogout);

router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject("Email already exists.");
          }
        });
      }),
    body(
      "password",
      "Please enter a password with only numbers and text and at least 5 characters."
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords have to match.");
        }
        return true;
      })
      .trim(),
    body("firstName", "Please enter your first name (a-z, A-Z).")
      .isLength({ min: 2 })
      .isAlpha("de-DE"),
    body("surname", "Please enter your surname (a-z, A-Z).")
      .isLength({ min: 2 })
      .isAlpha("de-DE"),
    body("street", "Please enter your street.").isLength({ min: 2 }),
    body("postalCode", "Please enter your postal code.")
      .isPostalCode("AT")
      .isLength({ min: 4, max: 4 }),
    body("city", "Please enter your city.").isLength({ min: 2 })
  ],
  authController.postSignUp
);


router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
