const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Create Schema
const LocationSchema = new Schema({
  locations: {
    type: [String],
    required: false
  }
});

module.exports = Location = mongoose.model("Location", LocationSchema);
