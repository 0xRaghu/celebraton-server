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

router.post("/addFloorImages/:enquiryId", (req, res) => {
  Enquiry.findOneAndUpdate(
    { _id: req.params.enquiryId },
    { $set: { floorPlan: req.body } },
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
      celebratonComment: enquiry.celebratonComment,
      nameOfExhibition: enquiry.nameOfExhibition,
      nameOfExhibitor: enquiry.nameOfExhibitor,
      stallSize: enquiry.stallSize,
      sidesOpen: enquiry.sidesOpen,
      stallLocation: enquiry.stallLocation,
      stallNumber: enquiry.stallNumber,
      floorPlan: []
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
            } is successful. Our representatives will call you soon to assist with your event.<br><br><b>"CelebratON critically suggests you to make your payment (advance and final settlement) through CelebratON ( Kindly Demand the expert to share the payment link (or call us at <a href="tel:08082338257">+918082338257</a>) upon confirming your order to any of our experts). So that we can safeguard your payment with us in case of any dispute. 
            If payment is not done through CelebratON and directly to experts, CelebratON will not hold responsibility of your order for any kind of dispute"</b><br><br>You can call us at <a href="tel:08082338257">+918082338257</a> for any queries or further discussion<br><br>Happy Celebrating!`
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

router.post("/allEnquiries/:limit/:skip", (req, res) => {
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

router.get("/allEnquiriesSearch", (req, res) => {
  let query = req.body.search;

  // Enquiry.createIndex({
  //   category: "text",
  //   serviceFor: "text",
  //   city: "text",
  //   locality: "text",
  //   otherInfo: "text",
  //   celebratonComment: "text",
  //   user: "text"
  // });
  Enquiry.find({
    $text: { $search: query }
  })
    .populate("user")
    .sort({ createdAt: -1 })
    .then(enquiries => res.status(200).json(enquiries));
});

router.get("/currentEnquiry/:id", (req, res) => {
  Enquiry.findById(req.params.id)
    .populate("user")
    .then(enquiry => res.status(200).json(enquiry));
});

router.post("/capturePayment", (req, res) => {
  id = req.body.responseId;
  amount = req.body.amountToPay;
  var request = require("request");
  request(
    {
      method: "POST",
      // url: 'https://rzp_test_HAxh4YMFxq5aKf:QlZ86FAIaxjy3bUnHwIVGroO@api.razorpay.com/v1/payments/'+id+'/capture',
      url:
        "https://rzp_live_g0RFgYo3CprLSc:l67bIkZKFOhNcQdkP1jcOmi0@api.razorpay.com/v1/payments/" +
        id +
        "/capture",
      form: {
        amount: amount
      }
    },
    function(error, response, body) {
      // console.log('Status:', response.statusCode);
      // console.log('Headers:', JSON.stringify(response.headers));
      // console.log('Response:', body);
    }
  );
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
            }>${
              profile.user.mobile
            }</a><br><br><b>"CelebratON critically suggests you to make your payment (advance and final settlement) through CelebratON ( Kindly Demand the expert to share the payment link (or call us at <a href="tel:08082338257">+918082338257</a>) upon confirming your order to any of our experts). So that we can safeguard your payment with us in case of any dispute. 
            If payment is not done through CelebratON and directly to experts, CelebratON will not hold responsibility of your order for any kind of dispute"</b><br><br>Happy celebrating !!!`
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
