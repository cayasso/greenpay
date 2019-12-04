'use strict'

const crypto = require('crypto')

module.exports = ({ publicKey } = {}) => {
  /**
   * Validate request.
   *
   * @param {Object} data
   * @param {String} signature
   * @return {Boolean}
   * @public
   */

  const validate = async (data, signature) => {
    const hash = crypto
      .createHmac('sha256', publicKey)
      .update(data)
      .digest('hex')

    return signature === hash
  }

  return { validate }
}
