# Frontend API Runtime

Фронт теперь по умолчанию работает с реальным backend API.

## Endpoint-ы

```env
VITE_API_BASE_URL=
VITE_API_OBJECTS_ENDPOINT=/api/objects
VITE_API_EVENTS_ENDPOINT=/api/objects/events
VITE_API_HISTORY_ENDPOINT=/api/history
VITE_API_HISTORY_EXPORT_ENDPOINT=/api/history/export
```

Если `VITE_API_BASE_URL` пустой, запросы идут на тот же origin. Если backend отдельно, например на `http://localhost:3000`, нужно указать:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Monitoring

Стартовая загрузка:

```http
GET /api/objects
```

Realtime:

```http
GET /api/objects/events
```

По умолчанию используется SSE:

```env
VITE_API_REALTIME_TRANSPORT=sse
```

Также поддерживается WebSocket:

```env
VITE_API_REALTIME_TRANSPORT=ws
```

Payload событий тот же:

- `created`
- `updated`
- `deleted`

SSE может отправлять события либо обычным `message`, либо typed event `created/updated/deleted`.

## History

Таблица:

```http
GET /api/history?dateFrom=16.05.2025%2000:00&dateTo=23.05.2025%2023:59&object=Все%20объекты&status=Все%20статусы
```

CSV:

```http
GET /api/history/export?dateFrom=16.05.2025%2000:00&dateTo=23.05.2025%2023:59&object=Все%20объекты&status=Все%20статусы
```

Для `/api/history` желательно вернуть полный объект со `rows`, `summary`, `stats`, `objectOptions`, `statusOptions`.
Если backend вернет только `rows` и `total`, фронт сам достроит сводку для интерфейса.
