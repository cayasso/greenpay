'use strict'

const axios = require('axios')
const debug = require('debug')('greenpay:payments')

module.exports = ({ secret, terminal, merchantUrl, merchant: merchantId } = {}) => {
  const SUCCESS = 'SUCCESS'

  /**
   * Normalize payment data.
   *
   * @param {String} subscriptionId
   * @param {Object} data
   * @return {Object}
   * @private
   */

  const normalize = (subscriptionId, data) => {
    return {
      id: data.id,
      date: data.payment_date,
      reference: data.reference_number,
      subscriptionId: data.subscriptionId || subscriptionId,
      retries: data.payment_retries.map(normalizeRetries)
    }
  }

  /**
   * Normalize payment retries.
   *
   * @param {Object} data
   * @return {Object}
   * @private
   */

  const normalizeRetries = data => {
    return {
      attemptDate: data.attempt_date,
      status: data.attempt_result.status,
      orderId: data.attempt_result.orderId,
      authorization: data.attempt_result.authorization,
      amount: data.attempt_result.amount,
      currency: data.attempt_result.currency,
      errors: data.attempt_result.errors
    }
  }

  /**
   * Make a post request with credentials.
   *
   * @param {String} path
   * @param {Object} data
   * @return {Promise}
   * @private
   */

  const post = (path, data) => {
    const creds = { secret, terminal, merchantId }
    return axios.post(`${merchantUrl}/subscriptions${path}`, { ...data, ...creds })
  }

  /**
   * Pay a subscription.
   *
   * @param {Object} data
   * @return {Promise}
   * @public
   */

  const create = async subscriptionId => {
    try {
      debug('creating payment for subscription %s', subscriptionId)
      const res = await post('/pay', { subscriptionId })
      const { result, status } = res.data

      debug('create payment for %s responded with status %s %o', subscriptionId, status, result)

      if (status !== SUCCESS) {
        throw new Error('Unable to pay subscription')
      }

      const { order = {} } = result

      return {
        status: result.status,
        orderStatus: result.orderStatus,
        subscriptionId: order.subscriptionId,
        reference: order.order_reference,
        authorization: order.authorization,
        amount: order.amount,
        currency: order.currency,
        user: order.user,
        details: order.details,
        reason: order.reason,
        date: order.date,
        errors: order.errors
      }
    } catch (error) {
      console.log(error)
      debug('create payment error', error)
      throw error
    }
  }

  /**
   * Fetch subscription payments.
   *
   * @param {Object} subscriptionId
   * @param {Object} [options]
   * @return {Promise}
   * @public
   */

  const fetch = async (subscriptionId, { limit = 100, page = 1 } = {}) => {
    const body = { page, subscriptionId, pageSize: limit }

    debug('fetch subscription %s payment with %o', subscriptionId, body)

    const res = await post('/list/payments', body)
    const { result, status } = res.data

    debug('fetch payment for %s responded with status %s %o', subscriptionId, status, result)

    if (status !== SUCCESS) {
      throw new Error('Unable to fetch subscriptions')
    }

    const payments = result.entries.map(item => normalize(subscriptionId, item))

    debug('fetched payments %o', payments)
  }

  return { fetch, create }
}
