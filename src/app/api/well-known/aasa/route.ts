import { NextResponse } from "next/server";

export async function GET() {
  const aasa = {
    applinks: {
      details: [
        {
          appIDs: ["2YRXNXGL8K.com.uzzai.convoca"],
          components: [
            { "/": "/invite/*" },
            { "/": "/groups/join*" },
          ],
        },
      ],
    },
  };

  return new NextResponse(JSON.stringify(aasa, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
