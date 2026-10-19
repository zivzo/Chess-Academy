import test from "node:test";
import assert from "node:assert/strict";
import { adsTxt, googleConfig, readConsent, requestAd, trackPage } from "../web/src/utils/googleServices.js";

function browser(t) {
  const scripts = new Map();
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  globalThis.window = { location: { origin: "https://chess.example", pathname: "/" } };
  globalThis.document = {
    getElementById: id => scripts.get(id),
    createElement: () => ({
      addEventListener() {},
      removeEventListener() {},
    }),
    head: { appendChild: script => scripts.set(script.id, script) },
  };
  t.after(() => {
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
  });
  return scripts;
}

test("Google settings default to disabled and reject malformed IDs", () => {
  assert.deepEqual(googleConfig({}), { analyticsId: "", adsClient: "", leftSlot: "", rightSlot: "", inlineSlot: "" });
  assert.deepEqual(googleConfig({
    VITE_GA_ID: 'G-test<script>', VITE_ADSENSE_CLIENT_ID: "ca-pub-fake",
    VITE_ADSENSE_LEFT_SLOT: "invalid", VITE_ADSENSE_RIGHT_SLOT: "-1", VITE_ADSENSE_INLINE_SLOT: "1 2",
  }), googleConfig({}));
  assert.equal(googleConfig({ VITE_ADSENSE_INLINE_SLOT: "1234567890" }).inlineSlot, "1234567890");
  assert.equal(googleConfig({ VITE_GA_ID: "G-ABC123" }).analyticsId, "G-ABC123");
  assert.equal(googleConfig({ VITE_ADSENSE_CLIENT_ID: "ca-pub-1234567890123456" }).adsClient,
    "ca-pub-1234567890123456");
});

test("ads.txt is generated only for a valid publisher ID", () => {
  assert.equal(adsTxt(googleConfig({})), "");
  assert.equal(adsTxt(googleConfig({ VITE_ADSENSE_CLIENT_ID: "ca-pub-fake" })), "");
  assert.equal(adsTxt(googleConfig({ VITE_ADSENSE_CLIENT_ID: "ca-pub-1234567890123456" })),
    "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n");
});

test("privacy defaults to no consent when storage is missing, corrupt or blocked", t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  });
  for (const value of [null, "{", "{}", '{"analytics":"true","ads":true}']) {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true, value: { getItem: () => value },
    });
    assert.equal(readConsent(), null);
  }
  globalThis.localStorage.getItem = () => { throw new Error("blocked"); };
  assert.equal(readConsent(), null);
  globalThis.localStorage.getItem = () => '{"analytics":true,"ads":false}';
  assert.deepEqual(readConsent(), { analytics: true, ads: false });
});

test("analytics is disabled without an ID and loads once with manual section views", t => {
  const scripts = browser(t);
  trackPage(googleConfig({}), "home", "Home");
  assert.equal(scripts.size, 0);
  const config = googleConfig({ VITE_GA_ID: "G-ABC123" });
  trackPage(config, "home", "Home");
  trackPage(config, "openings/london", "London");
  assert.equal(scripts.size, 1);
  assert.equal(window.dataLayer.filter(args => args[0] === "config").length, 1);
  const views = window.dataLayer.filter(args => args[0] === "event");
  assert.equal(views.length, 2);
  assert.equal(views[1][2].page_location, "https://chess.example/#openings/london");
  assert.equal(window.dataLayer.find(args => args[0] === "config")[2].send_page_view, false);
});

test("withdrawal URL override denies stale stored consent", t => {
  browser(t);
  window.location.search = "?privacy=denied";
  assert.deepEqual(readConsent(), { analytics: false, ads: false });
});

test("ads skip disconnected, hidden and cancelled slots and do not initialize twice", t => {
  const scripts = browser(t);
  const config = googleConfig({ VITE_ADSENSE_CLIENT_ID: "ca-pub-1234567890123456" });
  const element = { isConnected: false, dataset: {}, getBoundingClientRect: () => ({ width: 160 }) };
  requestAd(googleConfig({}), element);
  assert.equal(scripts.size, 0);
  requestAd(config, element);
  assert.equal(window.adsbygoogle, undefined);
  element.isConnected = true;
  element.getBoundingClientRect = () => ({ width: 0 });
  requestAd(config, element);
  assert.equal(window.adsbygoogle, undefined);
  element.getBoundingClientRect = () => ({ width: 160 });
  requestAd(config, element, () => false);
  assert.equal(window.adsbygoogle, undefined);
  requestAd(config, element);
  requestAd(config, element);
  assert.equal(window.adsbygoogle.length, 1);
  assert.equal(scripts.size, 1);
});
