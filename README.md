# greenpay

[![Build Status](https://travis-ci.org/cayasso/greenpay.png?branch=master)](https://travis-ci.org/cayasso/greenpay)
[![NPM version](https://badge.fury.io/js/greenpay.png)](http://badge.fury.io/js/greenpay)

Simple [GreenPay](https://greenpay.me/) API Client for NodeJS.

## Installation

```bash
$ npm install greenpay
```

## Usage

```js
const greenpay = require('greenpay')

const gpApi = greenpay({
  secret: 'GREENPAY_SECRET',
  merchant: 'GREENPAY_MERCHANT'
  terminal: 'GREENPAY_TERMINAL',
  publicKey: 'GREENPAY_PUBLIC_KEY'
})
```

```js
gpApi.cards
  .tokenize({
    nick: 'Hulk',
    name: 'Bruce Banner',
    number: 4242424242424242,
    cvc: 123,
    month: 12,
    year: 25
  })
  .then(plan => {
    console.log(plan)
  })
  .catch(error => {
    console.log('error', error.response)
  })

// or with async/await

const plan = await gpApi.cards.tokenize({
  nick: 'Hulk',
  name: 'Bruce Banner',
  number: 4242424242424242,
  cvc: 123,
  month: 12,
  year: 25
})
```

## API

You will need your [GreenPay](https://greenpay.me/) `secret`, `merchant`, `terminal` and `publicKey` in order to use this library.

### greenpay(options)

Create a new instance of `greenpay` api by passing the required `secret`, `merchant`, `terminal` and `publicKey` properties.

```js
const api = greenpay({
    secret: '<GREENPAY_SECRET>',
    merchant: '<GREENPAY_MERCHANT>',
    terminal: '<GREENPAY_TERMINAL'>,
    publicKey: '<GREENPAY_PUBLIC_KEY>'
})
```

You can also set the `GREENPAY_SECRET`, `GREENPAY_MERCHANT`, `GREENPAY_TERMINAL` and `GREENPAY_PUBLIC_KEY` environment variables instead of passing properties directly.

For example, lets say somewhere in your app you have:

```js
const api = greenpay()
```

You can startup your node application like this:

```bash
GREENPAY_SECRET=abc123 GREENPAY_MERCHANT=my-merchant GREENPAY_TERMINAL=my-termianl GREENPAY_PUBLIC_KEY=my-public-key node app.js
```

### api.cards.tokenize(data)

Tokenize a new card.

```js
const card = await api.cards.tokenize({
  nick: 'Hulk',
  name: 'Bruce Banner',
  number: 4242424242424242,
  cvc: 123,
  month: 12,
  year: 25
})

console.log(card)

/*
{
  token: '1deebcac-ea11-1111-1111-11a1b1d11111',
  last4: '4242',
  bin: '111111',
  year: 25,
  month: 12,
  name: 'Bruce Banner',
  nick: 'Hulk',
  brand: 'Visa'
}
*/
```

### api.subscriptions.create(data)

Create a new subscription.

```js
const subscription = await api.subscriptions.create({
  amount: 100,
  userId: 'abc123',
  description: 'Premium',
  token: '1deebcac-ea11-1111-1111-11a1b1d11111'
})

console.log(subscription)

/*
{
  id: '7e69644f38388679f77404e29ad11111',
  dueDate: '2019-12-28T00:00:00.000Z',
  status: 'ACTIVE',
  tokens: ['1deebcac-ea11-1111-1111-11a1b1d11111'],
  payment: {
    orderId: '7e69644f38388679f77404e29ad11111_0',
    authorization: '511791',
    currency: 'USD',
    amount: 100,
    errors: []
  }
}
*/
```

### api.subscriptions.fetch([options])

Fetch the list of subscriptions. You can also pass `page` and `limit` for pagination.

```js
const subscriptions = await api.subscriptions.fetch()

// Or with options

const subscriptions = await api.subscriptions.fetch({ limit: 10, page: 1 })

console.log(subscriptions)

/*
[
  {
    id: '7e69644f38388679f77404e29ad11111',
    status: 'ACTIVE',
    userId: 'u1',
    description: 'Micro',
    currency: 'USD',
    amount: 100,
    startDate: 1574974274192,
    endDate: null,
    cadence: 'EVERY 1 MONTH',
    dueDate: '2019-12-28T00:00:00.000Z'
  },
  {
    id: '7e69644f38388679f77404e29ad11112',
    status: 'ACTIVE',
    userId: 'u1',
    description: 'Plus',
    currency: 'USD',
    amount: 200,
    startDate: 1574961298488,
    endDate: null,
    cadence: 'EVERY 1 MONTH',
    dueDate: '2019-12-28T00:00:00.000Z'
  },
  {
    id: '7e69644f38388679f77404e29ad11113',
    status: 'CANCELLED',
    userId: 'u1',
    description: 'Premium',
    currency: 'USD',
    amount: 2000,
    startDate: 1574961174788,
    endDate: null,
    cadence: 'EVERY 1 MONTH',
    dueDate: '2019-12-28T00:00:00.000Z'
  }
  ...
]
*/
```

### api.subscriptions.update(data)

Update a subscription amount or card token.

```js
// Update just the amount
const subscription = await api.subscriptions.create({
  id: '7e69644f38388679f77404e29ad11112',
  amount: 100
})

// Update the card token
const subscription = await api.subscriptions.create({
  id: '7e69644f38388679f77404e29ad11112',
  token: '1deebcac-ea11-1111-1111-11a1b1d11111'
})

// Update both at the same time
const subscription = await api.subscriptions.create({
  id: '7e69644f38388679f77404e29ad11112',
  token: '1deebcac-ea11-1111-1111-11a1b1d11111',
  amount: 100
})

console.log(subscription)

/*
{
  id: '7e69644f38388679f77404e29ad11111',
  dueDate: '2019-12-28T00:00:00.000Z',
  status: 'ACTIVE',
  tokens: ['1deebcac-ea11-1111-1111-11a1b1d11111'],
  payment: {
    orderId: '7e69644f38388679f77404e29ad11111_0',
    authorization: '511791',
    currency: 'USD',
    amount: 100,
    errors: []
  }
}
*/
```

### api.subscriptions.cancel(data)

Cancel a subscription.

```js
const res = await api.subscriptions.cancel({
  id: '7e69644f38388679f77404e29ad11111',
  userId: 'abc123',
  reason: 'Some good reason'
})

console.log(res)

/*
{
  id: '7e69644f38388679f77404e29ad11111',
  status: 'CANCELLED'
}
*/
```

### api.payments.create(subscriptionId)

Create a new payment for a subscription.

```js
const payment = await api.payments.create('7e69644f38388679f77404e29ad11111')

console.log(payment)

/*
{
  status: 'approved',
  orderStatus: 'ACTIVE',
  reference: '9541b344c3d45d421acd454d61251cde_2',
  subscriptionId: '9541b344c3d45d421acd454d61251cde',
  user: 'UserBot',
  amount: 100,
  currency: 'USD',
  date: '2018-12-11T06:00:00.000Z',
  authorization: '533735',
  details: '',
  errors: [],
  reason: 'Manual payment'
}
*/
```

### api.payments.fetch(subscriptionId, [options])

Fetch subscription payments. You can also pass `limit` and `page` as options in the second argument.

```js
const payments = await api.payments.fetch('7e69644f38388679f77404e29ad11111')

// Or

const payments = await api.payments.fetch('7e69644f38388679f77404e29ad11111', {
  limit: 10,
  page: 1
})

console.log(payments)

/*
[
  {
    id: '7',
    reference: 'f88ae81b0d469f67d081b7f239c96305_1',
    date: '2018-12-27T22:22:32.868Z',
    retries: [
      {
        attempDate: '2018-12-27T22:32:32.837Z',
        status: 500,
        orderId: 'f88ae81b0d469f67d081b7f239c96305_1',
        authorization: null,
        amount: 100,
        currency: 'CRC',
        errors: ['Error: Invalid card token']
      }
    ]
  },
  ...
]
*/
```

## Run tests

```bash
$ yarn install
$ yarn test
```

## License

Under The MIT License
