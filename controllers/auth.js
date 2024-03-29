const crypto = require("crypto");

const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.user,
    pass: process.env.pass
  }
});




exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("shop/index", {
      path: "/",
      docTitle: "Mosaik",
      errorMessage: errors.array()[0].msg,
      successMessage: null,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.status(422).render("shop/index", {
          path: "/",
          docTitle: "Mosaik",
          errorMessage: "Invalid email or password.",
          successMessage: null,
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        });
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              res.redirect("/products");
            });
          }
          return res.status(422).render("shop/index", {
            path: "/",
            docTitle: "Mosaik",
            errorMessage: "Invalid email or password.",
            successMessage: null,
            oldInput: {
              email: email,
              password: password
            },
            validationErrors: []
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect("/");
        });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    res.redirect("/");
  });
};


exports.postSignUp = (req, res, next) => {
  const email = req.body.email;
  const firstName = req.body.firstName;
  const surname = req.body.surname;
  const street = req.body.street;
  const postalCode = req.body.postalCode;
  const city = req.body.city;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("shop/index", {
      path: "/",
      docTitle: "Mosaik",
      errorMessage: errors.array()[0].msg,
      successMessage: null,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword,
        firstName: firstName,
        surname: surname,
        street: street,
        postalCode: postalCode,
        city: city
      },
      validationErrors: errors.array()
    });
  }

  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email: email,
        address: {
          firstName: firstName,
          surname: surname,
          street: street,
          postalCode: postalCode,
          city: city
        },
        karma: 0,
        description: "",
        password: hashedPassword,
        cart: { items: [] }
      });
      return user.save();
    })
    .then(result => {
      res.render("shop/index", {
        docTitle: "Mosaik",
        path: "/",
        errorMessage: null,
        successMessage: "Successfully signed up!"
      });
      return transporter.sendMail({
        from: "office.hess@gmail.com",
        to: email,
        subject: "Signup Succeeded",
        html: "<h1>You successfully signed up!</h1>"
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    docTitle: "Reset Password",
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          return res.render("shop/index", {
            path: "/index",
            docTitle: "Mosaik",
            errorMessage: "Email does not exist."
          });
        } else {
          user.resetToken = token;
          user.resetTokenExpiration = Date.now() + 3600000;
          return user.save();
        }
      })
      .then(result => {
        if (result) {
          res.render("shop/index", {
            path: "/index",
            docTitle: "Mosaik",
            errorMessage: null,
            successMessage: "Email sent!"
          });
          transporter.sendMail({
            from: "office.hess@gmail.com",
            to: req.body.email,
            subject: "Password Reset",
            html: `
                <p>You requested a password reset</p>
                <p>Click this <a href="http://localhost:5000/reset/${token}">link</a> to set a new password</p>
                `
          });
        }
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("auth/new-password", {
        path: "/new-password",
        docTitle: "New Password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.render("shop/index", {
        path: "/index",
        docTitle: "Mosaik",
        errorMessage: null,
        successMessage: "Password successfully resetted."
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
