/**
 * Android Asset Links — App Links HTTPS
 *
 * O Android faz GET nessa URL para verificar que o app pode
 * interceptar links https://convoca.uzzai.com.br/*.
 *
 * SHA-256 do keystore de produção (gerado em 2026-06):
 *   03:EB:03:BA:...:29:A5  (ver docs/mobile-convoca/CHECKLIST.md)
 *
 * Documentação: https://developer.android.com/training/app-links/verify-android-applinks
 */
export async function GET() {
  const assetlinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.uzzai.convoca",
        sha256_cert_fingerprints: [
          // SHA-256 do certificado de release — keystore: android/app/release.keystore, alias: convoca
          // Gerado em 2026-06-19 (SHA384withRSA, 2048-bit RSA, válido até 2053-11-04)
          // Obter novamente com: keytool -list -v -keystore android/app/release.keystore -alias convoca
          "03:EB:03:BA:4E:A6:F9:7B:70:90:53:31:5C:23:66:FF:72:6D:42:0D:3C:01:F8:1B:4C:60:58:DA:4C:3F:29:A5",
        ],
      },
    },
  ];

  return new Response(JSON.stringify(assetlinks, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
