/**
 * Stub para builds web (Vercel). Push roda só no shell nativo Capacitor;
 * o plugin real exige firebase/messaging e quebra o bundle Next.js.
 */
export const FirebaseMessaging = {
  checkPermissions: async () => ({ receive: "denied" as const }),
  requestPermissions: async () => ({ receive: "denied" as const }),
  addListener: async () => ({ remove: async () => undefined }),
  getToken: async () => ({ token: "" }),
};
