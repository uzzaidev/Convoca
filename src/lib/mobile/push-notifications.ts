import { PushNotifications, type Token } from "@capacitor/push-notifications";
import { getMobilePlatform, isNativePlatform } from "./platform-detector";

let initialized = false;

async function savePushToken(token: Token) {
  const platform = getMobilePlatform();

  if (platform !== "android" && platform !== "ios") {
    return;
  }

  await fetch("/api/mobile/push-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: token.value,
      platform,
    }),
  });
}

export async function initPushNotifications() {
  if (!isNativePlatform() || initialized) {
    return;
  }

  initialized = true;

  const currentPermission = await PushNotifications.checkPermissions();
  const permission =
    currentPermission.receive === "granted"
      ? currentPermission
      : await PushNotifications.requestPermissions();

  if (permission.receive !== "granted") {
    return;
  }

  await PushNotifications.addListener("registration", savePushToken);
  await PushNotifications.addListener("registrationError", (error) => {
    console.error("[mobile] Push registration failed", error);
  });

  await PushNotifications.register();
}
