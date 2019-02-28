const express = require("express");

const router = express.Router();

//Load Input Validation
// const validateRegisterInput = require("../../validation/register");

//Load User Model
const Category = require("../../models/Category");

router.post("/addCategory", (req, res) => {
  const errors = {};
  const categoryFields = {};
  if (req.body.name) categoryFields.name = req.body.name;
  if (req.body.slug) categoryFields.slug = req.body.slug;
  if (req.body.icon) categoryFields.icon = req.body.icon;
  if (typeof req.body.eventType !== "undefined")
    categoryFields.eventType = req.body.eventType.split(",");
  if (typeof req.body.servicesRequired !== "undefined")
    categoryFields.servicesRequired = req.body.servicesRequired.split(",");
  if (req.body.order) categoryFields.order = req.body.order;

  new Category(categoryFields)
    .save()
    .then(category => res.json(category))
    .catch(err => console.log(err));
});

router.post("/updateCategory/:categoryId", (req, res) => {
  const errors = {};
  const categoryFields = {};
  if (req.body.name) categoryFields.name = req.body.name;
  if (req.body.slug) categoryFields.slug = req.body.slug;
  if (req.body.icon) categoryFields.icon = req.body.icon;
  if (req.body.eventType)
    categoryFields.eventType = req.body.eventType.split(",");
  if (req.body.color) categoryFields.color = req.body.color;
  if (typeof req.body.servicesRequired !== "undefined")
    categoryFields.servicesRequired = req.body.servicesRequired.split(",");
  if (req.body.order) categoryFields.order = req.body.order;
  console.log("category");
  Category.findOne({ _id: req.params.categoryId })
    .then(category => {
      if (category) {
        Category.findOneAndUpdate(
          { _id: req.params.categoryId },
          { $set: categoryFields },
          { new: true }
        )
          .then(category => res.json(category))
          .catch(err => console.log(err));
      }
    })
    .catch(err => console.log(err));
});

router.get("/allCategories/:limit/:skip", (req, res) => {
  let limit, skip;
  if (Number(req.params.limit) > 10) {
    limit = null;
    skip = req.params.skip;
    // let skip={skip:6}
  } else {
    limit = 10;
    skip = req.params.skip;
  }
  Category.find()
    .sort({ order: 1 })
    .limit(limit)
    .skip(Number(skip))
    .then(categories => res.status(200).json(categories));
});

router.get("/categoryBySlug/:categorySlug", (req, res) => {
  Category.findOne({
    slug: req.params.categorySlug
  }).then(category => {
    res.status(200).json(category);
  });
});

router.post("/addBudget/:categoryId", (req, res) => {
  const budget = req.body.budget.split(",");
  const budgetFields = {};
  if (budget[0]) budgetFields.option = Number(budget[0]);
  if (budget[1]) budgetFields.from = Number(budget[1]);
  if (budget[2]) budgetFields.to = Number(budget[2]);
  if (budget[3]) budgetFields.leadPrice = Number(budget[3]);

  Category.findOne({ _id: req.params.categoryId })
    .then(category => {
      category.budget.push(budgetFields);
      category
        .save()
        .then(category => res.json(category))
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
});

router.post("/updateBudget/:categoryId/:budgetId", (req, res) => {
  const errors = {};
  const budget = req.body.budget.split(",");
  const budgetFields = {};
  if (budget[0]) budgetFields.option = Number(budget[0]);
  if (budget[1]) budgetFields.from = Number(budget[1]);
  if (budget[2]) budgetFields.to = Number(budget[2]);
  if (budget[3]) budgetFields.leadPrice = Number(budget[3]);
  // console.log(budgetFields, req.params.categoryId, req.params.budgetId);

  Category.findOne({ _id: req.params.categoryId })
    .then(category => {
      const updateIndex = category.budget.findIndex(x =>
        x._id.equals(req.params.budgetId)
      );
      console.log(updateIndex);
      category.budget[updateIndex] = budgetFields;

      category
        .save()
        .then(category => res.json(category))
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
});

router.post("/deleteBudget/:categoryId/:budgetId", (req, res) => {
  const errors = {};
  const budget = req.body.budget.split(",");
  const budgetFields = {};
  if (budget[0]) budgetFields.option = Number(budget[0]);
  if (budget[1]) budgetFields.from = Number(budget[1]);
  if (budget[2]) budgetFields.to = Number(budget[2]);
  if (budget[3]) budgetFields.leadPrice = Number(budget[3]);
  // console.log(budgetFields, req.params.categoryId, req.params.budgetId);

  Category.findOne({ _id: req.params.categoryId })
    .then(category => {
      const removeIndex = category.budget.findIndex(x =>
        x._id.equals(req.params.budgetId)
      );

      category.budget.splice(removeIndex, 1);

      category
        .save()
        .then(category => res.json(category))
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
});

module.exports = router;
