"use client";

import { useEffect } from "react";

const IOS_URL = "https://apps.apple.com/app/id6783026571";
const ANDROID_URL = "https://play.google.com/store/apps/details?id=com.uzzai.convoca";
const FALLBACK_URL = "https://convoca.uzzai.com.br/produto-convoca";

export default function DownloadPage() {
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      window.location.replace(IOS_URL);
    } else if (/Android/.test(ua)) {
      window.location.replace(ANDROID_URL);
    } else {
      window.location.replace(FALLBACK_URL);
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <p style={{ color: "#6b7280", fontSize: 14 }}>Redirecionando...</p>
    </div>
  );
}
