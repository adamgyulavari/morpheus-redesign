/**
 * The Barion Pixel's base version, in the <head> of every page: Barion requires it of every shop (its
 * fraud prevention, on legitimate interest: no consent needed, no consent manager may block it).
 * Barion's own snippet, as published. `BARION_PIXEL_ID` (BP-<10 characters>-<2 digits>, different on
 * Barion's test and live systems) is read at runtime; without a valid one nothing is added.
 */
import Script from 'next/script';

const PIXEL_ID = /^BP-[0-9A-Za-z]{10}-\d{2}$/;

export default function BarionPixel() {
  const id = process.env.BARION_PIXEL_ID;
  if (!id || !PIXEL_ID.test(id)) return null;
  return (
    <>
      <Script id="barion-pixel" strategy="beforeInteractive">
        {`window["bp"] = window["bp"] || function () { (window["bp"].q = window["bp"].q || []).push(arguments); };
window["bp"].l = 1 * new Date();
var scriptElement = document.createElement("script");
var firstScript = document.getElementsByTagName("script")[0];
scriptElement.async = true;
scriptElement.src = "https://pixel.barion.com/bp.js";
firstScript.parentNode.insertBefore(scriptElement, firstScript);
window["barion_pixel_id"] = "${id}";
bp("init", "addBarionPixelId", window["barion_pixel_id"]);`}
      </Script>
      <noscript>
        {/* biome-ignore lint/performance/noImgElement: Barion's 1×1 pixel for visitors without JavaScript */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt="Barion Pixel"
          src={`https://pixel.barion.com/a.gif?ba_pixel_id='${id}'&ev=contentView&noscript=1`}
        />
      </noscript>
    </>
  );
}
