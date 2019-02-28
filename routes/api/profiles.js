const express = require("express");

const router = express.Router();
const passport = require("passport");

//Load Contact Form Validation
// const validateContactForm = require("../../validation/contactForm");

const Profile = require("../../models/Profile");
const User = require("../../models/User");

router.post(
  "/addProfile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const newProfile = {};

    if (req.user.id) newProfile.user = req.user.id;
    if (req.body.companyName)
      newProfile.slug = req.body.companyName
        .toLowerCase()
        .replace(/[^\w ]+/g, "")
        .replace(/ +/g, "-");
    if (req.body.companyName) newProfile.companyName = req.body.companyName;
    if (req.body.avgRating) {
      newProfile.avgRating = req.body.avgRating;
    } else {
      newProfile.avgRating = 0;
    }
    if (req.body.promoCredit) {
      newProfile.promoCredit = req.body.promoCredit;
    } else {
      newProfile.promoCredit = 0;
    }
    if (req.body.Wallet) {
      newProfile.Wallet = req.body.Wallet;
    } else {
      newProfile.Wallet = 0;
    }
    if (req.body.readCount) {
      newProfile.readCount = req.body.readCount;
    } else {
      newProfile.readCount = 0;
    }
    if (req.body.description) newProfile.description = req.body.description;
    if (req.body.budgetBracket)
      newProfile.budgetBracket = req.body.budgetBracket;
    if (req.body.primaryLocation)
      newProfile.primaryLocation = req.body.primaryLocation;
    req.body.enquiriesRead
      ? (newProfile.enquiriesRead = req.body.enquiriesRead)
      : [];
    req.body.enquiriesBought
      ? (newProfile.enquiriesBought = req.body.enquiriesBought)
      : [];
    req.body.wishList ? (newProfile.wishList = req.body.wishList) : [];
    if (req.body.locations) newProfile.locations = req.body.locations;
    if (req.body.categories) newProfile.categories = req.body.categories;
    if (req.body.videos) newProfile.videos = req.body.videos.split(",");
    let embedUrl = [];
    if (req.body.videos) {
      req.body.videos.split(",").map(video => {
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = video.match(regExp);
        if (match && match[2].length == 11) {
          embedUrl.push(match[2]);
        }
      });
      newProfile.videoEmbedUrl = embedUrl;
    }

    newProfile.isAuthorized = false;
    if (req.body.leadsBought) {
      newProfile.leadsBought = req.body.leadsBought;
    } else {
      newProfile.leadsBought = 0;
    }
    if (req.body.paidBy) {
      newProfile.paidBy = req.body.paidBy;
    } else {
      newProfile.paidBy = { wallet: 0, cash: 0, promo: 0 };
    }
    newProfile.images = [];

    req.body.ratings ? (newProfile.ratings = req.body.ratings) : [];
    newProfile.addToHome = false;
    req.body.experience ? (newProfile.experience = req.body.experience) : "";
    req.body.eventsCovered
      ? (newProfile.eventsCovered = req.body.eventsCovered)
      : "";
    req.body.cancellationPolicy
      ? (newProfile.cancellationPolicy = req.body.cancellationPolicy)
      : "";
    req.body.paymentTerms
      ? (newProfile.paymentTerms = req.body.paymentTerms)
      : "";
    req.body.artistGenre ? (newProfile.artistGenre = req.body.artistGenre) : "";
    req.body.languagesKnown
      ? (newProfile.languagesKnown = req.body.languagesKnown)
      : "";
    req.body.openToTravel
      ? (newProfile.openToTravel = req.body.openToTravel)
      : false;
    req.body.troupeSizeP ? (newProfile.troupeSizeP = req.body.troupeSizeP) : "";
    req.body.troupeSizeNP
      ? (newProfile.troupeSizeNP = req.body.troupeSizeNP)
      : "";
    req.body.performanceDuration
      ? (newProfile.performanceDuration = req.body.performanceDuration)
      : "";
    req.body.eventPreference
      ? (newProfile.eventPreference = req.body.eventPreference)
      : "";
    req.body.managedBy ? (newProfile.managedBy = req.body.managedBy) : "";
    req.body.managerName ? (newProfile.managerName = req.body.managerName) : "";
    req.body.managerNumber
      ? (newProfile.managerNumber = req.body.managerNumber)
      : "";
    req.body.managerMail ? (newProfile.managerMail = req.body.managerMail) : "";

    Profile.findOne({ user: req.user.id })
      .then(profile => {
        if (profile) {
          null;
        } else {
          new Profile(newProfile)
            .save()

            .then(profile => {
              res.json(profile); //Sending mail to admin
              var elasticemail = require("elasticemail");
              var client = elasticemail.createClient({
                username: "admin@celebraton.in",
                apiKey: "4110245d-e1d2-4944-ac43-52bd0d720c2b"
              });
              User.findById(profile.user).then(user => {
                const msg = {
                  from: "admin@celebraton.in",
                  from_name: "CelebratON.in",
                  to: "admin@celebraton.in," + user.email,
                  subject: "CelebratON - Profile created",
                  body_html: `Dear ${
                    profile.companyName
                  },<br><br>Thanks for partnering with CelebratON.in.<br><br>Your profile has been successfully created.<br><br>You will start getting leads for your business once we <b>authorize</b> your profile. You can call us at <a href="tel:07904204718">+917904204718</a> for any queries or authorization<br><br>You can check your profile or edit in the link: <a href='https://www.celebraton.in/dashboard'>My Dashboard</a><br><br>View the details of the lead and order, pay the lead amount and get connected directly to the customer.<br><br>Your can view your Profile at: <a href='https://www.celebraton.in/profile?profileId=${
                    profile.slug
                  }'>${
                    profile.companyName
                  }</a><br><br>You can Edit/Update details of your profile in the 'Manage Profile' tab.<br>You can share this link to people for Ratings and Reviews and improve your profile.<br><br>Happy celebrating !!!`
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
      })
      .catch(err => console.log(err));
  }
);

router.post(
  "/updateProfile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const newProfile = {};

    if (req.user.id) newProfile.user = req.user.id;
    if (req.body.companyName)
      newProfile.slug = req.body.companyName
        .toLowerCase()
        .replace(/[^\w ]+/g, "")
        .replace(/ +/g, "-");
    if (req.body.companyName) newProfile.companyName = req.body.companyName;

    if (req.body.description) newProfile.description = req.body.description;
    if (req.body.budgetBracket)
      newProfile.budgetBracket = req.body.budgetBracket;
    if (req.body.primaryLocation)
      newProfile.primaryLocation = req.body.primaryLocation;

    if (req.body.locations) newProfile.locations = req.body.locations;
    if (req.body.categories) newProfile.categories = req.body.categories;
    if (req.body.videos) newProfile.videos = req.body.videos.split(",");
    req.body.experience ? (newProfile.experience = req.body.experience) : null;
    req.body.eventsCovered
      ? (newProfile.eventsCovered = req.body.eventsCovered)
      : null;
    req.body.cancellationPolicy
      ? (newProfile.cancellationPolicy = req.body.cancellationPolicy)
      : null;
    req.body.paymentTerms
      ? (newProfile.paymentTerms = req.body.paymentTerms)
      : null;
    req.body.artistGenre
      ? (newProfile.artistGenre = req.body.artistGenre)
      : null;
    req.body.languagesKnown
      ? (newProfile.languagesKnown = req.body.languagesKnown)
      : null;
    req.body.openToTravel
      ? (newProfile.openToTravel = req.body.openToTravel)
      : null;
    req.body.troupeSizeP
      ? (newProfile.troupeSizeP = req.body.troupeSizeP)
      : null;
    req.body.troupeSizeNP
      ? (newProfile.troupeSizeNP = req.body.troupeSizeNP)
      : null;
    req.body.performanceDuration
      ? (newProfile.performanceDuration = req.body.performanceDuration)
      : null;
    req.body.eventPreference
      ? (newProfile.eventPreference = req.body.eventPreference)
      : null;
    req.body.managedBy ? (newProfile.managedBy = req.body.managedBy) : null;
    req.body.managerName
      ? (newProfile.managerName = req.body.managerName)
      : null;
    req.body.managerNumber
      ? (newProfile.managerNumber = req.body.managerNumber)
      : null;
    req.body.managerMail
      ? (newProfile.managerMail = req.body.managerMail)
      : null;
    let embedUrl = [];
    if (req.body.videos) {
      req.body.videos.split(",").map(video => {
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = video.match(regExp);
        if (match && match[2].length == 11) {
          embedUrl.push(match[2]);
        }
      });
      newProfile.videoEmbedUrl = embedUrl;
    }

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
        }
      })
      .catch(err => console.log(err));
  }
);

router.post("/addImages/:profileId", async (req, res) => {
  Profile.findOneAndUpdate(
    { _id: req.params.profileId },
    { $set: { images: req.body } },
    { new: true }
  ).then(profile => res.json(profile));
});

router.get(
  "/getProfile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        res.json(profile);
      })
      .catch(err => console.log(err));
  }
);

router.get("/artistProfiles/:limit/:skip", (req, res) => {
  Profile.find({ addToHome: true })
    .limit(Number(req.params.limit))
    .skip(Number(req.params.skip))
    .sort({ artistOrder: 1 })
    .then(profiles => {
      res.json(profiles);
    })
    .catch(err => console.log(err));
});

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
        },
        { new: true }
      )
        .then(profile => {
          Profile.findOneAndUpdate(
            { _id: req.params.profileId },
            { $push: { enquiriesBought: newEnquiry } },
            { new: true }
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
  Profile.findById(req.params.id)
    .populate("user")
    .then(profile => res.status(200).json(profile));
});

router.post(
  "/readEnquiry",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    console.log(req.body.id);
    Profile.findOneAndUpdate(
      { user: req.user.id },
      { $push: { enquiriesRead: req.body.id } },
      { new: true }
    ).then(profile => res.json(profile));
  }
);

router.post(
  "/wishListEnquiry",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOneAndUpdate(
      { user: req.user.id },
      { $push: { wishList: req.body.id } },
      { new: true }
    ).then(profile => res.json(profile));
  }
);

router.post(
  "/addMoneyToWallet/:profileId/:amount",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOneAndUpdate(
      { _id: req.params.profileId },
      { $inc: { Wallet: Number(req.params.amount) } },
      { new: true }
    ).then(profile => res.json(profile));
  }
);

module.exports = router;
