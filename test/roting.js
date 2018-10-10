/* global describe it after */
// const expect = require('expect.js')
const rabbit = require('..')

let cnt = 0

describe('routing', () => {
  it('works!', done => {
    rabbit('test', msg => {
      if (++cnt === 10) done()
    }).then(_ => rabbit.consume())
      .then(_ => rabbit.publish('test', { ok: 1 }))
      .then(_ => rabbit.publish('test', { ok: 2 }))
      .then(_ => rabbit.publish('test', { ok: 3 }))
      .then(_ => rabbit.publish('test', { ok: 4 }))
      .then(_ => rabbit.publish('test', { ok: 5 }))
      .then(_ => rabbit.publish('test', { ok: 6 }))
      .then(_ => rabbit.publish('test', { ok: 7 }))
      .then(_ => rabbit.publish('test', { ok: 8 }))
      .then(_ => rabbit.publish('test', { ok: 9 }))
      .then(_ => rabbit.publish('test', { ok: 10 }))
  })

  after(() => {
    return rabbit.close()
  })
})
