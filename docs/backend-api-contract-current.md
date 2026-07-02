# Актуальный контракт API

Этот файл описывает текущий фронтенд-контракт для бэкенда. Фронтенд не вычисляет статусы сам: он отображает то, что пришло от сервера.

## Monitoring Snapshot

```http
GET /api/objects
```

Ответ:

```json
{
  "objects": [],
  "maxObjects": 15
}
```

Если объекты уже подключены к серверу, они приходят сразу в `objects`. Если объектов нет, приходит пустой массив.

## Объект

```json
{
  "id": "car-01",
  "type": "car",
  "name": "Машина-01",
  "description": "Сервисный автомобиль",
  "status": "normal",
  "coordinates": "-48.42152, 37.88403",
  "updatedAt": "2026-07-02T12:45:31.000Z",
  "static": [
    { "label": "Точка начала", "value": "-71.42015, 62.14577" },
    { "label": "Точка прибытия", "value": "64.30184, -32.86719" }
  ],
  "telemetry": [
    {
      "key": "fuel",
      "label": "Топливо",
      "progress": 72,
      "value": "72 %",
      "status": "normal"
    }
  ]
}
```

Старые поля с отдельным названием типа и старым именем статических параметров не используются.

## Статусы

Допустимые значения для объекта и телеметрии:

- `normal` - норма, зеленый.
- `warning` - предупреждение, желтый.
- `alert` - критическое состояние, красный.
- `nodata` - нет данных, серый.

## Координаты

Координаты условные, не географические:

- центр карты: `0, 0`;
- диапазон X и Y: от `-100` до `100`;
- формат: строка `"x, y"`;
- дробные значения ожидаются, например `"51.42152, -17.62080"`.

Любой объект может изменить координаты в любой момент. Поля `movable` нет.

## Realtime События

События можно отдавать через WebSocket, SSE или любой другой realtime-канал. Фронту важна структура payload.

### created

```json
{
  "type": "created",
  "object": {
    "id": "drone-05",
    "type": "drone",
    "name": "Дрон-05",
    "description": "БПЛА наблюдения",
    "status": "normal",
    "coordinates": "12.50124, -61.90421",
    "updatedAt": "2026-07-02T12:45:36.000Z",
    "static": [],
    "telemetry": [
      {
        "key": "charge",
        "label": "Заряд",
        "progress": 81,
        "value": "81 %",
        "status": "normal"
      }
    ]
  }
}
```

### updated

```json
{
  "type": "updated",
  "objectId": "drone-05",
  "patch": {
    "coordinates": "14.88441, -59.12005",
    "status": "warning",
    "updatedAt": "2026-07-02T12:45:39.000Z",
    "telemetryUpdates": [
      {
        "key": "charge",
        "progress": 28,
        "value": "28 %",
        "status": "warning"
      }
    ]
  }
}
```

В `patch` можно передавать только изменившиеся поля. Для телеметрии при обновлении не нужны `label`, `unit`, `range`, `rawValue`.

### deleted

```json
{
  "type": "deleted",
  "objectId": "drone-05"
}
```

Если удаленный объект был выбран, фронт снимает выделение.

## History

```http
GET /api/history?dateFrom=16.05.2025%2000:00&dateTo=23.05.2025%2023:59&object=Все%20объекты&status=Все%20статусы
```

Параметры:

- `dateFrom` - начало периода в формате `dd.mm.yyyy HH:mm`.
- `dateTo` - конец периода в формате `dd.mm.yyyy HH:mm`.
- `object` - название объекта или `Все объекты`.
- `status` - `Все статусы`, `Норма`, `Предупреждение`, `Критическое`, `Нет данных`.

Ответ:

```json
{
  "filters": {},
  "rows": [
    {
      "id": "archive-1",
      "timestamp": "2025-05-23T09:45:00.000Z",
      "time": "23.05.2025 12:45",
      "icon": "/images/car_marker.svg",
      "object": "Машина-01",
      "objectStatus": "Норма",
      "statusClass": "normal",
      "coordinates": "-48.42152, 44.33403",
      "parameter": "Топливо",
      "value": "72 %",
      "badge": "Норма",
      "badgeClass": "normal"
    }
  ],
  "total": 1,
  "summary": [],
  "stats": { "cards": [] },
  "periodLabel": "7 дн. 23 ч. 59 мин.",
  "objectOptions": ["Все объекты", "Машина-01"],
  "statusOptions": ["Все статусы", "Норма", "Предупреждение", "Критическое", "Нет данных"]
}
```

## History Export

```http
GET /api/history/export?dateFrom=16.05.2025%2000:00&dateTo=23.05.2025%2023:59&object=Все%20объекты&status=Все%20статусы
```

Ответ должен инициировать скачивание CSV по тем же фильтрам, что используются для таблицы.
