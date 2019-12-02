'use strict'

const test = require('ava')
const greenpay = require('../src/index')

const options = {
  secret: 'SECRET-XXXXX',
  merchant: 'MERCHANT-XXXXX',
  terminal: 'TERMINAL-XXXXX',
  publicKey: `MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgGxr+2pRdVQroW+0bE3TSPJTFiUZ
    23jj9xxnHU2UZi73fQ6tC5SW+Gmu6RQY5ptbBiGQrCnlAz33A7e8JoyAGB+8TEYI
    sEG/wUtbjAhQwx4MJBwuGJ4e7G5jnQ8xUIsLXp7bJuJ7tvyueM8tpUJakIUmvtDO
    JVsRJGJy65XUHTlvAgMBAAE=`
}

test('should expose a function', t => {
  t.is(typeof greenpay, 'function')
})

test('throws error if no option is passed', t => {
  const error = t.throws(() => greenpay())

  t.true(error.message.startsWith('Secret is missing'))
})

test('throws error if no secret is passed', t => {
  const { secret, ...config } = options
  const error = t.throws(() => greenpay(config))

  t.true(error.message.startsWith('Secret is missing'))
})

test('throws error if no merchant is passed', t => {
  const { merchant, ...config } = options
  const error = t.throws(() => greenpay(config))

  t.true(error.message.startsWith('Merchant is missing'))
})

test('throws error if no terminal is passed', t => {
  const { terminal, ...config } = options
  const error = t.throws(() => greenpay(config))

  t.true(error.message.startsWith('Terminal is missing'))
})

test('throws error if no public key is passed', t => {
  const { publicKey, ...config } = options
  const error = t.throws(() => greenpay(config))

  t.true(error.message.startsWith('Public key is missing'))
})

test('throws error if an invalid public key is passed', t => {
  const { publicKey, ...config } = options
  const error = t.throws(() => greenpay({ ...config, publicKey: 'abc123' }))

  t.true(error.message.startsWith('Invalid public key'))
})

test('returns all api endpoints', t => {
  const api = greenpay({ ...options })

  t.is(typeof api.cards, 'object')
  t.is(typeof api.payments, 'object')
  t.is(typeof api.subscriptions, 'object')
})

test('returns all cards endpoints', t => {
  const api = greenpay({ ...options })

  t.is(typeof api.cards.tokenize, 'function')
  t.is(typeof api.cards.delete, 'function')
})

test('returns all subscriptions endpoints', t => {
  const api = greenpay({ ...options })

  t.is(typeof api.subscriptions.create, 'function')
  t.is(typeof api.subscriptions.fetch, 'function')
  t.is(typeof api.subscriptions.cancel, 'function')
  t.is(typeof api.subscriptions.update, 'function')
})

test('returns all payments endpoints', t => {
  const api = greenpay({ ...options })

  t.is(typeof api.payments.create, 'function')
  t.is(typeof api.payments.fetch, 'function')
})
