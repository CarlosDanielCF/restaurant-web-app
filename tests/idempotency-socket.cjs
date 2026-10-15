const path = require('path'),
  assert = require('node:assert/strict');
const backend = path.resolve(__dirname, '../../restaurant-backend');
process.chdir(backend);
require(path.join(backend, 'node_modules/ts-node')).register({
  project: path.join(backend, 'tsconfig.json')
});
const { fixture } = require(path.join(backend, 'test/fixture.ts'));
const { io } = require(path.join(backend, 'node_modules/socket.io-client'));
(async () => {
  let owned, socket;
  try {
    owned = await fixture('barrier_socket');
    const login = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: owned.username,
        password: owned.password
      })
    }).then((r) => r.json());
    const headers = {
      Authorization: 'Bearer ' + login.token,
      'x-restaurant-id': login.currentRestaurant.id
    };
    const products = await fetch('http://127.0.0.1:5000/api/products', {
      headers
    }).then((r) => r.json());
    const connect = async () => {
      socket = io('http://127.0.0.1:5000', {
        transports: ['websocket'],
        extraHeaders: {
          authentication: login.token,
          restaurantId: login.currentRestaurant.id
        },
        reconnection: false
      });
      await new Promise((resolve, reject) => {
        socket.once('connect', resolve);
        socket.once('connect_error', reject);
      });
    };
    const emit = (event, data) =>
      new Promise((resolve, reject) =>
        socket
          .timeout(5000)
          .emit(event, data, (err, r) =>
            err
              ? reject(err)
              : r.ok
                ? resolve(r.data)
                : reject(Error(JSON.stringify(r)))
          )
      );
    await connect();
    const a = {
      typeOrder: 'TAKE_AWAY',
      people: 1,
      details: [{ productId: products[0].id, quantity: 1, price: 10 }],
      idempotencyKey: crypto.randomUUID()
    };
    const [one, retry] = await Promise.all([
      emit('create-order', a),
      emit('create-order', a)
    ]);
    assert.equal(one.id, retry.id);
    socket.disconnect();
    await connect();
    assert.equal((await emit('create-order', a)).id, one.id);
    const two = await emit('create-order', {
      ...a,
      idempotencyKey: crypto.randomUUID()
    });
    assert.notEqual(two.id, one.id);
    const detail = {
      orderId: one.id,
      productId: products[0].id,
      quantity: 1,
      price: 10,
      typeOrderDetail: 'TAKE_AWAY',
      qtyDelivered: 0,
      expectedVersion: one.version,
      idempotencyKey: crypto.randomUUID()
    };
    const [first, second] = await Promise.all([
      emit('add-order-detail', detail),
      emit('add-order-detail', detail)
    ]);
    assert.equal(first.details.length, 2);
    assert.equal(second.details.length, 2);
    socket.disconnect();
    await connect();
    assert.equal((await emit('add-order-detail', detail)).details.length, 2);
    const saved = await fetch('http://127.0.0.1:5000/api/orders/' + one.id, {
      headers
    }).then((r) => r.json());
    assert.equal(saved.details.length, 2);
    console.log(
      'Socket real: concurrent create-order and add-order-detail deduplicated; lost-result retry/reconnect same IDs; new operation distinct.'
    );
  } finally {
    socket?.disconnect();
    await owned?.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
