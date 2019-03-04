const express = require("express");

const router = express.Router();
const passport = require("passport");

//Load Input Validation
// const validateRegisterInput = require("../../validation/register");

//Load User Model
const Enquiry = require("../../models/Enquiry");
const User = require("../../models/User");

router.post("/addImages/:enquiryId", (req, res) => {
  Enquiry.findOneAndUpdate(
    { _id: req.params.enquiryId },
    { $set: { sampleImages: req.body } },
    { new: true }
  ).then(enquiry => res.json(enquiry));
});

router.post(
  "/addEnquiry",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    let budgetRange = { from: 0, to: 0, option: 0 };
    let leadAmount;
    const enquiry = req.body.enquiry;
    const category = req.body.category;
    category.budget.map(budget => {
      if (budget.option === enquiry.budget) {
        (budgetRange.from = budget.from),
          (budgetRange.to = budget.to),
          (budgetRange.option = budget.option),
          (leadAmount = budget.leadPrice);
      }
    });

    const newEnquiry = new Enquiry({
      user: req.user.id,
      category: category.name,
      serviceFor: enquiry.serviceFor,
      eventDate: enquiry.eventDate,
      servicesRequired: enquiry.servicesRequired,
      city: enquiry.city,
      locality: enquiry.locality,
      budgetRange: budgetRange,
      otherInfo: enquiry.otherInfo,
      leadAmount: leadAmount, //change
      source: enquiry.source,
      sampleImages: [],
      noOfGuests: enquiry.noOfGuests,
      isVerified: false,
      celebratonComment: enquiry.celebratonComment
    });

    newEnquiry
      .save()
      .then(enquiry => {
        res.json(enquiry);

        //Sending mail to admin
        var elasticemail = require("elasticemail");
        var client = elasticemail.createClient({
          username: "admin@celebraton.in",
          apiKey: "4110245d-e1d2-4944-ac43-52bd0d720c2b"
        });
        User.findById(enquiry.user).then(user => {
          const msg = {
            from: "admin@celebraton.in",
            from_name: "CelebratON.in",
            to: "admin@celebraton.in," + user.email,
            subject: "Enquiry Successful",
            body_html: `Dear ${user.name},<br>Your Enquiry for ${
              enquiry.category
            } is successful. Our representatives will call you soon to assist with your event.<br><br>You can call us at <a href="tel:07904204718">+917904204718</a> for any queries or further discussion<br><br>Happy Celebrating!`
          };

          client.mailer.send(msg, function(err, result) {
            if (err) {
              return console.error(err);
            }
          });
        });
      })
      .catch(err => console.log(err));
  }
);

router.post("/allEnquiries/:limit/:skip",passport.authenticate("jwt", { session: false }), (req, res) => {
  let query = {};
  if (typeof req.body.profile !== "undefined") {
    const profile = req.body.profile;

    query = {
      city: { $in: profile.locations },
      category: { $in: profile.categories },
      $or: [
        {
          $and: [
            { "budgetRange.from": { $gte: profile.budgetBracket } },
            { "budgetRange.to": 0 }
          ]
        },
        { "budgetRange.to": { $gte: profile.budgetBracket } }
      ],
      isVerified: true
    };
  }
  Enquiry.find(query)
    .populate("user")
    .sort({ createdAt: -1 })
    .limit(Number(req.params.limit))
    .skip(Number(req.params.skip))
    .then(enquiries => res.status(200).json(enquiries));
});

router.get("/currentEnquiry/:id",passport.authenticate("jwt", { session: false }), (req, res) => {
  Enquiry.findById(req.params.id)
    .populate("user")
    .then(enquiry => res.status(200).json(enquiry));
});

router.post("/updatePayment/:enquiryId/:profileId",passport.authenticate("jwt", { session: false }), (req, res) => {
  Enquiry.findOneAndUpdate(
    { _id: req.params.enquiryId },
    { $push: { interestedPartners: req.params.profileId } },
    { new: true }
  )
    .populate("user")
    .then(enquiry => {
      res.json(enquiry); //Sending mail to admin
      var elasticemail = require("elasticemail");
      var client = elasticemail.createClient({
        username: "admin@celebraton.in",
        apiKey: "4110245d-e1d2-4944-ac43-52bd0d720c2b"
      });
      Profile.findById(req.params.profileId)
        .populate("user")
        .then(profile => {
          const msg = {
            from: "admin@celebraton.in",
            from_name: "CelebratON.in",
            to: "admin@celebraton.in," + enquiry.user.email,
            subject: "New Vendor interest for your Enquiry",
            body_html: `Dear ${
              enquiry.user.name
            },<br><br>Thanks for choosing CelebratON.in for your event.<br><br>Your enquiry has been attended by one of our vendors who can cater to your requirements.<br><br>Vendor Profile: <a href='https://www.celebraton.in/profile?profileId=${
              profile.slug
            }'>${profile.companyName}</a><br>Vendor Mobile Number: <a href=${
              profile.user.mobile
            }>${profile.user.mobile}</a><br><br>Happy celebrating !!!`
          };

          client.mailer.send(msg, function(err, result) {
            if (err) {
              return console.error(err);
            }
          });
        });
    })
    .catch(err => console.log(err));
});

module.exports = router;
