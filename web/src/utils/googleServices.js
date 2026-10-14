export const CONSENT_KEY = "chess-academy-privacy";

export function readConsent() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONSENT_KEY));
    if (typeof saved?.analytics === "boolean" && typeof saved?.ads === "boolean") {
      return saved;
    }
  } catch {
    // Storage may be unavailable in private browsing.
  }
  return null;
}

export function googleConfig(env) {
  return {
    analyticsId: /^G-[A-Z0-9]+$/.test(env.VITE_GA_ID || "") ? env.VITE_GA_ID : "",
    adsClient: /^ca-pub-\d{16}$/.test(env.VITE_ADSENSE_CLIENT_ID || "") ? env.VITE_ADSENSE_CLIENT_ID : "",
    leftSlot: /^\d+$/.test(env.VITE_ADSENSE_LEFT_SLOT || "") ? env.VITE_ADSENSE_LEFT_SLOT : "",
    rightSlot: /^\d+$/.test(env.VITE_ADSENSE_RIGHT_SLOT || "") ? env.VITE_ADSENSE_RIGHT_SLOT : "",
  };
}

function loadScript(id, src) {
  const existing = document.getElementById(id);
  if (existing) return existing;
  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = true;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
  return script;
}

export function trackPage(config, page, title) {
  if (!config.analyticsId) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  if (!document.getElementById("google-analytics")) {
    window.gtag("js", new Date());
    window.gtag("config", config.analyticsId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    loadScript("google-analytics", `https://www.googletagmanager.com/gtag/js?id=${config.analyticsId}`);
  }
  window.gtag("event", "page_view", {
    page_title: title,
    page_location: `${window.location.origin}${window.location.pathname}#${page}`,
    page_path: `${window.location.pathname}#${page}`,
    send_to: config.analyticsId,
  });
}

export function requestAd(config, element, isActive = () => true) {
  if (!config.adsClient || !element || element.dataset.requested) return;
  const script = loadScript("google-adsense",
    `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adsClient}`);
  const push = () => {
    if (!isActive() || !element.isConnected || !element.getBoundingClientRect().width || element.dataset.requested) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      element.dataset.requested = "true";
    } catch {
      // Ad blockers and unapproved accounts must not interrupt chess.
    }
  };
  script.addEventListener("load", push, { once: true });
  push();
  return () => script.removeEventListener("load", push);
}
