import { useState, useEffect } from "react";

export type DeviceType = "ios" | "android" | "desktop";

/** Detect device type for PWA install instructions */
export function useDevice(): DeviceType {
  const [device, setDevice] = useState<DeviceType>("desktop");

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || "";
    const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);

    if (isIOS) setDevice("ios");
    else if (isAndroid) setDevice("android");
    else setDevice("desktop");
  }, []);

  return device;
}

/** Check if app is already running as installed PWA */
export function useIsStandalone(): boolean {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");
    setStandalone(isStandalone);
  }, []);

  return standalone;
}
