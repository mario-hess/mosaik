const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  userImage: {
    type: String
  },
  address: {
    firstName: {
      type: String,
      required: true
    },
    surname: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    postalCode: {
      type: Number,
      required: true
    },
    city: {
      type: String,
      required: true
    }
  },
  favorites: [
    {
      type: Schema.Types.ObjectId,
      ref: "Product"
    }
  ],
  description: {
    type: String
  },
  messages: [
    {
      subject: { type: String },
      message: { type: String },
      newMessage: { type: Boolean },
      from: { type: Schema.Types.ObjectId },
      fromName: { type: String },
      fromImage: { type: String },
      to: { type: Schema.Types.ObjectId },
      toName: { type: String },
      toImage: { type: String },
      conversationWith: { type: String },
      prodId: { type: Schema.Types.ObjectId },
      time: { type: String }
    }
  ],
  resetToken: String,
  resetTokenExpiration: Date,
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: "Product"
    }
  ],
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true
        }
      }
    ]
  }
});

userSchema.methods.removeFavorite = function(productId) {
  const updatedFavorites = this.favorites.filter(item => {
    return item._id.toString() !== productId.toString();
  });
  this.favorites = updatedFavorites;
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
