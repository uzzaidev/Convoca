import type { CapacitorConfig } from "@capacitor/cli";

// CAPACITOR_PLATFORM=ios | android — setado nos scripts cap:sync:* e no CI iOS.
// No iOS, CapacitorHttp/CapacitorCookies quebram o login NextAuth: o fetch vai
// para o cookie jar nativo (HTTPCookieStorage) e a WKWebView usa outro store.
// Android funciona com os dois plugins ligados; iOS deve usar a WebView pura.
const platform = process.env.CAPACITOR_PLATFORM;
const isIosBuild = platform === "ios";

const config: CapacitorConfig = {
  appId: "com.uzzai.convoca",
  appName: "Convoca",
  webDir: "out",
  server: {
    url: "https://convoca.uzzai.com.br",
    cleartext: false,
  },
  android: {
    buildOptions: {
      releaseType: "AAB",
    },
  },
  ios: {
    scheme: "Convoca",
    contentInset: "automatic",
  },
  plugins: {
    CapacitorCookies: {
      enabled: !isIosBuild,
    },
    CapacitorHttp: {
      enabled: !isIosBuild,
    },
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#16a34a",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#16a34a",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
