'use strict'

const visaPrefixList = new Array(
  '4539',
  '4556',
  '4916',
  '4532',
  '4929',
  '40240071',
  '4485',
  '4716',
  '4'
)

const mastercardPrefixList = new Array('51', '52', '53', '54', '55')
const amexPrefixList = new Array('34', '37')
const discoverPrefixList = new Array('6011')
const dinersPrefixList = new Array('300', '301', '302', '303', '36', '38')
const enRoutePrefixList = new Array('2014', '2149')
const jcbPrefixList = new Array('35')
const voyagerPrefixList = new Array('8699')

/**
 * Revert a String
 * @param  {String} str
 * @return {String}
 */
const strrev = str => {
  if (!str) return ''
  let revstr = ''
  for (let i = str.length - 1; i >= 0; i--) revstr += str.charAt(i)
  return revstr
}

/**
 * Complete a prefixed number-string
 * @param  {String} prefix  is the start of the CC number as a string, any number of digits
 * @param  {Number} length  is the length of the CC number to generate. Typically 13 or 16
 * @return {String}
 */
const completeNumber = (prefix, length) => {
  let ccnumber = prefix

  // Generate digits

  while (ccnumber.length < length - 1) {
    ccnumber += Math.floor(Math.random() * 10)
  }

  // Reverse number and convert to int

  const reversedCCnumberString = strrev(ccnumber)
  const reversedCCnumber = new Array()

  for (let i = 0; i < reversedCCnumberString.length; i++) {
    reversedCCnumber[i] = parseInt(reversedCCnumberString.charAt(i))
  }

  // Calculate sum

  let sum = 0
  let pos = 0

  while (pos < length - 1) {
    let odd = reversedCCnumber[pos] * 2
    if (odd > 9) {
      odd -= 9
    }

    sum += odd

    if (pos != length - 2) {
      sum += reversedCCnumber[pos + 1]
    }

    pos += 2
  }

  // Calculate check digit

  const checkdigit = ((Math.floor(sum / 10) + 1) * 10 - sum) % 10
  ccnumber += checkdigit

  return ccnumber
}

/**
 * Actually generate a credit card number
 * @param  {[type]} prefixList [description]
 * @param  {[type]} length     [description]
 * @param  {[type]} amount    [description]
 * @return {[type]}            [description]
 */
const generate = (prefixList, length, amount) => {
  const result = new Array()
  for (let i = 0; i < amount; i++) {
    const randomArrayIndex = Math.floor(Math.random() * prefixList.length)
    const ccnumber = prefixList[randomArrayIndex]
    result.push(completeNumber(ccnumber, length))
  }

  return result
}

/**
 * Supported Card Schemes
 * @type {Array}
 */
const types = {
  Visa: {
    prefixList: visaPrefixList,
    digitCount: 16
  },
  MasterCard: {
    prefixList: mastercardPrefixList,
    digitCount: 16
  },
  Amex: {
    prefixList: amexPrefixList,
    digitCount: 15
  },
  Diners: {
    prefixList: dinersPrefixList,
    digitCount: 16
  },
  Discover: {
    prefixList: discoverPrefixList,
    digitCount: 16
  },
  EnRoute: {
    prefixList: enRoutePrefixList,
    digitCount: 16
  },
  JCB: {
    prefixList: jcbPrefixList,
    digitCount: 16
  },
  Voyager: {
    prefixList: voyagerPrefixList,
    digitCount: 16
  }
}

/**
 * Generate card number.
 *
 * @param {String} [brand]
 * @param {Number} [amount]
 * @return {String}
 */
const getCardNumber = (brand = 'Visa', amount = 1) => {
  return generate(types[brand].prefixList, types[brand].digitCount, amount)
}

/**
 * Create card.
 *
 * @param {Object} options
 * @return {Object}
 */

const createCard = ({ brand = 'Visa', name = 'John Doe', number, cvc = '123' } = {}) => {
  return {
    cvc,
    name: name,
    number: number || getCardNumber(brand)[0],
    month: 9,
    year: 50,
    nick: brand
  }
}

module.exports = {
  createCard,
  getCardNumber
}
