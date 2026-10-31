# Домашняя работа 2 — MongoDB

## 2. Данные и запросы

### 2.1. Валидатор `products`

За основу взят пример схемы из лонгрида недели 4, 3.3.

**Корректный документ**

Команда:

```js
db.products.insertOne({_id: 'valid', name: 'Футболка', category: 'clothes', price: NumberDecimal('100.00'), variants: [{size: 'L', stock: NumberInt(0)}, {size: 'M', stock: NumberInt(10)}]})
```

Вывод:

```js
{ acknowledged: true, insertedId: 'valid' }
```

**Строковая цена**

Команда:

```js
db.products.insertOne({_id: 'string-price', name: 'Футболка', category: 'clothes', price: '100.00', variants: [{size: 'L', stock: NumberInt(0)}, {size: 'M', stock: NumberInt(10)}]})
```

Вывод:

```js
Uncaught:
MongoServerError: Document failed validation
Additional information: {
  failingDocumentId: 'string-price',
  details: {
    operatorName: '$jsonSchema',
    schemaRulesNotSatisfied: [
      {
        operatorName: 'properties',
        propertiesNotSatisfied: [
          {
            propertyName: 'price',
            details: [
              {
                operatorName: 'bsonType',
                specifiedAs: { bsonType: 'decimal' },
                reason: 'type did not match',
                consideredValue: '100.00',
                consideredType: 'string'
              }
            ]
          }
        ]
      }
    ]
  }
}
```

**Отрицательный остаток**

Команда:

```js
db.products.insertOne({_id: 'negative-stock', name: 'Футболка', category: 'clothes', price: NumberDecimal('100.00'), variants: [{size: 'L', stock: NumberInt(-1)}]})
```

Вывод:

```js
Uncaught:
MongoServerError: Document failed validation
Additional information: {
  failingDocumentId: 'negative-stock',
  details: {
    operatorName: '$jsonSchema',
    schemaRulesNotSatisfied: [
      {
        operatorName: 'properties',
        propertiesNotSatisfied: [
          {
            propertyName: 'variants',
            details: [
              {
                operatorName: 'items',
                reason: 'At least one item did not match the sub-schema',
                itemIndex: 0,
                details: [
                  {
                    operatorName: 'properties',
                    propertiesNotSatisfied: [
                      {
                        propertyName: 'stock',
                        details: [
                          {
                            operatorName: 'minimum',
                            specifiedAs: { minimum: 0 },
                            reason: 'comparison failed',
                            consideredValue: -1
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

Корректный документ принят, некорректные отклонены с ошибкой валидации.

### 2.2. Поиск товаров

За основу взят пример с `$elemMatch` из лонгрида недели 4, 3.6.

**Поиск двух единиц L**

Команда:

```js
searchProducts(db, {category: 'clothes', size: 'L', qty: 2})
```

Вывод:

```js
[
  {
    _id: 'B',
    name: 'Рубашка',
    category: 'clothes',
    price: Decimal128('80.00'),
    variants: [ { size: 'L', stock: 5 }, { size: 'M', stock: 4 } ]
  },
  {
    _id: 'C',
    name: 'Толстовка',
    category: 'clothes',
    price: Decimal128('90.00'),
    variants: [ { size: 'L', stock: 3 }, { size: 'M', stock: 2 } ]
  }
]
```

**Изменение остатка A/L на 2**

Команда:

```js
db.products.updateOne({_id: 'A', 'variants.size': 'L'}, {$set: {'variants.$.stock': NumberInt(2)}})
```

Вывод:

```js
{
  acknowledged: true,
  insertedId: null,
  matchedCount: 1,
  modifiedCount: 1,
  upsertedCount: 0
}
```

**Повторный поиск**

Команда:

```js
searchProducts(db, {category: 'clothes', size: 'L', qty: 2})
```

Вывод:

```js
[
  {
    _id: 'A',
    name: 'Футболка',
    category: 'clothes',
    price: Decimal128('100.00'),
    variants: [ { size: 'L', stock: 2 }, { size: 'M', stock: 10 } ]
  },
  {
    _id: 'B',
    name: 'Рубашка',
    category: 'clothes',
    price: Decimal128('80.00'),
    variants: [ { size: 'L', stock: 5 }, { size: 'M', stock: 4 } ]
  },
  {
    _id: 'C',
    name: 'Толстовка',
    category: 'clothes',
    price: Decimal128('90.00'),
    variants: [ { size: 'L', stock: 3 }, { size: 'M', stock: 2 } ]
  }
]
```

До изменения A не найден: остаток 10 есть только у M, а у L — 0. После изменения остатка L на 2 A найден.

### 2.3. История заказов

**Покупатель 2500, статус `paid`**

Команда:

```js
historyCursor(db, {userId: 2500, status: 'paid'}).projection({createdAt: 1, 'items.sku': 1, 'items.price': 1})
```

Вывод:

```js
[
  {
    _id: 'H24',
    createdAt: ISODate('2026-03-01T12:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H25',
    createdAt: ISODate('2026-03-01T12:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H22',
    createdAt: ISODate('2026-03-01T11:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H23',
    createdAt: ISODate('2026-03-01T11:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H20',
    createdAt: ISODate('2026-03-01T10:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H21',
    createdAt: ISODate('2026-03-01T10:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H18',
    createdAt: ISODate('2026-03-01T09:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H19',
    createdAt: ISODate('2026-03-01T09:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H16',
    createdAt: ISODate('2026-03-01T08:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H17',
    createdAt: ISODate('2026-03-01T08:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H14',
    createdAt: ISODate('2026-03-01T07:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H15',
    createdAt: ISODate('2026-03-01T07:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H12',
    createdAt: ISODate('2026-03-01T06:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H13',
    createdAt: ISODate('2026-03-01T06:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H10',
    createdAt: ISODate('2026-03-01T05:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H11',
    createdAt: ISODate('2026-03-01T05:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H08',
    createdAt: ISODate('2026-03-01T04:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H09',
    createdAt: ISODate('2026-03-01T04:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H06',
    createdAt: ISODate('2026-03-01T03:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  },
  {
    _id: 'H07',
    createdAt: ISODate('2026-03-01T03:00:00.000Z'),
    items: [ { sku: 'F', price: Decimal128('150.00') } ]
  }
]
```

У покупателя 2500 31 оплаченный заказ, возвращены 20 самых новых. Заказы с равной датой упорядочены по `_id`: H24 перед H25.

### 2.4. Модель данных

Опирается на лонгрид недели 4, 4.1–4.2.

1. **Почему позиции встроены в заказ?**

   1.1. Это эффективно и удобно. Когда читаем заказ, нам сразу нужны позиции — при встраивании получаем всё за одно чтение, иначе пришлось бы ещё искать позиции заказа.

   1.2. Ничего не мешает встраиванию — позиции отдельно от заказов не существуют, их в заказе мало, и больше их не становится.

2. **Почему история покупателя хранится отдельными документами?**

   2.1. Заказов у покупателя становится всё больше — если бы встроили их в покупателя, упёрлись бы в лимит документа (16 МБ).

   2.2. Отдельные заказы намного удобнее и эффективнее фильтровать и сортировать.

   2.3. Если встроить заказы, то при большом их числе замедлятся все операции с пользователем.

3. **Какой факт представляет цена в позиции?**

   Это цена единицы товара, по которой он был продан в момент покупки, — это не текущая цена товара.

## 3. Отчёт о продажах

За основу взят pipeline из лонгрида недели 4, 8.1–8.2.

**Отчёт за период `[2026-01-01, 2026-02-01)`**

Команда:

```js
report(db, ISODate('2026-01-01T00:00:00Z'), ISODate('2026-02-01T00:00:00Z'))
```

Вывод:

```js
[
  { sku: 'A', name: 'Футболка', qty: 3, revenue: Decimal128('320.00') },
  { sku: 'B', name: 'Рубашка', qty: 4, revenue: Decimal128('320.00') },
  { sku: 'C', name: 'Толстовка', qty: 3, revenue: Decimal128('270.00') },
  { sku: 'D', name: 'Ремень', qty: 2, revenue: Decimal128('240.00') },
  { sku: 'E', name: 'Сумка', qty: 1, revenue: Decimal128('200.00') }
]
```

**Заказы с товаром A**

Команда:

```js
db.orders.find({'items.sku': 'A'}, {createdAt: 1, status: 1, items: {$elemMatch: {sku: 'A'}}}).sort({createdAt: 1})
```

Вывод:

```js
[
  {
    _id: 'excluded-before',
    createdAt: ISODate('2025-12-31T23:59:59.999Z'),
    status: 'paid',
    items: [ { sku: 'A', size: 'M', qty: 999, price: Decimal128('100.00') } ]
  },
  {
    _id: 'sale-start',
    createdAt: ISODate('2026-01-01T00:00:00.000Z'),
    status: 'paid',
    items: [ { sku: 'A', size: 'M', qty: 2, price: Decimal128('100.00') } ]
  },
  {
    _id: 'excluded-created',
    createdAt: ISODate('2026-01-15T00:00:00.000Z'),
    status: 'created',
    items: [ { sku: 'A', size: 'M', qty: 999, price: Decimal128('100.00') } ]
  },
  {
    _id: 'excluded-cancelled',
    createdAt: ISODate('2026-01-15T00:00:00.000Z'),
    status: 'cancelled',
    items: [ { sku: 'A', size: 'M', qty: 999, price: Decimal128('100.00') } ]
  },
  {
    _id: 'sale-middle',
    createdAt: ISODate('2026-01-15T12:00:00.000Z'),
    status: 'paid',
    items: [ { sku: 'A', size: 'L', qty: 1, price: Decimal128('120.00') } ]
  },
  {
    _id: 'excluded-end',
    createdAt: ISODate('2026-02-01T00:00:00.000Z'),
    status: 'paid',
    items: [ { sku: 'A', size: 'M', qty: 999, price: Decimal128('100.00') } ]
  }
]
```

В отчёт попали только `sale-start` и `sale-middle`, как ожидалось.

`qty` = 2 + 1 = 3, `revenue` = 2 * 100.00 + 1 * 120.00 = 320.00.

**Изменение цены A в каталоге на 999.00 и повторный отчёт**

Команда:

```js
db.products.updateOne({_id: 'A'}, {$set: {price: NumberDecimal('999.00')}})
report(db, ISODate('2026-01-01T00:00:00Z'), ISODate('2026-02-01T00:00:00Z'))
```

Вывод:

```js
[
  { sku: 'A', name: 'Футболка', qty: 3, revenue: Decimal128('320.00') },
  { sku: 'B', name: 'Рубашка', qty: 4, revenue: Decimal128('320.00') },
  { sku: 'C', name: 'Толстовка', qty: 3, revenue: Decimal128('270.00') },
  { sku: 'D', name: 'Ремень', qty: 2, revenue: Decimal128('240.00') },
  { sku: 'E', name: 'Сумка', qty: 1, revenue: Decimal128('200.00') }
]
```

Отчёт не изменился: выручка считается по цене из позиции заказа, а не по цене в каталоге.

## 4. Индекс и план выполнения

### 4.1. План до индекса

**План запроса истории, покупатель 2500, статус `paid`**

Команда:

```js
historyCursor(db, {userId: 2500, status: 'paid'}).explain('executionStats').executionStats
```

Вывод:

```js
{
  executionSuccess: true,
  nReturned: 20,
  executionTimeMillis: 9,
  totalKeysExamined: 0,
  totalDocsExamined: 10000,
  executionStages: {
    isCached: false,
    stage: 'SORT',
    nReturned: 20,
    executionTimeMillisEstimate: 9,
    works: 10022,
    advanced: 20,
    needTime: 10001,
    needYield: 0,
    saveState: 0,
    restoreState: 0,
    isEOF: 1,
    sortPattern: { createdAt: -1, _id: 1 },
    memLimit: 104857600,
    limitAmount: 20,
    type: 'simple',
    totalDataSizeSorted: 4960,
    usedDisk: false,
    spills: 0,
    spilledDataStorageSize: 0,
    inputStage: {
      stage: 'COLLSCAN',
      filter: {
        '$and': [ { status: { '$eq': 'paid' } }, { userId: { '$eq': 2500 } } ]
      },
      nReturned: 1600,
      executionTimeMillisEstimate: 0,
      works: 10001,
      advanced: 1600,
      needTime: 8400,
      needYield: 0,
      saveState: 0,
      restoreState: 0,
      isEOF: 1,
      direction: 'forward',
      docsExamined: 10000
    }
  }
}
```

Результат:

- `nReturned` = 20
- `totalKeysExamined` = 0
- `totalDocsExamined` = 10000
- отдельная `SORT` есть

План: `COLLSCAN` (прочитаны все 10 000 документов, под фильтр подошли 1600) -> `SORT` в памяти (выдала первые 20).

### 4.2. План после индекса

**Создание индекса и план запроса истории, покупатель 2500, статус `paid`**

Команда:

```js
db.orders.createIndex({userId: 1, status: 1, createdAt: -1, _id: 1})
historyCursor(db, {userId: 2500, status: 'paid'}).explain('executionStats').executionStats
```

Вывод:

```js
{
  executionSuccess: true,
  nReturned: 20,
  executionTimeMillis: 6,
  totalKeysExamined: 20,
  totalDocsExamined: 20,
  executionStages: {
    isCached: false,
    stage: 'LIMIT',
    nReturned: 20,
    executionTimeMillisEstimate: 0,
    works: 21,
    advanced: 20,
    needTime: 0,
    needYield: 0,
    saveState: 0,
    restoreState: 0,
    isEOF: 1,
    limitAmount: 20,
    inputStage: {
      stage: 'FETCH',
      nReturned: 20,
      executionTimeMillisEstimate: 0,
      works: 20,
      advanced: 20,
      needTime: 0,
      needYield: 0,
      saveState: 0,
      restoreState: 0,
      isEOF: 0,
      docsExamined: 20,
      alreadyHasObj: 0,
      inputStage: {
        stage: 'IXSCAN',
        nReturned: 20,
        executionTimeMillisEstimate: 0,
        works: 20,
        advanced: 20,
        needTime: 0,
        needYield: 0,
        saveState: 0,
        restoreState: 0,
        isEOF: 0,
        keyPattern: { userId: 1, status: 1, createdAt: -1, _id: 1 },
        indexName: 'userId_1_status_1_createdAt_-1__id_1',
        isMultiKey: false,
        multiKeyPaths: { userId: [], status: [], createdAt: [], _id: [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: {
          userId: [ '[2500, 2500]' ],
          status: [ '["paid", "paid"]' ],
          createdAt: [ '[MaxKey, MinKey]' ],
          _id: [ '[MinKey, MaxKey]' ]
        },
        keysExamined: 20,
        seeks: 1,
        dupsTested: 0,
        dupsDropped: 0
      }
    }
  }
}
```

Результат:

- `nReturned` = 20
- `totalKeysExamined` = 20
- `totalDocsExamined` = 20
- отдельной `SORT` нет

План: `IXSCAN` (прочитаны 20 ключей индекса, уже в нужном порядке) -> `FETCH` (прочитаны 20 документов) -> `LIMIT` (выдал 20).

### 4.3. Сравнение

| Вариант | nReturned | totalKeysExamined | totalDocsExamined | Есть отдельная SORT |
|---|---:|---:|---:|---|
| До индекса | 20 | 0 | 10000 | да |
| После индекса | 20 | 20 | 20 | нет |

### 4.4. Объяснение

1. **Почему такой порядок полей?**

   По ESR: сначала `userId` и `status` (равенство), далее сортировка — `createdAt` по убыванию и `_id` по возрастанию, в том же порядке, как в запросе.

2. **Как изменилась работа запроса?**

   До индекса: `COLLSCAN` (прочитаны все 10 000 документов, под фильтр подошли 1600) -> `SORT` в памяти (выдала первые 20).

   После индекса: `IXSCAN` (прочитаны 20 ключей индекса, уже в нужном порядке) -> `FETCH` (прочитаны 20 документов) -> `LIMIT` (выдал 20).

3. **Какая издержка у индекса?**

   - Запись становится дороже: каждая вставка или изменение заказа должны обновлять и индекс.
   - Индекс занимает место на диске и в кэше: он хранится отдельно от документов.
   - Построение индекса — долгая операция, и всё время построения расходуются ресурсы: CPU, RAM, диск.

4. **Применялся ли `hint`?**

   Нет, индекс планировщик выбрал сам.

## 5. Оформление заказа

### 5.1. Успешная покупка

**Остатки и число заказов до покупки**

Команда:

```js
db.products.find({_id: {$in: ['A', 'B']}}, {variants: 1})
db.orders.countDocuments()
```

Вывод:

```js
[
  {
    _id: 'A',
    variants: [ { size: 'L', stock: 0 }, { size: 'M', stock: 10 } ]
  },
  {
    _id: 'B',
    variants: [ { size: 'L', stock: 5 }, { size: 'M', stock: 4 } ]
  }
]
35
```

**Покупка `purchase-001`**

Команда:

```js
purchase({operationId: 'purchase-001', userId: 2500, items: [{sku: 'A', size: 'M', qty: 2}, {sku: 'B', size: 'L', qty: 1}]})
```

Вывод:

```js
{
  _id: 'purchase-001',
  userId: 2500,
  createdAt: ISODate('2026-10-25T15:13:23.745Z'),
  status: 'created',
  items: [
    { sku: 'A', size: 'M', qty: 2, price: Decimal128('100.00') },
    { sku: 'B', size: 'L', qty: 1, price: Decimal128('80.00') }
  ]
}
```

**Остатки и число заказов после покупки**

Команда:

```js
db.products.find({_id: {$in: ['A', 'B']}}, {variants: 1})
db.orders.countDocuments()
```

Вывод:

```js
[
  {
    _id: 'A',
    variants: [ { size: 'L', stock: 0 }, { size: 'M', stock: 8 } ]
  },
  {
    _id: 'B',
    variants: [ { size: 'L', stock: 4 }, { size: 'M', stock: 4 } ]
  }
]
36
```

Списаны только A/M на 2 и B/L на 1, создан один заказ.

### 5.2. Откат при нехватке второго товара

**Покупка `purchase-002`: B/L 6 при остатке 4**

Команда:

```js
purchase({operationId: 'purchase-002', userId: 2500, items: [{sku: 'A', size: 'M', qty: 2}, {sku: 'B', size: 'L', qty: 6}]}, printjson)
```

Вывод:

```js
{
  event: 'update_inside_transaction',
  sku: 'A',
  matched: 1,
  modified: 1
}
{
  event: 'update_inside_transaction',
  sku: 'B',
  matched: 0,
  modified: 0
}
Uncaught Error: ITEM_UNAVAILABLE
```

**Остатки и число заказов после отката**

Команда:

```js
db.products.find({_id: {$in: ['A', 'B']}}, {variants: 1})
db.orders.countDocuments()
```

Вывод:

```js
[
  {
    _id: 'A',
    variants: [ { size: 'L', stock: 0 }, { size: 'M', stock: 8 } ]
  },
  {
    _id: 'B',
    variants: [ { size: 'L', stock: 4 }, { size: 'M', stock: 4 } ]
  }
]
36
```

Списание A/M внутри транзакции прошло (`modified: 1`), у B/L остатка не хватило (`matched: 0`) — транзакция отменена: остатки как до покупки, заказа нет, ошибка `ITEM_UNAVAILABLE`.

### 5.3. Повтор и конфликт

**Повтор `purchase-001`**

Команда:

```js
purchase({operationId: 'purchase-001', userId: 2500, items: [{sku: 'A', size: 'M', qty: 2}, {sku: 'B', size: 'L', qty: 1}]})
```

Вывод:

```js
{
  _id: 'purchase-001',
  userId: 2500,
  createdAt: ISODate('2026-10-25T15:13:23.745Z'),
  status: 'created',
  items: [
    { sku: 'A', size: 'M', qty: 2, price: Decimal128('100.00') },
    { sku: 'B', size: 'L', qty: 1, price: Decimal128('80.00') }
  ]
}
```

**`purchase-001` с другим количеством**

Команда:

```js
purchase({operationId: 'purchase-001', userId: 2500, items: [{sku: 'A', size: 'M', qty: 3}, {sku: 'B', size: 'L', qty: 1}]})
```

Вывод:

```js
Uncaught Error: REQUEST_CONFLICT
```

**Остатки и число заказов после повтора и конфликта**

Команда:

```js
db.products.find({_id: {$in: ['A', 'B']}}, {variants: 1})
db.orders.countDocuments()
```

Вывод:

```js
[
  {
    _id: 'A',
    variants: [ { size: 'L', stock: 0 }, { size: 'M', stock: 8 } ]
  },
  {
    _id: 'B',
    variants: [ { size: 'L', stock: 4 }, { size: 'M', stock: 4 } ]
  }
]
36
```

Повтор вернул тот же заказ, включая дату и цены, без новых списаний. Запрос с другим количеством отклонён, данные не изменены.

### 5.4. Счётчики транзакций

**Успешная покупка**

Команда:

```js
before = db.serverStatus().transactions
purchase({operationId: 'purchase-001', userId: 2500, items: [{sku: 'A', size: 'M', qty: 2}, {sku: 'B', size: 'L', qty: 1}]})
after = db.serverStatus().transactions
({started: after.totalStarted - before.totalStarted, committed: after.totalCommitted - before.totalCommitted, aborted: after.totalAborted - before.totalAborted})
```

Вывод:

```js
{ started: 1, committed: 1, aborted: 0 }
```

**Откат после первого списания**

Команда:

```js
before = db.serverStatus().transactions
purchase({operationId: 'purchase-002', userId: 2500, items: [{sku: 'A', size: 'M', qty: 2}, {sku: 'B', size: 'L', qty: 6}]})
after = db.serverStatus().transactions
({started: after.totalStarted - before.totalStarted, committed: after.totalCommitted - before.totalCommitted, aborted: after.totalAborted - before.totalAborted})
```

Вывод:

```js
{ started: 1, committed: 0, aborted: 1 }
```

| Опыт | Δ totalStarted | Δ totalCommitted | Δ totalAborted |
|---|---:|---:|---:|
| Новая успешная покупка | 1 | 1 | 0 |
| Откат после первого списания | 1 | 0 | 1 |

### 5.5. Объяснение

1. **Чем атомарность отличается от защиты от повторного запроса?**

   1.1. Атомарность — это про то, что транзакция неделима: либо проходит вся, либо нет. Либо создали заказ и списали остатки, либо ничего.

   1.2. Защита от повтора — это про другое: например, клиент по ошибке отправил 2 одинаковых запроса, а мы хотим совершить заказ только 1 раз. Для этого пишем защиту: если уже есть заказ с таким `operationId`, то не делаем его.

2. **Какие настройки у транзакции?**

   - `readPreference: 'primary'` — чтения транзакции идут на primary;
   - `readConcern: {level: 'snapshot'}` — все чтения транзакции из одного snapshot;
   - `writeConcern: {w: 'majority', j: true, wtimeout: 10000}` — когда сервер подтверждает commit всей транзакции:
     - `w: 'majority'` — commit применён на большинстве узлов, поэтому переживёт смену primary;
     - `j: true` — commit записан в журнал на диске, поэтому не пропадёт при падении процесса;
     - `wtimeout: 10000` — подтверждение большинства ждём не дольше 10 секунд, иначе ошибка write concern, а результат commit неизвестен.

     Внутренние операции своего write concern не задают.

3. **Как код приводит к commit или abort?**

   - Тело транзакции завершилось без исключения — commit.
   - Тело бросило исключение — abort, все изменения транзакции откатываются.

## 6. Смена primary

### 6.1. Опыт

**Роли до смены**

Команда:

```js
rs.status().members.map(m => ({host: m.name, role: m.stateStr}))
```

Вывод:

```js
[
  { host: 'm1:27017', role: 'PRIMARY' },
  { host: 'm2:27017', role: 'SECONDARY' },
  { host: 'm3:27017', role: 'SECONDARY' }
]
```

**Контрольная запись с majority**

Команда:

```js
c = db.getSiblingDB('hw2_failover')
writeProbe(c, 'before', 'majority confirmed before stepDown')
```

Вывод:

```js
{
  acknowledged: true,
  insertedId: 'before',
  matchedCount: 0,
  modifiedCount: 0,
  upsertedCount: 1
}
```

**Смена primary**

Команда:

```js
rs.stepDown()
```

Вывод:

```js
{
  ok: 1,
  '$clusterTime': {
    clusterTime: Timestamp({ t: 1792946520, i: 4 }),
    signature: {
      hash: Binary.createFromBase64('AAAAAAAAAAAAAAAAAAAAAAAAAAA=', 0),
      keyId: Long('0')
    }
  },
  operationTime: Timestamp({ t: 1792946520, i: 4 })
}
```

**Роли после смены**

Команда:

```js
rs.status().members.map(m => ({host: m.name, role: m.stateStr}))
```

Вывод:

```js
[
  { host: 'm1:27017', role: 'SECONDARY' },
  { host: 'm2:27017', role: 'SECONDARY' },
  { host: 'm3:27017', role: 'PRIMARY' }
]
```

**Чтение контрольного документа тем же клиентом**

Команда:

```js
readProbe(c, 'before')
```

Вывод:

```js
{ _id: 'before', message: 'majority confirmed before stepDown' }
```

**Новая запись тем же клиентом**

Команда:

```js
writeProbe(c, 'after', 'majority confirmed after stepDown')
```

Вывод:

```js
{
  acknowledged: true,
  insertedId: 'after',
  matchedCount: 0,
  modifiedCount: 0,
  upsertedCount: 1
}
```

Primary сменился с m1 на m3. Тот же клиент без смены адреса прочитал документ, записанный до смены, и записал новый с majority.

### 6.2. Объяснение

1. **Как клиент находит новый primary?**

   - Клиент подключён не к одному узлу, а к replica set: в URI все три адреса и `replicaSet=hw2rs`.
   - Драйвер сам следит за узлами: периодически опрашивает каждый и знает, кто сейчас primary.
   - После `stepDown` старый primary отвечает, что он больше не primary. Драйвер заново опрашивает узлы, находит новый primary и отправляет операции туда. Запись при такой ошибке повторяется один раз (`retryWrites=true`).

2. **Почему majority-подтверждение не гарантирует актуальное чтение с любой secondary?**

   `w: 'majority'` значит, что запись есть на большинстве узлов — у нас на 2 из 3. Третий узел может её ещё не получить.

## 7. Шардирование

1. **Какие шарды опросит `mongos` для истории `{userId: 2500}` и для отчёта по `{status: "paid"}`?**

   1.1. История `{userId: 2500}` — только шард B, адресный запрос. В фильтре есть ключ шардирования, и `mongos` по конфигу находит диапазон: 2500 входит в `[2000, 5000)` — это B.

   1.2. Отчёт `{status: "paid"}` — оба шарда, A и B, это scatter-gather. В фильтре нет `userId`, поэтому `mongos` не может определить, где лежат подходящие заказы.

2. **Изменится ли число шардов, которые выполняют отчёт, после индекса `{status: 1}` внутри шардов? Какую работу этот индекс способен изменить?**

   2.1. Нет, по-прежнему оба шарда. `mongos` выбирает шарды только по ключу шардирования и карте диапазонов, индексы внутри шардов на маршрутизацию не влияют.

   2.2. Индекс меняет работу внутри каждого шарда: вместо чтения всех заказов шарда (`COLLSCAN`) шард найдёт заказы со статусом `paid` по индексу (`IXSCAN`) и прочитает меньше документов.
