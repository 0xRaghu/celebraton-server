const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Create Schema
const CategorySchema = new Schema({
  name: {
    type: String,
    required: false
  },
  slug: {
    type: String,
    required: false
  },
  icon: {
    type: String,
    required: false
  },
  eventType: {
    type: [String]
  },
  servicesRequired: {
    type: [String]
  },
  budget: [
    {
      option: {
        type: Number
      },
      from: {
        type: Number
      },
      to: {
        type: Number
      },
      leadPrice: {
        type: Number
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  },
  order: {
    type: Number
  }
});

module.exports = Category = mongoose.model("categories", CategorySchema);
