// ── WebSocket client for the lobby + live games ─────────────────────────────
//
// A small singleton-ish helper. Caller subscribes via `subscribe(handler)` and
// sends typed messages with `send({type, ...})`. Auto-reconnects when the
// connection drops.

import { useEffect, useRef, useState } from "react";

let socket = null;
let listeners = new Set();
let openWaiters = [];
let reconnectTimer = null;
let pingTimer = null;

function notify(msg) {
  for (const fn of listeners) {
    try { fn(msg); } catch { /* ignore */ }
  }
}

function connect() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return socket;
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${proto}//${window.location.host}/ws`;
  try {
    socket = new WebSocket(url);
  } catch {
    scheduleReconnect();
    return null;
  }

  socket.onopen = () => {
    notify({ type: "_connection", state: "open" });
    while (openWaiters.length) {
      const { resolve } = openWaiters.shift();
      resolve();
    }
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = setInterval(() => {
      try { if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "ping" })); }
      catch { /* ignore */ }
    }, 30_000);
  };
  socket.onmessage = (e) => {
    let msg;
    try { msg = JSON.parse(e.data); } catch { return; }
    notify(msg);
  };
  socket.onerror = () => {
    notify({ type: "_connection", state: "error" });
  };
  socket.onclose = () => {
    notify({ type: "_connection", state: "closed" });
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
    socket = null;
    scheduleReconnect();
  };
  return socket;
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 1500);
}

export function disconnectWs() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
  if (socket) { try { socket.close(); } catch { /* ignore */ } socket = null; }
}

export function sendWs(msg) {
  const s = connect();
  if (!s) return;
  if (s.readyState === WebSocket.OPEN) {
    s.send(JSON.stringify(msg));
  } else {
    new Promise((resolve, reject) => {
      openWaiters.push({ resolve, reject });
      setTimeout(() => reject(new Error("ws_open_timeout")), 4000);
    }).then(() => {
      try { s.send(JSON.stringify(msg)); } catch { /* ignore */ }
    }).catch(() => { /* dropped */ });
  }
}

export function useWsMessages(handler) {
  const handlerRef = useRef(handler);
  useEffect(() => { handlerRef.current = handler; }, [handler]);
  useEffect(() => {
    const fn = (msg) => handlerRef.current?.(msg);
    listeners.add(fn);
    connect();
    return () => { listeners.delete(fn); };
  }, []);
}

export function useWsConnection() {
  const [state, setState] = useState("connecting");
  useWsMessages((msg) => {
    if (msg.type === "_connection") setState(msg.state);
  });
  useEffect(() => {
    connect();
  }, []);
  return state;
}
