const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  imageUrl: [
    {
      type: String,
      required: true
    }
  ],
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sold: {
    type: Boolean,
    required: true
  },
  favorites: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  offers: [
    {
      from: {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    }
  ]
});

productSchema.methods.removeFavorite = function(userId) {
  const updatedFavorites = this.favorites.filter(item => {
    return item._id.toString() !== userId.toString();
  });
  this.favorites = updatedFavorites;
  return this.save();
};

module.exports = mongoose.model("Product", productSchema);
