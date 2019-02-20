const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Create Schema
const ContactFormSchema = new Schema({
  name: {
    type: String,
    required: false
  },
  mobile: {
    type: String,
    required: true
  },
  role: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = ContactForm = mongoose.model(
  "contactForms",
  ContactFormSchema
);
