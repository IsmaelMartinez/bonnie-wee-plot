import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// Extend the global scope with Serwist types
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  // Precache entries injected by Serwist build
  precacheEntries: self.__SW_MANIFEST,
  // Take control immediately without waiting for page reload
  skipWaiting: true,
  // Claim all clients immediately
  clientsClaim: true,
  // Enable navigation preload for faster page loads
  navigationPreload: true,
  // Use default caching strategies from @serwist/next
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
