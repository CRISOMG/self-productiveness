import { ref, onMounted, onUnmounted } from "vue";
import { useNetwork } from "@vueuse/core";

export interface QueuedRequest {
  id: string; // ID assigned by Workbox in IndexedDB
  queueName: string;
  requestData: {
    url: string;
    method: string;
    body?: ArrayBuffer | Blob;
  };
  timestamp: number;
}

export function useOfflineSync() {
  const { isOnline } = useNetwork();
  const pendingOperations = ref<QueuedRequest[]>([]);
  let intervalId: any;

  const fetchQueue = async () => {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = window.indexedDB.open("workbox-background-sync");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      if (!db.objectStoreNames.contains("requests")) {
        pendingOperations.value = [];
        return;
      }

      const transaction = db.transaction("requests", "readonly");
      const store = transaction.objectStore("requests");

      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        pendingOperations.value = getAllRequest.result.filter(
          (item: any) => item.queueName === "pomodoro-sync-queue",
        );
      };
    } catch (err) {
      console.warn("Could not fetch offline sync queue from IndexedDB", err);
    }
  };

  onMounted(() => {
    fetchQueue();
    intervalId = setInterval(fetchQueue, 5000);

    window.addEventListener("online", fetchQueue);
    window.addEventListener("offline", fetchQueue);
  });

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
    window.removeEventListener("online", fetchQueue);
    window.removeEventListener("offline", fetchQueue);
  });

  return {
    isOnline,
    pendingOperations,
    fetchQueue,
  };
}
