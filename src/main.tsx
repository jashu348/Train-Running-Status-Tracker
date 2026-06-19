import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Capture and suppress benign host-level WebSocket/HMR unhandled rejections or errors in the iframe environment
if (typeof window !== 'undefined') {
  const isWebSocketError = (msg: string) => {
    const lower = msg.toLowerCase();
    return (
      lower.includes('websocket') ||
      lower.includes('hmr') ||
      lower.includes('closed without opened') ||
      lower.includes('failed to connect')
    );
  };

  // Intercept and swallow WebSocket error states to prevent uncaught runtime events
  if (window.WebSocket) {
    const OriginalWebSocket = window.WebSocket;
    const SafeWebSocket = function(url: string | URL, protocols?: string | string[]) {
      try {
        const instance = new OriginalWebSocket(url, protocols);
        instance.addEventListener('error', (e) => {
          // Swallow connection-failure errors so they don't trigger global error events
          e.stopImmediatePropagation();
          e.preventDefault();
        });
        return instance;
      } catch (err) {
        // Safe mock fallback
        const mockSocket = new EventTarget() as any;
        mockSocket.close = () => {};
        mockSocket.send = () => {};
        mockSocket.readyState = 3; // CLOSED
        return mockSocket;
      }
    };
    SafeWebSocket.prototype = OriginalWebSocket.prototype;
    // Copy static constants
    SafeWebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    SafeWebSocket.OPEN = OriginalWebSocket.OPEN;
    SafeWebSocket.CLOSING = OriginalWebSocket.CLOSING;
    SafeWebSocket.CLOSED = OriginalWebSocket.CLOSED;
    
    try {
      Object.defineProperty(window, 'WebSocket', {
        value: SafeWebSocket,
        configurable: true,
        writable: true,
        enumerable: true
      });
    } catch (e) {
      console.warn('[HMR Mitigation] Could not redefine window.WebSocket via defineProperty:', e);
      try {
        (window as any).WebSocket = SafeWebSocket;
      } catch (err) {
        console.warn('[HMR Mitigation] Reassignment failed as well:', err);
      }
    }
  }

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || String(event.reason || '');
    if (isWebSocketError(reason)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (isWebSocketError(msg)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

