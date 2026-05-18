import type { CleverPrintApi } from '../preload';

declare global {
  interface Window {
    cleverPrint: CleverPrintApi;
  }
}

export {};
