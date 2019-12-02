'use strict'

const axios = require('axios')
const pick = require('lodash.pick')
const debug = require('debug')('greenpay:subscriptions')

module.exports = ({ secret, terminal, merchantUrl, merchant: merchantId, ...config } = {}) => {
  const SUCCESS = 'SUCCESS'
  const CANCELLED = 'CANCELLED'

  /**
   * Normalize subscription data.
   *
   * @param {Object} data
   * @return {Object}
   * @private
   */

  const normalize = data => {
    return {
      id: data.id,
      status: data.status,
      userId: data.user_id,
      description: data.description,
      currency: data.currency,
      amount: parseInt(data.amount, 10),
      cadence: data.cadence,
      dueDate: data.next_payment_date,
      startDate: data.startdate ? parseInt(data.startdate, 10) : null,
      endDate: data.enddate ? parseInt(data.enddate, 10) : null
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
   * Create a subscription.
   *
   * @param {Object} data
   * @return {Promise}
   * @public
   */

  const create = async ({
    userId,
    token,
    amount,
    cadence,
    description,
    currency = config.currency,
    payment,
    initialPayment,
    startDate,
    endDate,
    data = {}
  }) => {
    const body = {
      userId,
      currency,
      description,
      tokens: [token],
      subscription: [
        {
          amount,
          cadence: {
            mode: config.cadence.mode,
            unit: config.cadence.unit,
            every: parseInt(config.cadence.every, 10),
            ...cadence
          }
        }
      ],
      optional: data
    }

    if (payment || initialPayment) {
      body.initialPayment = payment || initialPayment
    }

    if (startDate) {
      body.startDate = startDate
    }

    if (endDate) {
      body.endDate = endDate
    }

    const res = await post('', body)
    const { status, subscriptionId, nextPaymentDate, result } = res.data

    if (status !== 200) {
      throw new Error('Unable to create subscription')
    }

    return {
      payment: result.initialPayment,
      id: subscriptionId,
      dueDate: nextPaymentDate + 'T00:00:00.000Z',
      status: 'ACTIVE',
      tokens: [token]
    }
  }

  /**
   * Cancel a subscription.
   *
   * @param {Object} data
   * @return {Promise}
   * @public
   */

  const cancel = async ({ id, userId, reason } = {}) => {
    const body = {
      reason,
      user: userId,
      subscriptionId: id
    }

    const res = await post('/cancel', body)
    const { status } = res.data

    if (status !== SUCCESS) {
      throw new Error('Unable to cancel subscription')
    }

    return { id, status: CANCELLED }
  }

  /**
   * Update a subscription amount or card.
   *
   * @param {Object} data
   * @return {Promise}
   * @public
   */

  const update = async ({ id, amount, userId, token } = {}) => {
    const body = { user: userId, subscriptionId: id }
    let data = { id }
    let status = SUCCESS

    if (amount) {
      debug('updating subscription %id amount %s', id, token)

      const res = await post('/update', { ...body, amount })
      status = res.data.status
      const { result } = res.data

      data = {
        id: result.subscriptionId,
        userId: result.user_id,
        dueDate: result.next_payment,
        tokens: result.card_tokens,
        status: result.status,
        amount: parseInt(result.amount, 10)
      }

      debug('updated subscription %s amount response %o', id, data)
    }

    if (status !== SUCCESS) {
      throw new Error('Unable to update subscription')
    }

    if (token) {
      debug('updating subscription %s token %s', id, token)

      const res = await post('/update/card_token', { ...body, token })
      status = res.data.status
      const { result } = res.data

      data = {
        ...data,
        id: result.subscriptionId,
        userId: result.user_id,
        dueDate: result.next_payment,
        tokens: result.card_tokens,
        status: result.status
      }

      debug('updated subscription %s token response %o', id, data)
    }

    if (status !== SUCCESS) {
      throw new Error('Unable to update subscription')
    }

    debug('updated subscription response %o', data)

    return data
  }

  /**
   * List subscriptions.
   *
   * @param {Object} [options]
   * @return {Promise}
   * @public
   */

  const fetch = async ({ limit = 100, page = 1, filter } = {}) => {
    const body = { page, pageSize: limit }

    if (filter) {
      const query = {}

      if (filter.user || filter.userId) {
        query.user = filter.user || filter.userId
      }

      if (filter.status) {
        query.status = typeof filter.status === 'string' ? [filter.status] : filter.status
      }

      if (filter.date || filter.subsDate) {
        query.date = filter.date || filter.subsDate
      }

      body.filter = {
        ...pick(filter, ['status', 'user', 'minAmount', 'maxAmount', 'subsDate']),
        ...query
      }
    }

    debug('fetch subscription with %o', body)

    const res = await post('/list', body)
    const { result, status } = res.data

    debug('fetch subscriptions for %s responded with status %s %o', status, result)

    if (status !== SUCCESS) {
      throw new Error('Unable to list subscriptions')
    }

    const subscriptions = result.entries.map(normalize)

    debug('fetched subscriptions %o', subscriptions)

    return subscriptions
  }

  return { fetch, create, cancel, update }
}
