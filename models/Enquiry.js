const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Create Schema
const EnquirySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "users"
  },
  category: {
    type: String
  },
  serviceFor: {
    type: String
  },
  eventDate: {
    type: Date
  },
  servicesRequired: { type: [String] },
  city: {
    type: String
  },
  locality: {
    type: String
  },
  budget: {
    type: String
  },
  budgetRange: {
    from: {
      type: Number
    },
    to: {
      type: Number
    },
    option: {
      type: Number
    }
  },
  otherInfo: {
    type: String
  },
  leadAmount: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  source: { type: String },
  lastPaidAt: {
    type: Date
  },
  noOfGuests: {
    type: Number
  },
  sampleImages: { type: [String] },
  isVerified: {
    type: Boolean
  },
  celebratonComment: {
    type: String
  },
  interestedPartners: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "profiles"
      }
    ]
  },
  feedback: {
    booked: { type: Boolean },
    throughCelebratON: { type: Boolean },
    noReason: { type: String },
    notBooked: { type: String },
    star: { type: Number },
    rating: { type: String },
    partnerChosen: { type: Schema.Types.ObjectId, ref: "users" }
  },
  nameOfExhibition: {
    type: String
  },
  nameOfExhibitor: {
    type: String
  },
  stallSize: {
    type: String
  },
  sidesOpen: {
    type: String
  },
  stallLocation: {
    type: String
  },
  stallNumber: {
    type: String
  },
  floorPlan: { type: [String] }
});

module.exports = Enquiry = mongoose.model("enquiries", EnquirySchema);
