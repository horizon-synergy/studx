import { useEffect, useRef } from "react";
import s from "../styles/AdBanner.module.css";

const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || "";
const ENABLED = import.meta.env.VITE_ADSENSE_ENABLED === "true";

let scriptLoading = false;

function ensureAdSenseScript() {
  if (!CLIENT || typeof document === "undefined") return;
  if (document.querySelector(`script[data-ad-client="${CLIENT}"]`)) return;
  if (scriptLoading) return;
  scriptLoading = true;
  const el = document.createElement("script");
  el.async = true;
  el.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;
  el.crossOrigin = "anonymous";
  el.dataset.adClient = CLIENT;
  document.head.appendChild(el);
}

/**
 * Google AdSense unit. Requires:
 * - VITE_ADSENSE_ENABLED=true
 * - VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXX
 * - slot prop or VITE_ADSENSE_SLOT_FEED, created under THAT SAME pub ID
 *   (ad slot IDs are account-specific — a slot from an old AdSense account
 *   will silently fail against a new client ID)
 * Site must be verified & approved in AdSense.
 */
export default function GoogleAdSense({
  slot = import.meta.env.VITE_ADSENSE_SLOT_FEED || "",
  format = "auto",
  fullWidthResponsive = true,
  className = "",
}) {
  const insRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!ENABLED || !CLIENT || !slot) return;
    if (pushed.current) return; // guards against React StrictMode's double-invoke in dev
    if (insRef.current?.getAttribute("data-adsbygoogle-status")) return; // already has an ad
    pushed.current = true;
    ensureAdSenseScript();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.warn("AdSense push failed", err);
    }
  }, [slot]);

  if (!ENABLED || !CLIENT || !slot) {
    return (
      <div className={`${s.banner} ${className}`}>
        <div className={s.fallback}>
          <span className={s.fallbackIcon}>◈</span>
          <span>AdSense slot (not configured)</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${s.banner} ${className}`}
      style={{ minHeight: "12rem", padding: "0.5rem" }}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
      <span className={s.label} style={{ padding: "0.35rem 0.5rem" }}>
        Sponsored
      </span>
    </div>
  );
}

export function isAdSenseEnabled() {
  return ENABLED && Boolean(CLIENT);
}
