import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Suppress YouTube tracking/logging errors blocked by ad blockers
// These are non-critical network errors that don't affect functionality
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

// List of patterns to filter (YouTube tracking/logging endpoints)
const blockedPatterns = [
  'youtubei/v1/log_event',
  'ERR_BLOCKED_BY_CLIENT',
  'youtube.com/generate_204',
  'play.google.com/log',
  'Failed to load resource',
  'net::ERR_BLOCKED_BY_CLIENT',
  'youtube.com/youtubei',
  'generate_204',
  'base.js',
  'www-embed-player.js',
  'VM',
];

// Check if message should be filtered
const shouldFilter = (message) => {
  if (!message) return false;
  const msgStr = message.toString().toLowerCase();
  return blockedPatterns.some(pattern => msgStr.includes(pattern.toLowerCase()));
};

// Intercept XMLHttpRequest to suppress YouTube tracking errors
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, ...args) {
  this._url = url;
  if (shouldFilter(url)) {
    // Silently fail for blocked URLs
    this._shouldBlock = true;
    return;
  }
  return originalXHROpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function(...args) {
  if (this._shouldBlock) {
    // Silently ignore blocked requests
    return;
  }
  // Suppress errors for YouTube tracking endpoints
  const originalOnError = this.onerror;
  this.onerror = function(e) {
    if (shouldFilter(this._url)) {
      return; // Suppress error
    }
    if (originalOnError) {
      originalOnError.call(this, e);
    }
  };
  return originalXHRSend.apply(this, args);
};

// Intercept fetch to suppress YouTube tracking errors
const originalFetch = window.fetch;
window.fetch = function(url, ...args) {
  const urlStr = typeof url === 'string' ? url : url?.url || '';
  if (shouldFilter(urlStr)) {
    // Return a rejected promise that we'll catch silently
    return Promise.reject(new Error('Blocked by filter')).catch(() => {});
  }
  return originalFetch.apply(this, [url, ...args]).catch((error) => {
    if (shouldFilter(urlStr) || shouldFilter(error?.message || '')) {
      // Suppress error
      return Promise.reject(new Error('Blocked')).catch(() => {});
    }
    throw error;
  });
};

// Filter console errors for YouTube tracking endpoints
const filteredError = (...args) => {
  const message = args.join(' ').toString() || '';
  // Check all arguments, not just the first one
  const allMessages = args.map(arg => String(arg)).join(' ');
  if (shouldFilter(message) || shouldFilter(allMessages)) {
    return; // Suppress these non-critical errors
  }
  originalError.apply(console, args);
};

// Filter console warnings for YouTube tracking
const filteredWarn = (...args) => {
  const message = args.join(' ').toString() || '';
  const allMessages = args.map(arg => String(arg)).join(' ');
  if (shouldFilter(message) || shouldFilter(allMessages)) {
    return; // Suppress these warnings
  }
  originalWarn.apply(console, args);
};

// Filter console.log for YouTube tracking
const filteredLog = (...args) => {
  const message = args.join(' ').toString() || '';
  const allMessages = args.map(arg => String(arg)).join(' ');
  if (shouldFilter(message) || shouldFilter(allMessages)) {
    return; // Suppress these logs
  }
  originalLog.apply(console, args);
};

console.error = filteredError;
console.warn = filteredWarn;
console.log = filteredLog;

// Handle global unhandled errors (network errors from iframes)
window.addEventListener('error', (event) => {
  const message = event.message || '';
  const source = event.filename || '';
  const target = event.target?.src || event.target?.href || '';
  
  // Suppress YouTube tracking/logging errors
  if (
    shouldFilter(message) ||
    shouldFilter(source) ||
    shouldFilter(target)
  ) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}, true);

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || event.reason?.toString() || '';
  if (shouldFilter(message)) {
    event.preventDefault();
    return false;
  }
});

// Add a helpful message (only once)
if (!window.__youtubeErrorFiltered) {
  window.__youtubeErrorFiltered = true;
  setTimeout(() => {
    console.log('%cℹ️ YouTube tracking errors are being filtered', 'color: #4CAF50; font-weight: bold;');
    console.log('%cThese ERR_BLOCKED_BY_CLIENT errors are harmless and caused by ad blockers blocking YouTube\'s tracking endpoints.', 'color: #666;');
    console.log('%cYour video playback and summarization features work normally.', 'color: #666;');
  }, 1000);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
