# Chat Persistence: Migración de n8n/LangChain → AI SDK v6

## Estado: ⚠️ PENDIENTE

## Problema

La tabla `n8n_chat_histories` y los endpoints `chat.get.ts` / `chat.post.ts` usan un formato de mensajes heredado de n8n/LangChain:

```typescript
// Formato LEGACY (n8n/LangChain)
{
  type: "human" | "ai",        // ← no es estándar AI SDK
  content: string,              // ← solo texto plano, no parts
  additional_kwargs: {},         // ← estructura arbitraria
  data?: { content: string },   // ← variante LangChain
  response_metadata?: {},
  tool_calls?: [],
  invalid_tool_calls?: [],
}
```

### Limitaciones del formato actual

1. **No soporta `parts` multimodales**: Solo persiste `content` como string. Los `source-url`, `file`, `image`, `reasoning` parts se pierden al persistir.
2. **No tiene timestamps reales**: `chat.get.ts` usa `new Date()` para todos los mensajes (línea 68).
3. **Mapeo frágil**: `chat.get.ts` convierte `type: "human"` → `role: "user"` manualmente.
4. **Tabla compartida con n8n**: `n8n_chat_histories` fue diseñada para n8n, no para AI SDK.

## Formato objetivo (AI SDK v6 UIMessage)

```typescript
// Formato TARGET (Vercel AI SDK v6)
{
  id: string,
  role: "user" | "assistant" | "system",
  content: string,              // texto principal (compatibilidad)
  parts: UIMessagePart[],       // ← CLAVE: array tipado de parts
  createdAt: Date,              // timestamp real
  metadata?: {
    model?: string,
    usage?: { promptTokens, completionTokens },
    finishReason?: string,
  },
}

// UIMessagePart puede ser:
// { type: "text", text: string }
// { type: "source-url", sourceId, title, url, providerMetadata }
// { type: "file", mediaType, data, filename }
// { type: "reasoning", text, state }
// { type: "tool-invocation", ... }
```

## Plan de Migración

### Fase 1: Nueva tabla (schema)

```sql
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT DEFAULT '',
  parts JSONB NOT NULL DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(session_id, created_at);
```

### Fase 2: Actualizar POST (`chat.post.ts`)

- Persistir en `chat_messages` con `parts` completos (incluyendo `source-url`)
- Mantener write dual a `n8n_chat_histories` durante migración

### Fase 3: Actualizar GET (`chat.get.ts`)

- Leer de `chat_messages` directamente
- Retornar `parts` tal cual sin reconstrucción manual
- Fallback a `n8n_chat_histories` para historial viejo

### Fase 4: Deprecar

- Eliminar escritura a `n8n_chat_histories`
- Marcar interfaces `N8NMessageLangChain` como deprecated
- Migrar datos históricos (opcional, one-time script)

## Archivos Afectados

| Archivo                                        | Cambio                                                     |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `server/api/chat.post.ts`                      | Persistir parts completos en nueva tabla                   |
| `server/api/chat.get.ts`                       | ⚠️ **DEPRECAR** formato n8n/LangChain, leer de nueva tabla |
| `n8n_chat_histories` (tabla)                   | ⚠️ **DEPRECAR** — reemplazar con `chat_messages`           |
| `app/components/containers/chat-container.vue` | Sin cambios (ya maneja parts)                              |

## Notas

- El frontend (`chat-container.vue`) ya está preparado: itera sobre `message.parts` y maneja `source-url`, `text`, `reasoning`, etc.
- El problema es exclusivamente de persistencia/carga: el backend pierde las parts al guardar y no las reconstruye al cargar.
- La migración es independiente del feature multimodal, pero es **bloqueante** para que los archivos adjuntos persistan entre sesiones.
