const express = require("express");

const router = express.Router();
const passport = require("passport");

//Load Contact Form Validation
// const validateContactForm = require("../../validation/contactForm");

const Profile = require("../../models/Profile");

router.post(
  "/addOrUpdateProfile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    //   const { errors, isValid } = validateProfile(req.body);
    //   //Check Validation
    //   if (!isValid) {
    //     res.status(400).json(errors);
    //   }
    const newProfile = {};

    if (req.user.id) newProfile.user = req.user.id;
    if (req.body.slug) newProfile.slug = req.body.slug;
    if (req.body.companyName) newProfile.companyName = req.body.companyName;
    if (req.body.avgRating) newProfile.avgRating = 0;
    if (req.body.promoCredit) newProfile.promoCredit = req.body.promoCredit;
    if (req.body.Wallet) newProfile.Wallet = 0;
    if (req.body.readCount) newProfile.readCount = 0;
    if (req.body.description) newProfile.description = req.body.description;
    if (req.body.budgetBracket)
      newProfile.budgetBracket = req.body.budgetBracket;
    if (req.body.primaryLocation)
      newProfile.primaryLocation = req.body.primaryLocation;
    req.body.enquiriesRead
      ? (newProfile.enquiriesRead = req.body.enquiriesRead)
      : [];
    if (req.body.locations) newProfile.locations = req.body.locations;
    if (req.body.categories) newProfile.categories = req.body.categories;
    if (req.body.images) newProfile.images = req.body.images;
    if (req.body.videos) newProfile.videos = req.body.videos;
    newProfile.isAuthorized = false;

    req.body.ratings ? (newProfile.ratings = req.body.ratings) : [];

    Profile.findOne({ user: req.user.id })
      .then(profile => {
        if (profile) {
          Profile.findOneAndUpdate(
            { user: req.user.id },
            { $set: newProfile },
            { new: true }
          )
            .then(profile => res.json(profile))
            .catch(err => console.log(err));
        } else {
          new Profile(newProfile)
            .save()
            .populate("user")
            .then(profile => {
              res.json(profile); //Sending mail to admin
              var elasticemail = require("elasticemail");
              var client = elasticemail.createClient({
                username: "admin@celebraton.in",
                apiKey: "4110245d-e1d2-4944-ac43-52bd0d720c2b"
              });
              const msg = {
                from: "admin@celebraton.in",
                from_name: "CelebratON.in",
                to: profile.user.email,
                subject: "CelebratON - Profile created",
                body_html: "Wait for authorization"
              };

              client.mailer.send(msg, function(err, result) {
                if (err) {
                  return console.error(err);
                }
              });
            })
            .catch(err => console.log(err));
        }
      })
      .catch(err => console.log(err));
  }
);

router.get(
  "/getProfile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => res.json(profile))
      .catch(err => res.json(err));
  }
);

router.post(
  "/updatePayment/:enquiryId/:profileId/:leadAmount/:paymentInfo",
  (req, res) => {
    const leadAmount = Number(req.params.leadAmount);
    const newEnquiry = {
      enquiry: req.params.enquiryId,
      paymentId:
        req.params.paymentInfo == "walletOrPromo"
          ? "Wallet"
          : req.params.paymentInfo
    };
    let walletDeduct = 0,
      promoDeduct = 0,
      paidBywallet = 0,
      paidBycash = 0,
      paidBypromo = 0;
    Profile.findById(req.params.profileId).then(profile => {
      if (leadAmount - profile.promoCredit <= 0) {
        promoDeduct = -leadAmount;
        paidBypromo = leadAmount;
      } else {
        if (leadAmount - profile.promoCredit - profile.Wallet <= 0) {
          promoDeduct = -profile.promoCredit;
          paidBypromo = profile.promoCredit;
          walletDeduct = -(leadAmount - profile.promoCredit);

          paidBywallet = leadAmount - profile.promoCredit;
        } else {
          promoDeduct = -profile.promoCredit;
          paidBypromo = profile.promoCredit;
          walletDeduct = -profile.Wallet;
          paidBywallet = profile.Wallet;

          paidBycash = leadAmount - (profile.Wallet + profile.promoCredit);
        }
      }
      const Wallet = profile.Wallet + walletDeduct;
      const promoCredit = profile.promoCredit + promoDeduct;
      const paidBy = {
        wallet: profile.paidBy.wallet + paidBywallet,
        cash: profile.paidBy.cash + paidBycash,
        promo: profile.paidBy.promo + paidBypromo
      };

      const leadsBought = profile.leadsBought + 1;

      Profile.findOneAndUpdate(
        { _id: req.params.profileId },
        // { $push: { enquiriesBought: enquiry } },
        {
          $set: {
            Wallet,
            promoCredit,
            paidBy,
            leadsBought
          }
        }
      )
        .then(profile => {
          Profile.findOneAndUpdate(
            { _id: req.params.profileId },
            { $push: { enquiriesBought: newEnquiry } }
          )
            .then(profile => res.json(profile))
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    });
  }
);

router.get("/currentProfile/:slug", (req, res) => {
  Profile.findOne({ slug: req.params.slug }).then(profile =>
    res.status(200).json(profile)
  );
});

router.get("/allProfiles/:limit/:skip", (req, res) => {
  Profile.find()
    .populate("user")
    .sort({ createdAt: -1 })
    .limit(Number(req.params.limit))
    .skip(Number(req.params.skip))
    .then(profiles => res.status(200).json(profiles));
});

router.get("/adminCurrentProfile/:id", (req, res) => {
  console.log(req.params);
  Profile.findById(req.params.id)
    .populate("user")
    .then(profile => res.status(200).json(profile));
});

module.exports = router;
