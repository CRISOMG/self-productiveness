# Chat Multimodal por Source URL — Requerimientos, Especificación e Implementación

## Contexto

Tras los commits `dcee653` (refactor audio: separar upload de transcripción) y `43c8098` (refactor chat: simplificar API), la arquitectura actual es:

1. **Upload**: El cliente sube archivos a Supabase Storage directamente, luego llama `/api/audio/upload` para registrar y obtener un signed URL.
2. **Chat**: El cliente envía mensajes JSON con `parts[]` que incluyen `source-url` con URLs de Supabase. El servidor las extrae como metadata pero **nunca las envía al modelo como contenido multimodal**.
3. **Transcripción**: Separada en `/api/audio/transcribe`, usa Gemini directamente pasando signed URLs.

### Problema actual

El archivo `chat.post.ts` **NO es multimodal**. Los archivos adjuntos (`source-url` parts) se extraen como metadata textual (`[ARCHIVOS ADJUNTOS]`) y se inyectan como texto plano en el system prompt. Gemini **nunca "ve"** los archivos (audio, imágenes). Esto contradice la capacidad nativa multimodal de Gemini documentada en el informe de referencia.

---

## Requerimientos

### R1: El chat debe soportar entrada multimodal nativa

El modelo Gemini debe recibir los archivos (audio, imágenes, PDFs) como `file` parts en el mensaje del usuario, no como texto plano de metadata. Gemini es nativamente multimodal y puede procesar directamente URLs de archivos.

### R2: Utilizar signed URLs de Supabase Storage

Los archivos ya están en Supabase Storage con signed URLs generados por el pipeline de upload. El servidor debe reutilizar estas URLs para enviarlas al modelo como `file` parts, sin re-descargar ni re-codificar.

### R3: Mantener compatibilidad con mensajes de texto plano

Mensajes sin archivos adjuntos deben seguir funcionando igual. La multimodalidad es aditiva.

### R4: No duplicar lógica existente

El endpoint de transcripción (`/api/audio/transcribe`) ya demuestra el patrón correcto: toma un signed URL y lo pasa a Gemini como `{ type: "file", data: new URL(signedUrl), mediaType }`. El chat debe hacer lo mismo.

### R5: Compatibilidad con el flujo actual del frontend

El `chat-container.vue` ya envía archivos como `source-url` parts. El backend debe interpretar estas parts y transformarlas en `file` parts para el modelo, sin cambios en el frontend.

---

## Especificación Técnica

### Flujo Actual (AS-IS)

```
[Cliente]                           [Server chat.post.ts]        [Gemini]
   |                                       |                         |
   |-- POST { messages: [...parts] } ---->|                         |
   |   (parts incluyen source-url)        |                         |
   |                                       |-- extrae source-url    |
   |                                       |   como metadata texto  |
   |                                       |-- inyecta en system    |
   |                                       |   prompt como JSON     |
   |                                       |                        |
   |                                       |-- streamText({         |
   |                                       |     messages (solo     |
   |                                       |     text parts)        |
   |                                       |     system: prompt +   |
   |                                       |     "[ARCHIVOS...]"    |
   |                                       |   }) ------------------>|
   |                                       |                        |
   |<---- streaming tokens ----------------|<--- tokens ------------|
```

### Flujo Propuesto (TO-BE)

```
[Cliente]                           [Server chat.post.ts]        [Gemini]
   |                                       |                         |
   |-- POST { messages: [...parts] } ---->|                         |
   |   (parts incluyen source-url)        |                         |
   |                                       |-- extrae source-url    |
   |                                       |-- genera signed URLs   |
   |                                       |   para cada archivo    |
   |                                       |                        |
   |                                       |-- convierte a          |
   |                                       |   ModelMessages        |
   |                                       |                        |
   |                                       |-- inyecta file parts   |
   |                                       |   en el último msg     |
   |                                       |   del usuario con URLs |
   |                                       |                        |
   |                                       |-- streamText({         |
   |                                       |     messages (text +   |
   |                                       |     file parts)        |
   |                                       |   }) ------------------>|
   |                                       |                        |
   |<---- streaming tokens ----------------|<--- tokens ------------|
```

### Cambios Concretos en `chat.post.ts`

#### 1. Después de la conversión a ModelMessages (línea ~106), inyectar file parts

En lugar de inyectar metadata como texto en el system prompt:

```typescript
// ANTES (líneas 111-115):
let contextMessage = "";
if (googleDriveMetadata.length > 0) {
  contextMessage = `\n\n[ARCHIVOS ADJUNTOS]\n${JSON.stringify(googleDriveMetadata, null, 2)}`;
}
```

Se reemplaza por inyección de `file` parts en el último mensaje del usuario:

```typescript
// DESPUÉS:
// Para cada source-url extraído, generar signed URL y crear file part
if (sourceUrlFiles.length > 0) {
  const lastMsg = modelMessages[modelMessages.length - 1];
  if (lastMsg?.role === "user") {
    const userMsg = lastMsg as UserModelMessage;
    const currentContent: UserContent =
      typeof userMsg.content === "string"
        ? [{ type: "text", text: userMsg.content }]
        : userMsg.content;

    const fileParts: FilePart[] = [];
    for (const file of sourceUrlFiles) {
      // Generar signed URL fresco desde Supabase
      const { data } = await supabase.storage
        .from("yourfocus")
        .createSignedUrl(file.path, 600);

      if (data?.signedUrl) {
        fileParts.push({
          type: "file",
          data: new URL(data.signedUrl),
          mediaType: file.mimeType as any,
        });
      }
    }

    userMsg.content = [...currentContent, ...fileParts];
  }
}
```

#### 2. Extraer path y mimeType de los source-url parts

Actualmente se extrae `providerMetadata.googleDrive`. Debemos también extraer la info de archivos de Supabase Storage:

```typescript
interface SourceFile {
  path: string; // Supabase storage path
  mimeType: string;
  url: string; // signed URL ya existente (puede estar expirada)
}

// Dentro del mapeo de safeMessages:
const sourceUrlFiles: SourceFile[] = [];

sourceUrlParts.forEach((p) => {
  // Archivos de Supabase Storage (audio/text uploads)
  const driveData = p.providerMetadata?.googleDrive;
  if (driveData) {
    // Extraer path del archivo desde la URL si tiene path info
    // O usar la URL directamente para regenerar signed URL
    sourceUrlFiles.push({
      path: driveData.path || extractPathFromUrl(p.url),
      mimeType: driveData.mimeType || "application/octet-stream",
      url: p.url,
    });
  }
});
```

#### 3. Resolver la relación path <> URL

**Problema**: Los `source-url` parts del frontend tienen `url` (signed URL) y `providerMetadata.googleDrive` (por legado), pero no siempre tienen el `path` de Supabase Storage necesario para generar un nuevo signed URL.

**Solución A (recomendada)**: Modificar `chat-container.vue` para incluir `path` en el `providerMetadata`:

```typescript
// En chat-container.vue handleSubmit:
parts.push({
  type: "source-url",
  sourceId: f.driveFile?.id,
  title: f.filename,
  url: f.driveFile?.webViewLink,
  providerMetadata: {
    supabaseStorage: {
      path: f.driveFile?.path, // ← NUEVO
      mimeType: f.driveFile?.mimeType,
    },
  },
});
```

**Solución B (fallback)**: Usar la signed URL existente directamente sin regenerar:

```typescript
// Si la URL ya existe y no ha expirado, usarla directamente
fileParts.push({
  type: "file",
  data: new URL(file.url), // signed URL del frontend
  mediaType: file.mimeType as any,
});
```

---

## Plan de Implementación

### Fase 1: Backend — Inyección de file parts (server/api/chat.post.ts)

**Archivos a modificar**: `server/api/chat.post.ts`

1. Refactorizar la extracción de `source-url` parts para recopilar `SourceFile[]`
2. Después de `convertToModelMessages`, inyectar `file` parts en el último mensaje del usuario
3. Eliminar la inyección textual `[ARCHIVOS ADJUNTOS]` del system prompt
4. Usar signed URLs directas (Solución B) como primer paso

### Fase 2: Frontend — Pasar metadata de Storage (chat-container.vue)

**Archivos a modificar**: `app/components/containers/chat-container.vue`, `app/composables/useFileUpload.ts`

1. Incluir `path` en la estructura de archivos uploadados
2. Cambiar `providerMetadata` de `googleDrive` a `supabaseStorage` para archivos locales
3. Mantener compatibilidad con archivos de Google Drive existentes

### Fase 3: Validación

1. Enviar un mensaje con un archivo de audio adjunto → Gemini debe "escuchar" el audio
2. Enviar un mensaje con texto plano → debe funcionar igual
3. Verificar que signed URLs no estén expiradas al momento de llegar a Gemini

---

## Riesgos y Consideraciones

| Riesgo                                     | Mitigación                                                         |
| ------------------------------------------ | ------------------------------------------------------------------ |
| Signed URLs expiran (1h por defecto)       | Regenerar signed URL fresco en el backend antes de enviar a Gemini |
| Payload grande con múltiples archivos      | Gemini maneja URLs externas, no se re-descarga en el server        |
| mimeType incorrecto                        | Validar contra lista de mimeTypes soportados por Gemini            |
| Latencia adicional por generar signed URLs | Paralelizar con `Promise.all`                                      |
| Google Drive files vs Supabase files       | Discriminar por `providerMetadata` type y manejar cada caso        |
