const express = require("express");

const router = express.Router();
const passport = require("passport");

//Load Input Validation
// const validateRegisterInput = require("../../validation/register");

//Load User Model
const Enquiry = require("../../models/Enquiry");

router.post("/addImages", (req, res) => {});

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
      sampleImages: enquiry.sampleImages,
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
        const msg = {
          from: "admin@celebraton.in",
          from_name: "CelebratON.in",
          to: "admin@celebraton.in",
          subject: "New Enquiry",
          body_html: "body"
        };

        client.mailer.send(msg, function(err, result) {
          if (err) {
            return console.error(err);
          }
        });
      })
      .catch(err => console.log(err));
  }
);

router.get("/allEnquiries/:limit/:skip", (req, res) => {
  let query = {};
  if (typeof req.query.profile !== "undefined") {
    const profile = req.query.profile;
    query = {
      city: { $in: profile.locations },
      category: { $in: profile.categories },
      $or: [
        {
          $and: [
            { "budgetRange.from": { $gt: profile.budgetBracket } },
            { "budgetRange.to": 0 }
          ]
        },
        { "budgetRange.to": { $gt: profile.budgetBracket } }
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

router.get("/currentEnquiry/:id", (req, res) => {
  Enquiry.findById(req.params.id)
    .populate("user")
    .then(enquiry => res.status(200).json(enquiry));
});

router.post("/updatePayment/:enquiryId/:profileId", (req, res) => {
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
      const msg = {
        from: "admin@celebraton.in",
        from_name: "CelebratON.in",
        to: enquiry.user.email,
        subject: "New Vendor interest",
        body_html: "Someone bought your enquiry"
      };

      client.mailer.send(msg, function(err, result) {
        if (err) {
          return console.error(err);
        }
      });
    })
    .catch(err => console.log(err));
});

module.exports = router;
