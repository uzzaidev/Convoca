import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { getMobilePlatform, isNativePlatform } from "./platform-detector";

let initialized = false;

/**
 * Salva o token FCM no backend (tabela push_tokens).
 * Android e iOS usam Firebase Messaging — o token e sempre FCM (nao APNs raw).
 */
async function savePushToken(token: string) {
  const platform = getMobilePlatform();

  if (platform !== "android" && platform !== "ios") {
    return;
  }

  const response = await fetch("/api/mobile/push-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      token,
      platform,
    }),
  });

  if (!response.ok) {
    console.error(
      "[mobile] Falha ao salvar token push",
      response.status,
      await response.text()
    );
  }
}

export async function initPushNotifications() {
  if (!isNativePlatform() || initialized) {
    return;
  }

  initialized = true;

  try {
    const currentPermission = await FirebaseMessaging.checkPermissions();
    const permission =
      currentPermission.receive === "granted"
        ? currentPermission
        : await FirebaseMessaging.requestPermissions();

    if (permission.receive !== "granted") {
      return;
    }

    // Token pode rotacionar — escuta atualizacoes
    await FirebaseMessaging.addListener("tokenReceived", (event) => {
      void savePushToken(event.token);
    });

    const { token } = await FirebaseMessaging.getToken();
    if (token) {
      await savePushToken(token);
    }
  } catch (error) {
    console.error("[mobile] Falha ao inicializar push notifications", error);
    initialized = false;
  }
}
