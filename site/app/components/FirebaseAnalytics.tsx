"use client";

import { useEffect } from "react";

const firebaseConfig = {
  apiKey: "AIzaSyAynhszga9XBlNn4q6GUIOZF4EyVFFGlWE",
  authDomain: "reducepdfsize.firebaseapp.com",
  projectId: "reducepdfsize",
  storageBucket: "reducepdfsize.firebasestorage.app",
  messagingSenderId: "338330750282",
  appId: "1:338330750282:web:597407194933ebc5ac85b3",
  measurementId: "G-BGHK5Q8Z3R",
};

type IdleWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions,
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

export function FirebaseAnalytics() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    let cancelled = false;
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;
    const idleWindow = window as IdleWindow;

    const initialize = async () => {
      try {
        const [{ getApp, getApps, initializeApp }, analyticsModule] =
          await Promise.all([
            import("firebase/app"),
            import("firebase/analytics"),
          ]);

        if (cancelled || !(await analyticsModule.isSupported())) {
          return;
        }

        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        analyticsModule.getAnalytics(app);
      } catch {
        // Analytics must never interrupt the PDF tool if loading is blocked.
      }
    };

    const schedule = () => {
      if (idleWindow.requestIdleCallback) {
        idleHandle = idleWindow.requestIdleCallback(
          () => void initialize(),
          { timeout: 5_000 },
        );
        return;
      }

      timeoutHandle = window.setTimeout(() => void initialize(), 3_000);
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      if (idleHandle !== undefined) {
        idleWindow.cancelIdleCallback?.(idleHandle);
      }
      if (timeoutHandle !== undefined) {
        window.clearTimeout(timeoutHandle);
      }
    };
  }, []);

  return null;
}
