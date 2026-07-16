import { NextResponse } from "next/server";

export async function GET() {
  const assetLinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.uzzai.convoca",
        sha256_cert_fingerprints: [
          "03:EB:03:BA:4E:A6:F9:7B:70:90:53:31:5C:23:66:FF:72:6D:42:0D:3C:01:F8:1B:4C:60:58:DA:4C:3F:29:A5",
        ],
      },
    },
  ];

  return new NextResponse(JSON.stringify(assetLinks, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
