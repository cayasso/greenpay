'use strict'

const rc = require('rc')

module.exports = rc('greenpay', {
  secret: process.env.GREENPAY_SECRET,
  merchant: process.env.GREENPAY_MERCHANT,
  terminal: process.env.GREENPAY_TERMINAL,
  merchantUrl: process.env.GREENPAY_MERCHANT_URL || 'https://sandbox-merchant.greenpay.me',
  checkoutUrl: process.env.GREENPAY_CHECKOUT_URL || 'https://sandbox-checkout.greenpay.me',
  publicKey: process.env.GREENPAY_PUBLIC_KEY,
  cadence: {
    mode: process.env.GREENPAY_CADENCE_MODE || 'EVERY',
    unit: process.env.GREENPAY_CADENCE_UNIT || 'MONTH',
    every: process.env.GREENPAY_CADENCE_EVERY || 1
  },
  currency: process.env.GREENPAY_CURRENCY || 'USD'
})
