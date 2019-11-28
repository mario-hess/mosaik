const Product = require("../models/product");
const User = require("../models/user");
const { validationResult } = require("express-validator");

const mongoose = require("mongoose");
const moment = require("moment");

const fileHelper = require("../util/file");

const ITEMS_PER_PAGE = 4;

exports.getAddProduct = (req, res, next) => {
  res.render("/pruduct-list", {
    docTitle: "Products",
    path: "/product-list",
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.files;
  const price = req.body.price;
  const category = req.body.category;
  const description = req.body.description;

  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .populate("userId")
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      const errors = validationResult(req);
      if (!image) {
        return res.status(422).render("./shop/product-list", {
          prods: products,
          docTitle: "Products",
          path: "/products",
          editing: false,
          hasError: true,
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
          product: {
            title: title,
            price: price,
            category: category,
            description: description
          },
          errorMessage: "Attached file is not an image.",
          validationErrors: []
        });
      }
      if (!errors.isEmpty()) {
        return res.status(422).render("./shop/product-list", {
          prods: products,
          docTitle: "Products",
          path: "/products",
          editing: false,
          hasError: true,
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
          product: {
            title: title,
            price: price,
            category: category,
            description: description
          },
          errorMessage: errors.array()[0].msg,
          validationErrors: errors.array()
        });
      }

      const imageUrl = [];
      image.forEach(img => {
        imageUrl.push(img.path);
      });

      const product = new Product({
        title: title,
        price: price,
        category: category,
        description: description,
        imageUrl: imageUrl,
        userId: req.user,
        sold: false,
        favorites: []
      });
      product
        .save()
        .then(result => {
          User.findById(req.user._id)
            .then(user => {
              user.products.push(product._id);
              return user.save();
            })
            .then(result => {
              res.redirect("/admin/user/" + req.user._id);
            })
            .catch(err => {
              const error = new Error(err);
              error.httpStatusCode = 500;
              return next(error);
            });
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postAddProfilePicture = (req, res, next) => {
  const image = req.files;

  User.findById(req.user._id)
    .then(user => {
      if (!image) {
        res.redirect("/admin/user/" + req.user._id.toString());
      }
      if (image) {
        if (user.userImage) {
          fileHelper.deleteFile(user.userImage);
        }
        user.userImage = image[0].path;
      }
      return user.save();
    })
    .then(result => {
      res.redirect("/admin/user/" + req.user._id.toString());
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then(product => {
      if (!product || product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        docTitle: "Edit Product",
        path: "/admin/edit-product",
        hasError: false,
        product: product,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.files;
  const updatedCategory = req.body.category;
  const updatedDescription = req.body.description;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      docTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        category: updatedCategory,
        description: updatedDescription,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }
  const imageUrl = [];
  image.forEach(img => {
    imageUrl.push(img.path);
  });

  Product.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.category = updatedCategory;
      product.description = updatedDescription;
      if (imageUrl) {
        product.imageUrl.forEach(imgUrl => {
          fileHelper.deleteFile(imgUrl);
        });
        product.imageUrl = imageUrl;
        console.log(imageUrl);
      }

      return product.save().then(result => {
        console.log("Updated Product!");
        res.redirect("/admin/user/" + product.userId.toString());
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then(products => {
      res.render("admin/products", {
        prods: products,
        docTitle: "Admin Products",
        path: "/admin/products"
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return next(new Error("Product not found."));
      }
      product.imageUrl.forEach(imgUrl => {
        fileHelper.deleteFile(imgUrl);
      });

      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then(() => {
      console.log("Destroyed Product");
      res.redirect("/admin/user/" + req.user._id);
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getUserProfile = (req, res, next) => {
  const userId = req.params.userId;
  let userData = null;

  User.findById(userId)
    .then(user => {
      userData = user;
      Product.find({ userId: user._id }).then(products => {
        res.render("admin/profile", {
          docTitle: "Profile",
          path: "/admin/user/" + userId,
          userData: userData,
          products: products
        });
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getMessages = (req, res, next) => {
  const userId = req.user._id;
  let usr = null;
  let inbox = [];
  let sent = [];

  User.findById(userId)
    .then(user => {
      usr = user;
      return user;
    })
    .then(user => {
      user.messages.forEach(msg => {
        msg.newMessage = false;

        if (msg.from.toString() === user._id.toString()) {
          sent.push(msg);
        } else if (msg.from.toString() !== user._id.toString()) {
          inbox.push(msg);
        }
      });
      user.save();
      req.session.user = user;
      sent.reverse();
      inbox.reverse();
      res.render("admin/messages", {
        docTitle: "Messages",
        path: "/admin/user/messages/" + userId,
        userData: user,
        inbox: inbox,
        sent: sent
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getNewMessage = (req, res, next) => {
  const userId = req.params.userId;

  User.findById(userId)
    .then(user => {
      res.render("admin/newMessage", {
        docTitle: "Messages",
        path: "/admin/user/messages/new" + userId,
        userId: userId,
        user: user
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewMessage = (req, res, next) => {
  const userId = req.params.userId;
  const subject = req.body.subject;
  const message = req.body.message;
  let username = "";
  let userImage = null;
  if (message === "") {
    return res.redirect("/admin/user/" + req.user._id.toString());
  }

  User.findById(userId)
    .then(user => {
      username = user.address.firstName + " " + user.address.surname;
      userImage = user.userImage;
      user.messages.push({
        subject: subject,
        message: message,
        newMessage: true,
        from: req.user._id,
        fromName: req.user.address.firstName + " " + req.user.address.surname,
        fromImage: req.user.userImage,
        to: user._id,
        toName: username,
        toImage: user.userImage,
        conversationWith:
          req.user.address.firstName + " " + req.user.address.surname,
        time: new Date()
      });
      return user.save();
    })
    .then(result => {
      User.findById(req.user._id)
        .then(user => {
          user.messages.push({
            subject: subject,
            message: message,
            newMessage: true,
            from: user._id,
            fromName: user.address.firstName + " " + user.address.surname,
            fromImage: user.userImage,
            to: userId,
            toName: username,
            toImage: userImage,
            conversationWith: username,
            time: moment().format("L") + " | " + moment().format("LT")
          });
          return user.save();
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .then(result => {
      res.redirect("/admin/user/messages/" + req.user._id.toString());
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteMessage = (req, res, next) => {
  const messageId = req.params.messageId;

  User.findById(req.user._id)
    .then(user => {
      user.messages.forEach(msg => {
        if (msg._id.toString() === messageId.toString()) {
          msg.remove();
          return user.save();
        }
      });
    })
    .then(result => {
      console.log("Destroyed Message");
      res.status(200).json({ message: "Success!" });
    })
    .catch(err => {
      res.status(500).json({ message: "Deleting message failed." });
    });
};

exports.postFavorite = (req, res, next) => {
  const prodId = req.params.productId;
  let found = false;
  let data = false;

  User.findById(req.user._id)
    .then(user => {
      Product.findById(prodId).then(product => {
        if (user.favorites.length > 0) {
          user.favorites.forEach((fav, index, object) => {
            if (fav._id.toString() === product._id.toString()) {
              object.splice(index, 1);
              found = true;
              data = false;
            }
          });
          product.favorites.forEach((fav, index, object) => {
            if (fav._id.toString() === user.id.toString()) {
              object.splice(index, 1);
              found = true;
              data = false;
            }
          });
          if (found === false) {
            user.favorites.push(product);
            product.favorites.push(user);
            data = true;
          }
        } else if (user.favorites.length < 1) {
          user.favorites.push(product);
          product.favorites.push(user);
          data = true;
        }
        user.save();
        product.save();
        if (data === true) {
          res.status(200).json({ message: "Added" });
        } else {
          res.status(200).json({ message: "Deleted" });
        }
      });
    })
    .catch(err => {
      res.status(500).json({ message: "Error" });
    });
};

exports.getFavorites = (req, res, next) => {
  const userId = req.user._id;

  User.findById(userId)
    .populate("favorites")
    .then(user => {
      res.render("admin/favorites", {
        docTitle: "Favorites",
        path: "/admin/user/favorites" + userId.toString(),
        userData: user
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteFavorite = (req, res, next) => {
  const prodId = req.params.productId;

  req.user
    .removeFavorite(prodId)
    .then(user => {
      Product.findById(prodId).then(product => {
        product.removeFavorite(req.user._id);
      });
    })
    .then(result => {
      res.status(200).json({ message: "Success!" });
    })
    .catch(err => {
      res.status(500).json({ message: "Deleting Favorite failed." });
    });
};

exports.getDeleteAccount = (req, res, next) => {
  const userId = req.user._id;
  User.findById(userId)
    .then(user => {
      res.render("admin/deleteAccount", {
        docTitle: "Delete Account",
        path: "/admin/deleteAccount",
        user: user
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteAccount = (req, res, next) => {
  const userId = req.user._id;

  User.findById(userId).then(user => {
    Product.find({ userId: user._id })
      .then(products => {
        products.forEach(product => {
          product.imageUrl.forEach(imgUrl => {
            fileHelper.deleteFile(imgUrl);
          });
          product.remove();
        });
        return user;
      })
      .then(user => {
        if (user.userImage) {
          fileHelper.deleteFile(user.userImage);
        }
        user.messages.forEach(msg => {
          if (msg.toImage) {
            fileHelper.deleteFile(msg.toImage);
          }
          if (msg.fromImage) {
            fileHelper.deleteFile(msg.fromImage);
          }
        });

        return user.remove();
      })
      .then(result => {
        req.session.destroy(err => {
          res.redirect("/");
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.postUpdateDescription = (req, res, next) => {
  const userId = req.user._id;
  const description = req.body.description;

  User.findById(userId)
    .then(user => {
      user.description = description;
      user.save();
    })
    .then(result => {
      res.redirect("/admin/user/" + userId);
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postAddOffer = (req, res, next) => {
  const userId = req.user._id;
  const productId = req.params.productId;

  let toUsrId;
  let toUsr;
  let prod;
  let fromUsr;

  Product.findById(productId)
    .then(product => {
      prod = product;
      toUsrId = product.userId;

      product.offers.push({ from: userId });
      product.sold = true;
      product.save();
    })
    .then(result => {
      User.findById(userId)
        .then(user => {
          fromUsr = user;
          user.cart.items.push({ productId: productId });
          user.save();
        })
        .then(result => {
          User.findById(toUsrId)
            .then(usr => {
              toUsr = usr;
              usr.messages.push({
                subject: "Artwork sold!",
                message:
                  fromUsr.address.firstName +
                  " " +
                  fromUsr.address.surname +
                  " bought " +
                  prod.title +
                  " for " +
                  prod.price +
                  "€. Message " +
                  fromUsr.address.firstName +
                  " about shipping details.",
                newMessage: true,
                from: fromUsr._id,
                fromName:
                  fromUsr.address.firstName + " " + fromUsr.address.surname,
                fromImage: fromUsr.userImage,
                to: usr._id,
                toName: usr.username,
                toImage: usr.usrImage,
                conversationWith:
                  usr.address.firstName + " " + usr.address.surname,
                prodId: productId,
                time: moment().format("L") + " | " + moment().format("LT")
              });
              return usr.save();
            })
            .then(message => {
              fromUsr.messages.push({
                subject: "Artwork purchased!",
                message:
                  "You purchased " +
                  prod.title +
                  " for " +
                  prod.price +
                  "€. " +
                  toUsr.address.firstName +
                  " will inform you about shipping details.",
                newMessage: true,
                from: toUsr._id,
                fromName: toUsr.address.firstName + " " + toUsr.address.surname,
                fromImage: toUsr.userImage,
                to: fromUsr._id,
                toName: fromUsr.username,
                toImage: fromUsr.usrImage,
                conversationWith:
                  toUsr.address.firstName + " " + toUsr.address.surname,
                prodId: productId,
                time: moment().format("L") + " | " + moment().format("LT")
              });
              fromUsr.save();
              req.session.user = fromUsr;
              res.redirect("/cart");
            })
            .catch(err => {
              const error = new Error(err);
              error.httpStatusCode = 500;
              return next(error);
            });
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
