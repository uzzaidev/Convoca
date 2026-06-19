import { Capacitor } from "@capacitor/core";

export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

export function isAndroid() {
  return Capacitor.getPlatform() === "android";
}

export function isIOS() {
  return Capacitor.getPlatform() === "ios";
}

export function getMobilePlatform() {
  const platform = Capacitor.getPlatform();

  if (platform === "android" || platform === "ios") {
    return platform;
  }

  return "web";
}
