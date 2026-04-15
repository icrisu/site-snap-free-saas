"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY =
  process.env.NEXT_PUBLIC_CONSENT_COOKIE_KEY ?? "sitesnap-consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    } else if (stored === "granted") {
      window.gtag("consent", "update", {
        ad_storage: "granted",
        analytics_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    }
  }, []);

  if (!visible) return null;

  function handleAccept() {
    localStorage.setItem(CONSENT_KEY, "granted");
    window.gtag("consent", "update", {
      ad_storage: "granted",
      analytics_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
    window.dataLayer.push({ event: "consent_update" });
    setVisible(false);
  }

  function handleDecline() {
    localStorage.setItem(CONSENT_KEY, "denied");
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-background border-t border-border px-6 py-4 text-sm shadow-lg">
      <p className="text-foreground/80">
        We use cookies to improve your experience and for analytics. You can
        accept or decline non-essential cookies.
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={handleDecline}
          className="rounded-md border border-border px-4 py-2 text-foreground/70 hover:bg-muted transition-colors"
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
