const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Create Schema
const ProfileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "users"
  },
  slug: {
    type: String
  },
  companyName: {
    type: String,
    required: true
  },
  avgRating: {
    type: Number
  },
  promoCredit: {
    type: Number
  },
  Wallet: {
    type: Number
  },
  readCount: {
    type: Number
  },
  description: {
    type: String
  },
  budgetBracket: {
    type: Number
  },
  primaryLocation: {
    type: String
  },
  enquiriesRead: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "enquiries"
      }
    ]
  },
  enquiriesBought: {
    type: [
      {
        enquiry: {
          type: Schema.Types.ObjectId,
          ref: "enquiries"
        },
        paymentId: { type: String }
      }
    ]
  },
  wishList: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "enquiries"
      }
    ]
  },
  images: { type: [String] },
  locations: { type: [String] },
  categories: { type: [String] },
  videos: { type: [String] },
  paidBy: {
    wallet: {
      type: Number
    },
    cash: {
      type: Number
    },
    promo: {
      type: Number
    }
  },
  leadsBought: {
    type: Number
  },
  isAuthorized: { type: Boolean },
  ratings: [
    {
      rating: {
        type: Number
      },
      review: {
        type: String
      },
      user: {
        type: Schema.Types.ObjectId,
        ref: "users"
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Profile = mongoose.model("profiles", ProfileSchema);
