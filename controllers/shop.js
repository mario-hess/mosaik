const Product = require("../models/product");
const User = require("../models/user");

const ITEMS_PER_PAGE = 4;

exports.getProducts = (req, res, next) => {
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
      res.render("shop/product-list", {
        prods: products,
        docTitle: "Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        errorMessage: null
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product.sold) {
        res.render("shop/product-detail", {
          product: product,
          docTitle: product.title,
          path: "/products"
        });
      } else {
        res.redirect("/products");
      }
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  res.render("shop/index", {
    docTitle: "Mosaik",
    path: "/",
    errorMessage: null,
    successMessage: null
  });
};

exports.getCart = (req, res, next) => {
  const productIds = [];
  const productsArr = [];
  let userData = null;
  let processedItems = 0;

  User.findById(req.user._id)
    .then(user => {
      userData = user;
      userData.cart.items.map(prodId => {
        productIds.push(prodId.productId);
      });
      return productIds;
    })
    .then(prodIds => {
      Promise.all(
        prodIds.map(prodId => {
          return Product.findById(prodId)
            .then(product => {
              if (product) {
                return User.findById(product.userId).then(user => {
                  productsArr.push({
                    prod: product,
                    fromUser: user,
                    priceOffer: userData.cart.items[processedItems].price
                  });
                  processedItems++;
                });
              }
            })
            .catch(err => {
              const error = new Error(err);
              error.httpStatusCode = 500;
              return next(error);
            });
        })
      ).then(result => {
        res.render("shop/cart", {
          path: "/cart",
          docTitle: "Cart",
          products: productsArr,
          userData: userData
        });
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

