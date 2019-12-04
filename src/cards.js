'use strict'

const { Counter, utils, ModeOfOperation } = require('aes-js')
const debug = require('debug')('greenpay:cards')
const RSA = require('node-jsencrypt')
const axios = require('axios')
const KJUR = require('jsrsasign')
const nanoId = require('nanoid')

module.exports = ({ merchantUrl, checkoutUrl, publicKey, merchant, secret } = {}) => {
  const rsa = new RSA()

  try {
    rsa.setPublicKey(publicKey)
  } catch (_) {
    throw new Error('Invalid public key provided')
  }

  /**
   * Generate a random rumber.
   *
   * @return {Number}
   * @private
   */

  const random = () => {
    return Math.floor(Math.random() * 255)
  }

  /**
   * Creates a AES key pairs.
   *
   * @return {Object}
   * @private
   */

  const getPairs = () => {
    return { k: [...new Array(16)].map(random), s: random() }
  }

  /**
   * Normalize tokenized data.
   *
   * @param {Object} data
   * @return {Object}
   * @private
   */

  const normalize = data => {
    const [year, month] = data.expiration_date.match(/.{1,2}/g)
    return {
      token: data.result.token,
      last4: data.result.last_digits,
      bin: data.result.bin,
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      name: data.cardHolder,
      nick: data.nickname,
      brand: data.brand
    }
  }

  /**
   * Creates an JSON object with the card data and AES key Pair encrypted.
   *
   * @param {Object} data
   * @param {Object} session
   * @param {Object} [pair]
   * @return {Object}
   * @private
   */

  const pack = (data, session, pair) => {
    pair = pair || getPairs()
    const textBytes = utils.utf8.toBytes(JSON.stringify(data))
    const aesCtr = new ModeOfOperation.ctr(pair.k, new Counter(pair.s))
    const encryptedBytes = aesCtr.encrypt(textBytes)
    const encryptedHex = utils.hex.fromBytes(encryptedBytes)
    return { session, ld: encryptedHex, lk: rsa.encrypt(JSON.stringify(pair)) }
  }

  /**
   * Tokenize the order creates in Greenpay gateway.
   *
   * @param {Object} data
   * @param {String} token
   * @return {Promise}
   * @private
   */

  const tokenizeOrder = async (data, token, isUpdate) => {
    const config = { headers: { 'liszt-token': token } }
    const url = checkoutUrl + '/tokenize' + isUpdate ? '/update' : ''
    debug('tokenize order %s %o %o', url, data, config)
    const { data: res, status } = await axios.post(url, data, config)
    debug('tokenized card status %s %o', status, res)
    if (status === 200) return res
    throw new Error('Invalid request')
  }

  /**
   * Creates a payment order in Greenpay Gateway.
   *
   * @param {Object} data
   * @return {Promise}
   * @private
   */

  const createOrder = async (data, isUpdate) => {
    const url = merchantUrl + '/tokenize' + isUpdate ? '/update' : ''
    debug('create order %s %o', url, data)
    const { data: res, status } = await axios.post(url, data)
    if (status !== 200) throw new Error('Invalid request')
    return res
  }

  /**
   * Pack and tokenize order
   *
   * @param {Object} card
   * @param {Object} creds
   * @return {Promise}
   * @private
   */

  const sign = async (card, { token, session } = {}) => {
    rsa.setPublicKey(publicKey)
    const data = pack(card, session)
    return tokenizeOrder(data, token, Boolean(card.token))
  }

  /**
   * Verify if request is valid.
   *
   * @param {String} signed
   * @param {Object} data
   * @return {Boolean}
   * @private
   */

  const verify = (signed, data = {}) => {
    const parts = Object.keys(data).map(key => `${key}:${data[key]}`)
    const signature = new KJUR.crypto.Signature({ alg: 'SHA256withRSA' })
    signature.init(`-----BEGIN PUBLIC KEY-----${publicKey}-----END PUBLIC KEY-----`)
    signature.updateString(parts.join(','))
    return signature.verify(signed)
  }

  /**
   * Tokenize card.
   *
   * @param {Object} data
   * @param {Object} [options]
   * @return {Object}
   * @private
   */

  const tokenize = async ({ token, ...data }, { requestId = nanoId() } = {}) => {
    const card = {
      cvc: data.cvc,
      nickname: data.nick,
      cardHolder: data.name,
      cardNumber: data.number,
      expirationDate: { month: data.month, year: data.year }
    }

    const security = await createOrder({ secret, merchantId: merchant, requestId }, Boolean(token))
    debug('card order created')
    const { status, ...res } = await sign({ card, token }, security)
    debug('verify signed card %o', { status, requestId, ...res })
    const isSecure = verify(res._signature, { status, requestId })

    if (isSecure) {
      const result = normalize(res)
      debug('tokenized card %o', result)
      return { ...result, requestId }
    }

    debug('request response was not secure')
    throw new Error('Request not secure')
  }

  /**
   * Create a tokenized card.
   *
   * @param {Object} data
   * @param {Object} [options]
   * @return {Object}
   * @public
   */

  const create = async (data, options) => {
    return tokenize(data, options)
  }

  /**
   * Update a tokenized card.
   *
   * @param {String} token
   * @param {Object} data
   * @param {Object} [options]
   * @return {Object}
   * @public
   */

  const update = async (token, data, options) => {
    return tokenize({ ...data, token }, options)
  }

  /**
   * Delete a card token.
   *
   * @param {String} token
   * @param {Object} [options]
   * @return {Promise}
   * @public
   */

  const destroy = async (token, { requestId = nanoId() } = {}) => {
    const url = merchantUrl + '/deleteToken'
    debug('delete token %s %s', url, token)
    const { status } = await axios.post(url, { token, secret, requestId, merchantId: merchant })
    if (status !== 200) throw new Error('Invalid request')
    return { token, requestId }
  }

  return { create, update, delete: destroy }
}
