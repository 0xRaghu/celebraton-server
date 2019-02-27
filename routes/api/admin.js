const express = require("express");

const router = express.Router();

const Location = require("../../models/Location");
const passport = require("passport");
const Enquiry = require("../../models/Enquiry");
const Profile = require("../../models/Profile");

sendEmail = (subject, body, enquiry) => {
  //Sending mail to admin
  var elasticemail = require("elasticemail");
  var client = elasticemail.createClient({
    username: "admin@celebraton.in",
    apiKey: "4110245d-e1d2-4944-ac43-52bd0d720c2b"
  });

  const query = {
    locations: enquiry.city,
    categories: enquiry.category,

    budgetBracket:
      enquiry.budgetRange.to === 0
        ? { $gt: enquiry.budgetRange.from }
        : { $lt: enquiry.budgetRange.to },

    isAuthorized: true
  };
  Profile.find(query)
    .populate("user")
    .then(profiles =>
      profiles.map(profile => {
        const msg = {
          from: "admin@celebraton.in",
          from_name: "CelebratON.in",
          to: "admin@celebraton.in," + profile.user.email,
          subject: subject,
          body_html: body
        };

        client.mailer.send(msg, function(err, result) {
          if (err) {
            return console.error(err);
          }
        });
      })
    );
};

router.post("/updateLocation/:id", (req, res) => {
  const locations = {};

  if (typeof req.body.locations !== "undefined")
    locations.locations = req.body.locations.split(",");

  Location.findOne({ _id: req.params.id })
    .then(locationList => {
      if (locationList) {
        Location.findOneAndUpdate(
          { _id: req.params.id },
          { $set: locations },
          { new: true }
        )
          .then(location => res.json(location))
          .catch(err => console.log(err));
      } else {
        new Location(locations)
          .save()
          .then(location => res.json(location))
          .catch(err => console.log(err));
      }
    })
    .catch(err => console.log(err));
});

router.get("/getLocations", (req, res) => {
  Location.find()

    .then(location => res.json(location))
    .catch(err => console.log(err));
});

router.get("/allCategories", (req, res) => {
  Category.find()
    .sort({ order: 1 })
    .then(categories => res.status(200).json(categories));
});

router.post(
  "/adminManageEnquiry",
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

    User.findOne({ mobile: enquiry.mobile })
      .then(user => {
        if (user) {
          //Generate OTP
          const otp = Math.floor(1000 + Math.random() * 9000);
          var userObject = {
            mobile: enquiry.mobile,
            email: enquiry.email,
            name: enquiry.name,
            tempPassword: otp,
            role: "customer"
          };
          //Update in database
          User.updateOne({ _id: user.id }, userObject, function(err, res) {})
            .then()
            .catch(err => console.log(err));
        } else {
          //Generate OTP
          const otp = Math.floor(1000 + Math.random() * 9000);

          const newUser = new User({
            mobile: enquiry.mobile,
            email: enquiry.email,
            name: enquiry.name,
            tempPassword: otp,
            role: "customer"
          });

          newUser.save();
        }
      })
      .then(
        User.findOne({ mobile: enquiry.mobile }).then(user => {
          //Create Enquiry

          if (req.body.mode === "create") {
            const newEnquiry = new Enquiry({
              user: user.id,
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
              isVerified: enquiry.isVerified,
              celebratonComment: enquiry.celebratonComment
            });

            newEnquiry
              .save()
              .populate("user")
              .then(enq => {
                if (enquiry.sendNotification) {
                  sendEmail("Hi", "hi", enq);
                }

                res.json(enq);
              });
          } else {
            //Update Enquiry
            Enquiry.findOneAndUpdate(
              { _id: req.body.id },
              {
                $set: {
                  user: user.id,
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
                  isVerified: enquiry.isVerified,
                  celebratonComment: enquiry.celebratonComment
                }
              },
              { new: true }
            )
              .populate("user")
              .then(enq => {
                if (enquiry.sendNotification) {
                  sendEmail("Hi", "hi", enq);
                }

                res.json(enq);
              });
          }
        })
      )

      .catch(err => console.log(err));
  }
);

router.post(
  "/adminManageProfile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const profile = req.body.values;
    const mode = req.body.mode;
    console.log(profile);

    User.findOne({ mobile: profile.mobile })
      .then(user => {
        if (user) {
          //Generate OTP
          const otp = Math.floor(1000 + Math.random() * 9000);
          var userObject = {
            mobile: profile.mobile,
            email: profile.email,
            name: profile.name,
            tempPassword: otp,
            role: "vendor"
          };
          //Update in database
          User.updateOne({ _id: user.id }, userObject, function(err, res) {}, {
            new: true
          })
            .then()
            .catch(err => console.log(err));
        } else {
          //Generate OTP
          const otp = Math.floor(1000 + Math.random() * 9000);

          const newUser = new User({
            mobile: profile.mobile,
            email: profile.email,
            name: profile.name,
            tempPassword: otp,
            role: "vendor"
          });

          newUser.save();
        }
      })
      .then(
        User.findOne({ mobile: profile.mobile }).then(user => {
          const newProfile = {};
          if (user.id) newProfile.user = user.id;
          if (profile.companyName)
            newProfile.slug = profile.companyName
              .toLowerCase()
              .replace(/[^\w ]+/g, "")
              .replace(/ +/g, "-");
          if (profile.companyName) newProfile.companyName = profile.companyName;

          if (profile.description) newProfile.description = profile.description;
          if (profile.budgetBracket)
            newProfile.budgetBracket = profile.budgetBracket;
          if (profile.primaryLocation)
            newProfile.primaryLocation = profile.primaryLocation;

          if (profile.locations) newProfile.locations = profile.locations;
          if (profile.categories) newProfile.categories = profile.categories;
          if (profile.videos) newProfile.videos = profile.videos.split(",");
          let embedUrl = [];
          if (profile.videos) {
            profile.videos.split(",").map(video => {
              var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
              var match = video.match(regExp);
              if (match && match[2].length == 11) {
                embedUrl.push(match[2]);
              }
            });
            newProfile.videoEmbedUrl = embedUrl;
          }

          if (profile.isAuthorized)
            newProfile.isAuthorized = profile.isAuthorized;
          if (profile.addToHome) newProfile.addToHome = profile.addToHome;
          if (profile.artistOrder) newProfile.artistOrder = profile.artistOrder;
          if (profile.artistSubCategory)
            newProfile.artistSubCategory = profile.artistSubCategory;
          profile.experience
            ? (newProfile.experience = profile.experience)
            : null;
          profile.eventsCovered
            ? (newProfile.eventsCovered = profile.eventsCovered)
            : null;
          profile.cancellationPolicy
            ? (newProfile.cancellationPolicy = profile.cancellationPolicy)
            : null;
          profile.paymentTerms
            ? (newProfile.paymentTerms = profile.paymentTerms)
            : null;
          profile.artistGenre
            ? (newProfile.artistGenre = profile.artistGenre)
            : null;
          profile.languagesKnown
            ? (newProfile.languagesKnown = profile.languagesKnown)
            : null;
          profile.openToTravel
            ? (newProfile.openToTravel = profile.openToTravel)
            : null;
          profile.troupeSizeP
            ? (newProfile.troupeSizeP = profile.troupeSizeP)
            : null;
          profile.troupeSizeNP
            ? (newProfile.troupeSizeNP = profile.troupeSizeNP)
            : null;
          profile.performanceDuration
            ? (newProfile.performanceDuration = profile.performanceDuration)
            : null;
          profile.eventPreference
            ? (newProfile.eventPreference = profile.eventPreference)
            : null;
          profile.managedBy ? (newProfile.managedBy = profile.managedBy) : null;
          profile.managerName
            ? (newProfile.managerName = profile.managerName)
            : null;
          profile.managerNumber
            ? (newProfile.managerNumber = profile.managerNumber)
            : null;
          profile.managerMail
            ? (newProfile.managerMail = profile.managerMail)
            : null;

          if (mode === "update") {
            Profile.findOneAndUpdate(
              { user: user.id },
              { $set: newProfile },
              { new: true }
            )
              .populate("user")
              .then(profile => res.json(profile));
          } else {
            if (profile.avgRating) {
              newProfile.avgRating = profile.avgRating;
            } else {
              newProfile.avgRating = 0;
            }
            if (profile.promoCredit) {
              newProfile.promoCredit = profile.promoCredit;
            } else {
              newProfile.promoCredit = 0;
            }
            if (profile.Wallet) {
              newProfile.Wallet = profile.Wallet;
            } else {
              newProfile.Wallet = 0;
            }
            if (profile.readCount) {
              newProfile.readCount = profile.readCount;
            } else {
              newProfile.readCount = 0;
            }
            profile.enquiriesRead
              ? (newProfile.enquiriesRead = profile.enquiriesRead)
              : [];
            profile.enquiriesBought
              ? (newProfile.enquiriesBought = profile.enquiriesBought)
              : [];
            if (profile.leadsBought) {
              newProfile.leadsBought = profile.leadsBought;
            } else {
              newProfile.leadsBought = 0;
            }

            if (profile.paidBy) {
              newProfile.paidBy = profile.paidBy;
            } else {
              newProfile.paidBy = {};
            }
            newProfile.images = [];

            profile.ratings ? (newProfile.ratings = profile.ratings) : [];
            profile.wishList ? (newProfile.wishList = profile.wishList) : [];
            new Profile(newProfile)
              .save()
              .populate("user")
              .then(profile => res.json(profile));
          }
        })
      )

      .catch(err => console.log(err));
  }
);

module.exports = router;
