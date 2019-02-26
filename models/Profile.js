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
  images: {
    type: [
      {
        original: { type: String },
        thumbnail: { type: String }
      }
    ]
  },
  addToHome: { type: Boolean },
  artistOrder: { type: Number },
  artistSubCategory: { type: String },
  locations: { type: [String] },
  categories: { type: [String] },
  videos: { type: [String] },
  videoEmbedUrl: { type: [String] },
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
  experience: { type: String },
  eventsCovered: { type: String },
  cancellationPolicy: { type: String },
  paymentTerms: { type: String },
  artistGenre: { type: String },
  languagesKnown: { type: String },
  openToTravel: { type: Boolean },
  troupeSizeP: { type: String },
  troupeSizeNP: { type: String },
  performanceDuration: { type: String },
  eventPreference: { type: String },
  managedBy: { type: String },
  managerName: { type: String },
  managerNumber: { type: Number },
  managerMail: { type: String },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Profile = mongoose.model("profiles", ProfileSchema);
