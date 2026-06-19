import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.convoca.app",
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
      enabled: true,
    },
    CapacitorHttp: {
      enabled: true,
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
