// Заполняйте TODO. c — переданная база; функции выполняют реальные запросы MongoDB.
// Служебный lab.js менять не требуется. Контракты и порядок опытов — в Задание.md.
globalThis.installValidator = async c => {
  const int = {bsonType: ['int', 'long'], minimum: 0};
  const validator = {$jsonSchema: {
    bsonType: 'object',
    required: ['_id', 'name', 'category', 'price', 'variants'],
    properties: {
      _id: {bsonType: 'string'},
      name: {bsonType: 'string'},
      category: {bsonType: 'string'},
      price: {bsonType: 'decimal', minimum: 0},
      variants: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['size', 'stock'],
          properties: {size: {bsonType: 'string'}, stock: int}
        }
      }
    }
  }};
  return c.runCommand({collMod: 'products', validator,
    validationLevel: 'strict', validationAction: 'error'});
};

// Возврат: Promise массива полных Product; порядок _id ASC; [] при отсутствии.
globalThis.searchProducts = async (c, {category, size, qty}) => {
  return c.products.find({category, variants: {$elemMatch: {size, stock: {$gte: qty}}}})
    .sort({_id: 1}).toArray();
};

// Технический helper: верните MongoDB cursor с фильтром, сортировкой и limit.
// Один и тот же запрос используется для результата и explain в опыте с индексом.
globalThis.historyCursor = (c, {userId, status}) => {
  return c.orders.find({userId, status}).sort({createdAt: -1, _id: 1}).limit(20);
};
globalThis.history = async (c, input) => historyCursor(c, input).toArray();

// Заполните порядок полей и направления индекса для historyCursor.
globalThis.historyIndex = {userId: 1, status: 1, createdAt: -1, _id: 1};
// Если добавили hint в historyCursor, измените флаг на true.
globalThis.usesHistoryHint = false;

// Возврат: Promise массива {sku, name, qty, revenue}; revenue — Decimal128.
globalThis.report = async (c, from, to) => {
  return c.orders.aggregate([
    {$match: {status: 'paid', createdAt: {$gte: from, $lt: to}}},
    {$unwind: '$items'},
    {$group: {
      _id: '$items.sku',
      qty: {$sum: '$items.qty'},
      revenue: {$sum: {$multiply: ['$items.qty', '$items.price']}}
    }},
    {$sort: {revenue: -1, _id: 1}},
    {$limit: 5},
    {$lookup: {from: 'products', localField: '_id', foreignField: '_id', as: 'product'}},
    {$project: {_id: 0, sku: '$_id', name: {$first: '$product.name'}, qty: '$qty', revenue: '$revenue'}}
  ]).toArray();
};

globalThis.sameRequest = (order, {userId, items}) =>
  order.userId === userId && order.items.length === items.length &&
  order.items.every((x, i) => x.sku === items[i].sku && x.size === items[i].size && x.qty === items[i].qty);

// request: {operationId, userId, items:[{sku,size,qty},{sku,size,qty}]}.
// Входы соответствуют контракту задания. Два SKU различны; порядок items значим.
// Возврат: Promise созданного или ранее сохранённого Order.
// При отказе: throw HWError('ITEM_UNAVAILABLE') или HWError('REQUEST_CONFLICT').
// Сообщение ошибки свободное; сценарий проверяет только error.code.
// transaction(body) предоставлена: body получает c — базу в активной сессии.
// Все операции покупки внутри body выполняйте через этот c.
globalThis.purchase = async (request, trace = () => {}) => {
  const {operationId, userId, items} = request;
  return transaction(async c => {
    const saved = await c.orders.findOne({_id: operationId});
    if (saved) {
      if (!sameRequest(saved, request)) throw HWError('REQUEST_CONFLICT');
      return saved;
    }
    const orderItems = [];
    for (const {sku, size, qty} of items) {
      const r = await c.products.updateOne(
        {_id: sku, variants: {$elemMatch: {size, stock: {$gte: qty}}}},
        {$inc: {'variants.$.stock': -qty}});
      trace({event: 'update_inside_transaction', sku, matched: r.matchedCount, modified: r.modifiedCount});
      if (r.matchedCount === 0) throw HWError('ITEM_UNAVAILABLE');
      const {price} = await c.products.findOne({_id: sku}, {price: 1});
      orderItems.push({sku, size, qty, price});
    }
    const order = {_id: operationId, userId, createdAt: new Date(), status: 'created', items: orderItems};
    await c.orders.insertOne(order);
    return order;
  });
};

// Используйте именно переданный c: он связан с одним MongoDB-клиентом опыта.
// writeProbe: сохранить {_id:id, message} в c.probe с majority и j:true.
// Возврат — результат записи с acknowledged:true. Повтор вызова с тем же id
// должен быть безопасен: оболочка опыта может повторить запись после ошибки связи.
globalThis.writeProbe = async (c, id, message) => {
  return c.probe.replaceOne({_id: id}, {message},
    {upsert: true, writeConcern: {w: 'majority', j: true, wtimeout: 10000}});
};
// Возврат — документ c.probe с указанным _id либо null.
globalThis.readProbe = async (c, id) => {
  return c.probe.findOne({_id: id});
};

