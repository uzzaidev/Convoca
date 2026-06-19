import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { isNativePlatform } from "./platform-detector";

const CONVOCA_GREEN = "#16a34a";

function routeFromDeepLink(event: URLOpenListenerEvent) {
  const url = new URL(event.url);

  if (url.protocol === "convoca:") {
    const path = url.hostname ? `/${url.hostname}${url.pathname}` : url.pathname;
    return `${path}${url.search}${url.hash}`;
  }

  if (url.hostname === "convoca.uzzai.com.br" || url.hostname === "convoca.app") {
    return `${url.pathname}${url.search}${url.hash}`;
  }

  return null;
}

export async function initNativeShell() {
  if (!isNativePlatform()) {
    return;
  }

  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setBackgroundColor({ color: CONVOCA_GREEN });
  await SplashScreen.hide();

  await App.addListener("appUrlOpen", (event) => {
    const route = routeFromDeepLink(event);

    if (route) {
      window.location.assign(route);
    }
  });
}
