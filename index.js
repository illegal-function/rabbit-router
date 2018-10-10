const amqp = require('amqplib')

const { RABBITMQ_URI, RABBITMQ_SERVICE, RABBITMQ_EXCHANGE } = process.env

const connection = () => {
  if (connection._instance)
    return Promise.resolve(connection._instance)

  return amqp.connect(RABBITMQ_URI)
    .then(conn => (connection._instance = conn))
}

const channel = () => {
  if (channel._instance)
    return Promise.resolve(channel._instance)

  return connection()
    .then(conn => conn.createConfirmChannel())
    .then(chan => (channel._instance = chan))
    .then(chan => {
      chan.assertExchange(RABBITMQ_EXCHANGE, 'direct')
      return chan
    })
}

const queue = () => {
  if (queue._instance)
    return Promise.resolve(queue._instance)

  return channel()
    .then(channel => channel.assertQueue(RABBITMQ_SERVICE, { autoDelete: true }))
    .then(queue => (queue._instance = queue.queue))
}

const register = (event, callback) => {
  register._events = { [event]: callback }
  return channel()
    .then(channel => {
      return queue()
        .then(queue => {
          return channel.bindQueue(queue, RABBITMQ_EXCHANGE, event)
        })
    })
}

const consume = () => {
  return channel()
    .then(chan => {
      return queue()
        .then(queue => {
          return chan.consume(queue, msg => {
            const { routingKey } = msg.fields
            if (register._events && register._events[routingKey]) {
              Promise.resolve(register._events[routingKey](JSON.parse(msg.content.toString())))
                .then(_ => chan.ack(msg))
                .catch(err => {
                  console.log(err)
                  chan.nack(msg, false, true)
                })
            }
          }, { noAck: false })
        })
    })
}

const publish = (event, value) => {
  return channel()
    .then(chan => chan.publish(RABBITMQ_EXCHANGE, event, Buffer.from(JSON.stringify(value))))
}

Object.defineProperties(register, {
  connection: { value: connection },
  channel: { value: channel },
  consume: { value: consume },
  publish: { value: publish },
  close: { value: () => {
    return connection._instance.close().then(_ => {
      connection._instance = channel._instance = queue._instance = null
      return true
    })
  } },
})

module.exports = register
