import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  ANDROID_PLAY_STORE_URL,
  IOS_APP_STORE_URL,
} from "@/lib/mobile/store-urls";

export const dynamic = "force-dynamic";

const FALLBACK_URL = "https://convoca.uzzai.com.br/produto-convoca";

export default async function DownloadPage() {
  const headersList = await headers();
  const ua = headersList.get("user-agent") ?? "";

  if (/iPad|iPhone|iPod/i.test(ua)) {
    redirect(IOS_APP_STORE_URL);
  } else if (/Android/i.test(ua)) {
    redirect(ANDROID_PLAY_STORE_URL);
  } else {
    redirect(FALLBACK_URL);
  }
}
