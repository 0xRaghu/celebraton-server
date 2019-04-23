const express = require("express");

const router = express.Router();
const moment = require("moment");

const Location = require("../../models/Location");
const passport = require("passport");
const Enquiry = require("../../models/Enquiry");
const Profile = require("../../models/Profile");
const importedProfiles = require("../../models/importedprofiles");

router.get("/changePlannersDetails", (req, res) => {
  Profile.find().then(profiles => {
    profiles.map(pro => {
      const profile = pro;

      if (profile.categories[8] == "SurprisePlanner") {
        profile.categories[8] = "Surprise Planner";
      }
      if (profile.categories[10] == "BirthdayPlanner") {
        profile.categories[10] = "Birthday Planner";
      }
      if (profile.categories[9] == "WeddingPlanner") {
        profile.categories[9] = "Wedding Planner";
      }
      Profile.findOneAndUpdate(
        { _id: profile._id },
        { $set: profile },
        { new: true }
      ).then(profile => console.log("done"));
    });
  });
});

router.get("/convertImportedToProfiles", (req, res) => {
  importedProfiles.find().then(profiles => {
    profiles.map(pro => {
      // console.log(typeof p.toObject())
      let p = pro.toObject();
      let imagesArray = [];
      const objectImages = p.images.split(",").filter(Boolean);
      objectImages.map(image => {
        imagesArray.push({ original: image, thumbnail: image });
      });

      const mob = p.owner;
      let mail;
      p.mail !== 0 ? (mail = p.mail) : (mail = "");
      const name = p.companyName;
      const otp = Math.floor(1000 + Math.random() * 9000);
      // console.log(mob,mail,name,otp)
      const newUser = new User({
        mobile: mob,
        email: mail,
        name: name,
        tempPassword: otp,
        role: "vendor"
      });

      newUser.save().then(user => {
        const newProfile = {};
        newProfile.user = user.id;

        newProfile.companyName = p.companyName;
        newProfile.slug = p.slug;

        newProfile.description = p.description;

        newProfile.budgetBracket = 0;

        newProfile.primaryLocation = p.primaryLocation;

        const cleanLocations = p.locations.split(",").filter(Boolean);
        newProfile.locations = cleanLocations;
        const cleanCategories = p.categories.split(",").filter(Boolean);
        newProfile.categories = cleanCategories;

        newProfile.videos = p.videos.split(",").filter(Boolean);
        let embedUrl = [];
        if (p.videos) {
          p.videos.split(",").map(video => {
            var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            var match = video.match(regExp);
            if (match && match[2].length == 11) {
              embedUrl.push(match[2]);
            }
          });
          newProfile.videoEmbedUrl = embedUrl;
        }

        newProfile.isAuthorized = true;
        newProfile.addToHome = false;

        p.experience ? (newProfile.experience = p.experience) : null;
        p.eventsCovered ? (newProfile.eventsCovered = p.eventsCovered) : null;
        p.cancellationPolicy
          ? (newProfile.cancellationPolicy = p.cancellationPolicy)
          : null;
        p.paymentTerms ? (newProfile.paymentTerms = p.paymentTerms) : null;
        p.artistGenre ? (newProfile.artistGenre = p.artistGenre) : null;
        p.languagesKnown
          ? (newProfile.languagesKnown = p.languagesKnown)
          : null;

        newProfile.avgRating = p.avfRating;

        newProfile.promoCredit = p.promoCredit;

        newProfile.Wallet = p.Wallet;

        newProfile.readCount = 0;

        newProfile.enquiriesRead = [];
        newProfile.enquiriesBought = [];

        newProfile.leadsBought = 0;

        newProfile.paidBy = {};

        newProfile.images = imagesArray;

        newProfile.ratings = [];
        newProfile.wishList = [];
        // console.log(newProfile)
        new Profile(newProfile)
          .save()
          .populate("user")
          .then(profile => res.json(profile));
      });
    });
  });
});

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
          to: profile.user.email,
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

sendSms = (body, enquiry) => {
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
        console.log(profile.user.mobile);
        var number = profile.user.mobile;
        var http = require("http");
        var options = {
          method: "POST",
          hostname: "api.msg91.com",
          port: null,
          path: "/api/v2/sendsms",
          headers: {
            authkey: "185228AUF57pUKt5n5a17fb80",
            "content-type": "application/json"
          }
        };

        var req = http.request(options, function(res) {
          var chunks = [];
          res.on("data", function(chunk) {
            chunks.push(chunk);
          });
          res.on("end", function() {
            var body = Buffer.concat(chunks);
          });
        });
        req.write(
          JSON.stringify({
            sender: "CBRTON",
            route: "4",
            country: "91",
            sms: [
              {
                message: body,
                to: [number]
              }
            ]
          })
        );
        req.end();
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
    let savedUser;
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
          User.findOneAndUpdate(
            { _id: user.id },
            { $set: userObject },
            { new: true }
          )
            .then(user => {
              //Create Enquiry
              if (req.body.mode === "create") {
                const newEnquiry = new Enquiry({
                  user: user._id,
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
                  noOfGuests: enquiry.noOfGuests,
                  isVerified: enquiry.isVerified,
                  celebratonComment: enquiry.celebratonComment
                });

                newEnquiry.save().then(enq => {
                  if (enquiry.sendNotification) {
                    sendEmail(
                      `CelebratON - New ${category.name} Enquiry from ${
                        enquiry.name
                      }`,
                      `Dear Partner,<br><br>You have got a new enquiry from ${
                        enquiry.name
                      }.<br><br><span style="color:green"><b>This is a Verified Lead</b></span><br><br>Find below the details of this order:<br><br><b>Category: </b>${
                        category.name
                      }<br><b>for: </b>${
                        enquiry.serviceFor
                      }<br><b>Event Date: </b>${moment(
                        enquiry.eventDate
                      ).format(
                        "DD MMM, YYYY"
                      )}<br><b>Requirement: </b>${enquiry.servicesRequired.join(
                        ","
                      )}<br><b>Locality: </b>${enquiry.locality} (in ${
                        enquiry.city
                      })<br><b>Budget: </b>${
                        budgetRange.to === 0
                          ? `Above Rs.${budgetRange.from}`
                          : `Rs.${budgetRange.from} to ${budgetRange.to}`
                      }<br><b>Other Info: </b>${
                        enquiry.otherInfo
                      }<br><b>CelebratON Comments: </b>${
                        enquiry.celebratonComment
                      }<br><b>Lead Amount: </b>Rs.${leadAmount}<br><br>View and grab this lead in the link: <a href="https://www.celebraton.in/dashboard?enquiry=${
                        enq._id
                      }&source=Email">View Enquiry</a><br><b>As per the last Mail, kindly insist the customer to pay the advance and the final payment through CelebratON to get better conversion rates. </b><br><br>Happy celebrating !!!`,
                      enq
                    );
                    // sendSms(
                    //   `There is a new ${category.name} enquiry from ${
                    //     enquiry.name
                    //   }. View and grab this lead in the link: https://www.celebraton.in/dashboard?enquiry=${
                    //     enq._id
                    //   }&source=Sms --CelebratON`,
                    //   enq
                    // );
                  }

                  res.json(enq);
                });
              } else {
                //Update Enquiry
                Enquiry.findOneAndUpdate(
                  { _id: req.body.id },
                  {
                    $set: {
                      user: user._id,
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
                      noOfGuests: enquiry.noOfGuests,
                      isVerified: enquiry.isVerified,
                      celebratonComment: enquiry.celebratonComment
                    }
                  },
                  { new: true }
                ).then(enq => {
                  if (enquiry.sendNotification) {
                    sendEmail(
                      `CelebratON - New ${category.name} Enquiry from ${
                        enquiry.name
                      }`,
                      `Dear Partner,<br><br>You have got a new enquiry from ${
                        enquiry.name
                      }.<br><br><span style="color:green"><b>This is a Verified Lead</b></span><br><br>Find below the details of this order:<br><br><b>Category: </b>${
                        category.name
                      }<br><b>for: </b>${
                        enquiry.serviceFor
                      }<br><b>Event Date: </b>${moment(
                        enquiry.eventDate
                      ).format(
                        "DD MMM, YYYY"
                      )}<br><b>Requirement: </b>${enquiry.servicesRequired.join(
                        ","
                      )}<br><b>Locality: </b>${enquiry.locality} (in ${
                        enquiry.city
                      })<br><b>Budget: </b>${
                        budgetRange.to === 0
                          ? `Above Rs.${budgetRange.from}`
                          : `Rs.${budgetRange.from} to ${budgetRange.to}`
                      }<br><b>Other Info: </b>${
                        enquiry.otherInfo
                      }<br><b>CelebratON Comments: </b>${
                        enquiry.celebratonComment
                      }<br><b>Lead Amount: </b>Rs.${leadAmount}<br><br>View and grab this lead in the link: <a href="https://www.celebraton.in/dashboard?enquiry=${
                        enq._id
                      }&source=Email">View Enquiry</a><br><b>As per the last Mail, kindly insist the customer to pay the advance and the final payment through CelebratON to get better conversion rates. </b><br><br>Happy celebrating !!!`,
                      enq
                    );
                    // sendSms(
                    //   `There is a new ${category.name} enquiry from ${
                    //     enquiry.name
                    //   }. View and grab this lead in the link: https://www.celebraton.in/dashboard?enquiry=${
                    //     enq._id
                    //   }&source=Sms --CelebratON`,
                    //   enq
                    // );
                  }

                  res.json(enq);
                });
              }
            })
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

          newUser.save().then(user => {
            //Create Enquiry
            if (req.body.mode === "create") {
              const newEnquiry = new Enquiry({
                user: user._id,
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
                noOfGuests: enquiry.noOfGuests,
                isVerified: enquiry.isVerified,
                celebratonComment: enquiry.celebratonComment
              });

              newEnquiry.save().then(enq => {
                if (enquiry.sendNotification) {
                  sendEmail(
                    `CelebratON - New ${category.name} Enquiry from ${
                      enquiry.name
                    }`,
                    `Dear Partner,<br><br>You have got a new enquiry from ${
                      enquiry.name
                    }.<br><br><span style="color:green"><b>This is a Verified Lead</b></span><br><br>Find below the details of this order:<br><br><b>Category: </b>${
                      category.name
                    }<br><b>for: </b>${
                      enquiry.serviceFor
                    }<br><b>Event Date: </b>${moment(enquiry.eventDate).format(
                      "DD MMM, YYYY"
                    )}<br><b>Requirement: </b>${enquiry.servicesRequired.join(
                      ","
                    )}<br><b>Locality: </b>${enquiry.locality} (in ${
                      enquiry.city
                    })<br><b>Budget: </b>${
                      budgetRange.to === 0
                        ? `Above Rs.${budgetRange.from}`
                        : `Rs.${budgetRange.from} to ${budgetRange.to}`
                    }<br><b>Other Info: </b>${
                      enquiry.otherInfo
                    }<br><b>CelebratON Comments: </b>${
                      enquiry.celebratonComment
                    }<br><b>Lead Amount: </b>Rs.${leadAmount}<br><br>View and grab this lead in the link: <a href="https://www.celebraton.in/dashboard?enquiry=${
                      enq._id
                    }&source=Email">View Enquiry</a><br><b>As per the last Mail, kindly insist the customer to pay the advance and the final payment through CelebratON to get better conversion rates. </b><br><br>Happy celebrating !!!`,
                    enq
                  );
                  // sendSms(
                  //   `There is a new ${category.name} enquiry from ${
                  //     enquiry.name
                  //   }. View and grab this lead in the link: https://www.celebraton.in/dashboard?enquiry=${
                  //     enq._id
                  //   }&source=Sms --CelebratON`,
                  //   enq
                  // );
                }

                res.json(enq);
              });
            } else {
              //Update Enquiry
              Enquiry.findOneAndUpdate(
                { _id: req.body.id },
                {
                  $set: {
                    user: user._id,
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
                    noOfGuests: enquiry.noOfGuests,
                    isVerified: enquiry.isVerified,
                    celebratonComment: enquiry.celebratonComment
                  }
                },
                { new: true }
              ).then(enq => {
                if (enquiry.sendNotification) {
                  sendEmail(
                    `CelebratON - New ${category.name} Enquiry from ${
                      enquiry.name
                    }`,
                    `Dear Partner,<br><br>You have got a new enquiry from ${
                      enquiry.name
                    }.<br><br><span style="color:green"><b>This is a Verified Lead</b></span><br><br>Find below the details of this order:<br><br><b>Category: </b>${
                      category.name
                    }<br><b>for: </b>${
                      enquiry.serviceFor
                    }<br><b>Event Date: </b>${moment(enquiry.eventDate).format(
                      "DD MMM, YYYY"
                    )}<br><b>Requirement: </b>${enquiry.servicesRequired.join(
                      ","
                    )}<br><b>Locality: </b>${enquiry.locality} (in ${
                      enquiry.city
                    })<br><b>Budget: </b>${
                      budgetRange.to === 0
                        ? `Above Rs.${budgetRange.from}`
                        : `Rs.${budgetRange.from} to ${budgetRange.to}`
                    }<br><b>Other Info: </b>${
                      enquiry.otherInfo
                    }<br><b>CelebratON Comments: </b>${
                      enquiry.celebratonComment
                    }<br><b>Lead Amount: </b>Rs.${leadAmount}<br><br>View and grab this lead in the link: <a href="https://www.celebraton.in/dashboard?enquiry=${
                      enq._id
                    }&source=Email">View Enquiry</a><br><b>As per the last Mail, kindly insist the customer to pay the advance and the final payment through CelebratON to get better conversion rates. </b><br><br>Happy celebrating !!!`,
                    enq
                  );
                  // sendSms(
                  //   `There is a new ${category.name} enquiry from ${
                  //     enquiry.name
                  //   }. View and grab this lead in the link: https://www.celebraton.in/dashboard?enquiry=${
                  //     enq._id
                  //   }&source=Sms --CelebratON`,
                  //   enq
                  // );
                }

                res.json(enq);
              });
            }
          });
        }
      })

      .catch(err => console.log(err));
  }
);

router.post(
  "/adminManageProfile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const profile = req.body.values;
    const mode = req.body.mode;

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
          User.findOneAndUpdate(
            { _id: user.id },
            { $set: userObject },
            { new: true }
          )
            .then(user => {
              const newProfile = {};
              if (user.id) newProfile.user = user.id;
              if (profile.companyName)
                newProfile.slug = profile.companyName
                  .toLowerCase()
                  .replace(/[^\w ]+/g, "")
                  .replace(/ +/g, "-");
              if (profile.companyName)
                newProfile.companyName = profile.companyName;

              if (profile.description)
                newProfile.description = profile.description;
              if (profile.budgetBracket)
                newProfile.budgetBracket = profile.budgetBracket;
              if (profile.primaryLocation)
                newProfile.primaryLocation = profile.primaryLocation;

              if (profile.locations) newProfile.locations = profile.locations;
              if (profile.categories)
                newProfile.categories = profile.categories;
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

              newProfile.isAuthorized = profile.isAuthorized;
              newProfile.addToHome = profile.addToHome;
              if (profile.artistOrder)
                newProfile.artistOrder = profile.artistOrder;
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
              newProfile.openToTravel = profile.openToTravel;
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
              profile.managedBy
                ? (newProfile.managedBy = profile.managedBy)
                : null;
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
                profile.wishList
                  ? (newProfile.wishList = profile.wishList)
                  : [];
                new Profile(newProfile)
                  .save()
                  .then(profile => res.json(profile));
              }
            })
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

          newUser.save().then(user => {
            const newProfile = {};
            if (user.id) newProfile.user = user.id;
            if (profile.companyName)
              newProfile.slug = profile.companyName
                .toLowerCase()
                .replace(/[^\w ]+/g, "")
                .replace(/ +/g, "-");
            if (profile.companyName)
              newProfile.companyName = profile.companyName;

            if (profile.description)
              newProfile.description = profile.description;
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

            newProfile.isAuthorized = profile.isAuthorized;
            newProfile.addToHome = profile.addToHome;
            if (profile.artistOrder)
              newProfile.artistOrder = profile.artistOrder;
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
            newProfile.openToTravel = profile.openToTravel;
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
            profile.managedBy
              ? (newProfile.managedBy = profile.managedBy)
              : null;
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
          });
        }
      })

      .catch(err => console.log(err));
  }
);

module.exports = router;
