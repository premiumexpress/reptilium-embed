# Ticket Checkout Widget

A high-performance, SEO-friendly, "plug-and-play" JavaScript widget for embedding the Visit Venture event sale experience into any partner website.

## 🛠 Features

* **Shadow DOM Isolation:** Styles are encapsulated; host site CSS cannot leak in.
* **Idle-Load Logic:** Defers loading until the host page is idle to protect SEO (Core Web Vitals).
* **Priority Override:** Instant loading if the user clicks before the idle-load completes.
* **SPA Support:** Uses `MutationObserver` to detect triggers added dynamically to the DOM.
* **Zero Dependencies:** 100% Vanilla JavaScript.

## 📂 File Structure

* `/index.js`: The client-side library served via CDN.
* `/index.html`: (Example) How partner sites implement the trigger.

## 🔗 Partner Implementation

Partner websites simply include the script and tag any element.

```html
<script src="https://cdn.jsdelivr.net/gh/premiumexpress/reptilium-embed/index.js" async></script>

<button class="vv-widget-trigger" data-url="https://reptilium.io/events/[event-id]/tickets/buy">
    Register Now
</button>

```

## 🛠 Maintenance & SEO Notes

1. **Idle Loading:** We use `requestIdleCallback`. If the user clicks a button *before* idle, the script immediately kills the timer and triggers the load.
2. **Lighthouse Scores:** Because the iframe doesn't start loading until after the parent page's `load` event, it does not count against the host's LCP (Largest Contentful Paint).