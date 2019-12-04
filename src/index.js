'use strict'

const assert = require('assert')
const subscriptions = require('./subscriptions')
const payments = require('./payments')
const webhooks = require('./webhooks')
const cards = require('./cards')
const config = require('./config')

module.exports = ({ cadence = {}, ...options } = {}) => {
  options = { ...config, ...options }
  options.cadence = { ...options.cadence, ...cadence }

  assert(
    options.secret,
    'Secret is missing. Please pass a `secret` as property or set the `GREENPAY_SECRET` environment variable.'
  )
  assert(
    options.merchant,
    'Merchant is missing. Please pass a `merchant` as property or set the `GREENPAY_MERCHANT` environment variable.'
  )
  assert(
    options.terminal,
    'Terminal is missing. Please pass a `terminal` as property or set the `GREENPAY_TERMINAL` environment variable.'
  )
  assert(
    options.publicKey,
    'Public key is missing. Please pass a `publicKey` as property or set the `GREENPAY_PUBLIC_KEY` environment variable.'
  )

  return {
    subscriptions: subscriptions(options),
    payments: payments(options),
    webhooks: webhooks(options),
    cards: cards(options)
  }
}
