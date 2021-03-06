'use strict';

const express = require('express');
const Models = require('../models');
const {
  calculateOneTime,
  calculateMonthly,
  calculateTotal,
  calculateContributionProfit,
  calculateContributionMargin,
  calculateCapitalROI
} = require('../utils');

const router = express.Router();

// GET all revenues and expenses, and ROI calculations
router.get('/', (req, res, next) => {
  let revenues;
  let expenses;

  Models.Revenue.findAll()
    .then(results => {
      revenues = JSON.stringify(results);
      revenues = JSON.parse(revenues);
      return Models.Expense.findAll();
    })
    .then(results => {
      expenses = JSON.stringify(results);
      expenses = JSON.parse(expenses);
    })
    .then(() => {
      // ROI calculations
      const oneTimeRevenue = calculateOneTime(revenues);
      const oneTimeExpense = calculateOneTime(expenses);
      const monthlyRevenue = calculateMonthly(revenues);
      const monthlyExpense = calculateMonthly(expenses);
      // send timeFrame as default 12
      const totalRevenue = calculateTotal(oneTimeRevenue, monthlyRevenue, 12);
      const totalExpense = calculateTotal(oneTimeExpense, monthlyExpense, 12);
      const monthlyContributionProfit = calculateContributionProfit(monthlyRevenue, monthlyExpense);
      const totalContributionProfit = calculateContributionProfit(totalRevenue, totalExpense);
      const contributionMargin = calculateContributionMargin(totalRevenue, totalContributionProfit);
      const capitalROI = calculateCapitalROI(totalExpense, totalRevenue, oneTimeExpense, oneTimeRevenue, monthlyContributionProfit);

      // Send data obj with revenues, expenses, and ROI calculations
      const data = {
        revenues,
        expenses,
        oneTimeRevenue,
        oneTimeExpense,
        monthlyRevenue,
        monthlyExpense,
        totalRevenue,
        totalExpense,
        monthlyContributionProfit,
        totalContributionProfit,
        contributionMargin,
        capitalROI
      };
      res.send(data);
    })
    .catch(err => {
      next(err);
    });
});

// POST new expense or revenue
router.post('/', (req, res, next) => {
  const {type, name, oneTime, monthly} = req.body;

  // Validate request body, exists and is correct data type
  if (!name || typeof name !== 'string') {
    const err = new Error('There is an ussue with `name` in request body');
    err.status = 400;
    return next(err);
  }

  if (!oneTime && oneTime !== 0 || typeof oneTime !== 'number') {
    const err = new Error('There is an ussue with `oneTime` in request body');
    err.status = 400;
    return next(err);
  }

  if (!monthly && monthly !== 0 || typeof monthly !== 'number') {
    const err = new Error('There is an ussue with `monthly` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = {name, oneTime, monthly};

  // Check for expense or revenue, create new record
  if (type === 'expenses') {
    Models.Expense.create(newItem)
      .then(result => {
        res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
      })
      .catch(err => {
        next(err);
      });
  } else if (type === 'revenue') {
    Models.Revenue.create(newItem)
      .then(result => {
        res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
      })
      .catch(err => {
        next(err);
      });
  }
});

// POST TimeFrame, run calculations with time frame and return new totals, contribution profit and margin, capitalROI
router.post('/timeframe', (req, res, next) => {
  const { timeFrame } = req.body;
  
  // Validate time frame exists and is number
  if (!timeFrame || typeof timeFrame !== 'number') {
    const err = new Error('There is an ussue with `timeFrame` in request body');
    err.status = 400;
    return next(err);
  }

  let revenues;
  let expenses;

  // Get revenues and expenses and run all the calculations with the new timeframe
  Models.Revenue.findAll()
    .then(results => {
      revenues = JSON.stringify(results);
      revenues = JSON.parse(revenues);
      return Models.Expense.findAll();
    })
    .then(results => {
      expenses = JSON.stringify(results);
      expenses = JSON.parse(expenses);
    })
    .then(() => {
      // ROI calculations
      const oneTimeRevenue = calculateOneTime(revenues);
      const oneTimeExpense = calculateOneTime(expenses);
      const monthlyRevenue = calculateMonthly(revenues);
      const monthlyExpense = calculateMonthly(expenses);
      // dynamic timeframe
      const totalRevenue = calculateTotal(oneTimeRevenue, monthlyRevenue, timeFrame);
      const totalExpense = calculateTotal(oneTimeExpense, monthlyExpense, timeFrame);
      const monthlyContributionProfit = calculateContributionProfit(monthlyRevenue, monthlyExpense);
      const totalContributionProfit = calculateContributionProfit(totalRevenue, totalExpense);
      const contributionMargin = calculateContributionMargin(totalRevenue, totalContributionProfit);
      const capitalROI = calculateCapitalROI(totalExpense, totalRevenue, oneTimeExpense, oneTimeRevenue, monthlyContributionProfit);

      // Send data obj with revenues, expenses, and ROI calculations
      const data = {
        revenues,
        expenses,
        oneTimeRevenue,
        oneTimeExpense,
        monthlyRevenue,
        monthlyExpense,
        totalRevenue,
        totalExpense,
        monthlyContributionProfit,
        totalContributionProfit,
        contributionMargin,
        capitalROI
      };
      res.send(data);
    })
    .catch(err => {
      next(err);
    });

});

// DELETE 
router.delete('/:type/:id', (req, res, next) => {
  const { type, id } = req.params;

  // Validate params, exists and data type, id comes from req.params as a string
  if (!id || typeof id !== 'string') {
    const err = new Error('There is an ussue with `id` in request body');
    err.status = 400;
    return next(err);
  }

  if (!type || typeof type !== 'string') {
    const err = new Error('There is an ussue with `type` in request body');
    err.status = 400;
    return next(err);
  }

  // Check type and delete by id
  if (type === 'expenses') {
    Models.Expense.destroy({ where: { id } })
      .then(() => {
        res.sendStatus(204);
      })
      .catch(err => {
        next(err);
      });
  } else if (type === 'revenue') {
    Models.Revenue.destroy({ where: { id } })
      .then(() => {
        res.sendStatus(204);
      })
      .catch(err => {
        next(err);
      });
  } 
});
module.exports = router;