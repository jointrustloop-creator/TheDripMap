/*!
 * TheDripMap Clinic Agent — embed shim (v1).
 *
 * Usage on a clinic's site:
 *
 *   <script async
 *     src="https://www.thedripmap.com/clinic-agent.js"
 *     data-clinic="your-clinic-slug"></script>
 *
 * What this does:
 *   1. Finds the <script> tag that loaded it and reads data-clinic="...".
 *   2. Drops a fixed-position iframe into the bottom-right corner.
 *   3. The iframe loads /embed/clinic-agent?clinic=<slug> on TheDripMap,
 *      which mounts the Drip Assistant in white-label mode.
 *
 * v1 is iframe-based — no React UMD bundle needed on the host page, the host
 * site doesn't have to know about Tailwind, Lucide, fonts, anything. We
 * iframe the whole widget so styles can't collide with the host site.
 *
 * v1.1 will postMessage the parent page URL down so the agent can know what
 * page the user is on (e.g. for treatment-specific conversations).
 */
(function () {
  // Already injected? Don't double-mount.
  if (window.__DRIPMAP_AGENT_EMBED__) return;
  window.__DRIPMAP_AGENT_EMBED__ = true;

  // Find the script tag that loaded us — try currentScript first, fall back
  // to the last script with our filename.
  var s = document.currentScript;
  if (!s) {
    var scripts = document.querySelectorAll('script[src*="clinic-agent.js"]');
    s = scripts[scripts.length - 1];
  }
  var slug = s && s.getAttribute('data-clinic');
  if (!slug) {
    console.warn('[TheDripMap] clinic-agent.js loaded without data-clinic="<slug>" — nothing to mount.');
    return;
  }

  // Pick the base origin to load the embed from. Defaults to the script's
  // own origin so a self-hosted version would also work.
  var origin = (function () {
    try {
      return new URL(s.src).origin;
    } catch (e) {
      return 'https://www.thedripmap.com';
    }
  })();

  var src = origin + '/embed/clinic-agent?clinic=' + encodeURIComponent(slug);

  // The iframe itself. The widget inside is fixed-position bottom-right, so
  // we let the iframe cover a corner large enough to hold it.
  function mount() {
    if (document.getElementById('dripmap-clinic-agent-frame')) return;
    var f = document.createElement('iframe');
    f.id = 'dripmap-clinic-agent-frame';
    f.src = src;
    f.title = 'Clinic chat assistant';
    f.allow = 'geolocation';
    f.setAttribute('loading', 'lazy');
    f.style.cssText = [
      'position:fixed',
      'bottom:0',
      'right:0',
      'width:430px',
      'height:720px',
      'max-width:100vw',
      'max-height:100vh',
      'border:0',
      'background:transparent',
      'z-index:2147483646',
      'color-scheme:normal',
      'pointer-events:auto'
    ].join(';');
    document.body.appendChild(f);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    mount();
  } else {
    document.addEventListener('DOMContentLoaded', mount);
  }
})();
