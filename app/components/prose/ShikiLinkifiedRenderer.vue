<script setup lang="ts">
import { ref, reactive, watch, watchEffect, type PropType } from "vue";
import { CodeToTokenTransformStream } from "shiki-stream";
import { getTokenStyleObject } from "@shikijs/core";
import type { HighlighterCore } from "@shikijs/core";

// Helper for keys
let idCounter = 0;
const weakMap = new WeakMap<any, number>();
function objectId(obj: any) {
  if (!weakMap.has(obj)) weakMap.set(obj, idCounter++);
  return weakMap.get(obj);
}

const props = defineProps({
  code: {
    type: String,
    required: true,
  },
  lang: {
    type: String,
    required: true,
  },
  theme: {
    type: String,
    required: true,
  },
  highlighter: {
    type: Object as PropType<HighlighterCore>,
    required: true,
  },
});

const emit = defineEmits(["stream-start", "stream-end"]);

// Link parsing logic
// Matches http/https URLs, stopping at whitespace or common closing delimiters in code
const urlRegex = /https?:\/\/[^\s)"']+/g;

function parseLinks(text: string) {
  if (!text) return [{ type: "text", content: "" }];

  const parts = [];
  let lastIndex = 0;
  let match;

  // We need to reset lastIndex if reusing regex, but here we create new regex or simply using matchAll/exec loop on local var
  // Since we define regex inside or reset it.
  // Actually regex with 'g' stores state. Let's create a local one.
  const regex = new RegExp(urlRegex);

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "link", content: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }
  return parts;
}

// Logic from ShikiCachedRenderer + ShikiStreamRenderer
const tokens = reactive<any[]>([]);
const index = ref(0);
let controller: ReadableStreamDefaultController<string> | null = null;
const textStream = new ReadableStream<string>({
  start(_controller) {
    controller = _controller;
  },
});

watchEffect(() => {
  if (props.code.length > index.value) {
    controller?.enqueue(props.code.slice(index.value));
    index.value = props.code.length;
  }
});

const stream = textStream.pipeThrough(
  new CodeToTokenTransformStream({
    highlighter: props.highlighter,
    lang: props.lang,
    theme: props.theme,
    allowRecalls: true,
  }),
);

// Stream consumer
let currentAbortController: AbortController | null = null;
watch(
  () => stream,
  (newStream) => {
    tokens.length = 0;
    if (currentAbortController) currentAbortController.abort();
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;
    let started = false;

    newStream
      .pipeTo(
        new WritableStream({
          write(token: any) {
            if (signal.aborted) return;
            if (!started) {
              started = true;
              emit("stream-start");
            }
            if ("recall" in token) {
              // recall is the number of tokens to remove from the end
              if (tokens.length >= token.recall) {
                tokens.length -= token.recall;
              } else {
                tokens.length = 0;
              }
            } else {
              tokens.push(token);
            }
          },
          close() {
            if (!signal.aborted) emit("stream-end");
          },
          abort() {
            if (!signal.aborted) emit("stream-end");
          },
        }),
        { signal },
      )
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });
  },
  { immediate: true },
);
</script>

<template>
  <pre
    class="shiki shiki-stream"
  ><code><span v-for="token in tokens" :key="objectId(token)" :style="token.htmlStyle || getTokenStyleObject(token)"><template v-for="(part, i) in parseLinks(token.content)" :key="i"><a v-if="part.type === 'link'" :href="part.content" target="_blank" rel="noopener noreferrer" class="hover:underline">{{ part.content }}</a><template v-else>{{ part.content }}</template></template></span></code></pre>
</template>
