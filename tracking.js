/**
 * Rentoule Projects - Attribution Tracking
 *
 * Responsibilities:
 * 1. Capture UTM params from URL on any page load
 * 2. Persist first-touch AND last-touch UTMs in localStorage
 * 3. Capture landing page, referrer, original URL
 * 4. Populate HubSpot form hidden fields when the form loads
 *
 * Strategy:
 * - First touch = the very first session this browser ever had (stored forever)
 * - Last touch = the most recent session's source (updated every visit with UTMs)
 * - Attribution window: first touch persists indefinitely until localStorage is cleared
 */

(function () {
  'use strict';

  var STORAGE_KEY_FIRST = 'rp_attribution_first';
  var STORAGE_KEY_LAST = 'rp_attribution_last';
  var STORAGE_KEY_SESSION = 'rp_session_start';

  /** Parse URL search params into an object */
  function parseQuery(search) {
    var params = {};
    var qs = (search || '').replace(/^\?/, '');
    if (!qs) return params;
    qs.split('&').forEach(function (pair) {
      var parts = pair.split('=');
      if (parts[0]) {
        try {
          params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
        } catch (e) {
          params[parts[0]] = parts[1] || '';
        }
      }
    });
    return params;
  }

  /** Detect organic source from referrer if no UTMs present */
  function inferSourceFromReferrer(referrer) {
    if (!referrer) return { source: 'direct', medium: '(none)' };
    var r = referrer.toLowerCase();
    if (r.indexOf('google.') !== -1) return { source: 'google', medium: 'organic' };
    if (r.indexOf('bing.') !== -1) return { source: 'bing', medium: 'organic' };
    if (r.indexOf('duckduckgo.') !== -1) return { source: 'duckduckgo', medium: 'organic' };
    if (r.indexOf('yahoo.') !== -1) return { source: 'yahoo', medium: 'organic' };
    if (r.indexOf('facebook.') !== -1 || r.indexOf('fb.') !== -1 || r.indexOf('l.facebook.com') !== -1) return { source: 'facebook', medium: 'referral' };
    if (r.indexOf('instagram.') !== -1 || r.indexOf('l.instagram.com') !== -1) return { source: 'instagram', medium: 'referral' };
    if (r.indexOf('linkedin.') !== -1) return { source: 'linkedin', medium: 'referral' };
    if (r.indexOf('youtube.') !== -1) return { source: 'youtube', medium: 'referral' };
    if (r.indexOf('t.co') !== -1 || r.indexOf('twitter.') !== -1 || r.indexOf('x.com') !== -1) return { source: 'twitter', medium: 'referral' };
    // AI engines commonly referring traffic
    if (r.indexOf('perplexity.') !== -1) return { source: 'perplexity', medium: 'ai_referral' };
    if (r.indexOf('chat.openai.') !== -1 || r.indexOf('chatgpt.com') !== -1) return { source: 'chatgpt', medium: 'ai_referral' };
    if (r.indexOf('claude.') !== -1) return { source: 'claude', medium: 'ai_referral' };
    if (r.indexOf('gemini.') !== -1 || r.indexOf('bard.') !== -1) return { source: 'gemini', medium: 'ai_referral' };
    if (r.indexOf('copilot.') !== -1) return { source: 'copilot', medium: 'ai_referral' };
    // Default to referral
    try {
      var host = new URL(referrer).hostname.replace(/^www\./, '');
      return { source: host, medium: 'referral' };
    } catch (e) {
      return { source: 'direct', medium: '(none)' };
    }
  }

  /** Build the attribution snapshot for this page load */
  function buildTouch() {
    var q = parseQuery(window.location.search);
    var hasUtm = !!(q.utm_source || q.utm_medium || q.utm_campaign);
    var inferred = inferSourceFromReferrer(document.referrer);

    return {
      utm_source: q.utm_source || inferred.source,
      utm_medium: q.utm_medium || inferred.medium,
      utm_campaign: q.utm_campaign || (hasUtm ? '' : '(none)'),
      utm_content: q.utm_content || '',
      utm_term: q.utm_term || '',
      landing_page: window.location.pathname + window.location.search,
      original_url: window.location.href,
      referrer: document.referrer || '(direct)',
      gclid: q.gclid || '',
      fbclid: q.fbclid || '',
      msclkid: q.msclkid || '',
      timestamp: new Date().toISOString(),
      has_utm: hasUtm
    };
  }

  function safeParse(str) {
    try { return JSON.parse(str); } catch (e) { return null; }
  }

  function saveAttribution() {
    try {
      var current = buildTouch();

      // First touch: only set once, ever
      if (!localStorage.getItem(STORAGE_KEY_FIRST)) {
        localStorage.setItem(STORAGE_KEY_FIRST, JSON.stringify(current));
      }

      // Last touch: overwrite if UTMs are present OR if referrer has changed meaningfully
      var existingLast = safeParse(localStorage.getItem(STORAGE_KEY_LAST));
      if (current.has_utm || !existingLast || existingLast.utm_source !== current.utm_source) {
        localStorage.setItem(STORAGE_KEY_LAST, JSON.stringify(current));
      }
    } catch (e) {
      // localStorage may be disabled - fail silently
    }
  }

  /** Populate HubSpot form hidden fields once the form is embedded */
  function populateHubSpotForm() {
    try {
      var first = safeParse(localStorage.getItem(STORAGE_KEY_FIRST)) || buildTouch();
      var last = safeParse(localStorage.getItem(STORAGE_KEY_LAST)) || first;

      // HubSpot embeds forms inside an iframe. Listen for the HubSpot message event.
      window.addEventListener('message', function (event) {
        if (event.data && event.data.type === 'hsFormCallback' && event.data.eventName === 'onFormReady') {
          fillFormFields(first, last);
        }
      });

      // Also try periodically for ~10 seconds in case the message was missed
      var attempts = 0;
      var interval = setInterval(function () {
        attempts++;
        if (fillFormFields(first, last) || attempts > 20) {
          clearInterval(interval);
        }
      }, 500);
    } catch (e) {
      // fail silently
    }
  }

  /**
   * Fill hidden fields on the HubSpot form iframe.
   * Returns true if any fields were successfully filled.
   */
  function fillFormFields(first, last) {
    var iframes = document.querySelectorAll('iframe.hs-form-iframe, iframe[id^="hs-form-iframe"]');
    if (!iframes.length) return false;

    var filledAny = false;

    iframes.forEach(function (iframe) {
      try {
        var doc = iframe.contentDocument || iframe.contentWindow.document;
        if (!doc) return;

        var mapping = {
          'rp_first_source': first.utm_source,
          'rp_first_medium': first.utm_medium,
          'rp_first_campaign': first.utm_campaign,
          'rp_first_content': first.utm_content,
          'rp_last_source': last.utm_source,
          'rp_last_medium': last.utm_medium,
          'rp_last_campaign': last.utm_campaign,
          'rp_last_content': last.utm_content,
          'rp_landing_page': first.landing_page,
          'rp_referrer': first.referrer,
          'rp_original_url': first.original_url,
          'rp_conversion_page': window.location.pathname,
          'rp_gclid': first.gclid || last.gclid,
          'rp_fbclid': first.fbclid || last.fbclid
        };

        Object.keys(mapping).forEach(function (name) {
          var field = doc.querySelector('input[name="' + name + '"]');
          if (field && mapping[name]) {
            field.value = mapping[name];
            // Trigger change event so HubSpot captures it
            var evt = doc.createEvent('Event');
            evt.initEvent('input', true, true);
            field.dispatchEvent(evt);
            filledAny = true;
          }
        });
      } catch (e) {
        // Cross-origin, ignore
      }
    });

    return filledAny;
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      saveAttribution();
      populateHubSpotForm();
    });
  } else {
    saveAttribution();
    populateHubSpotForm();
  }

  // Expose for debugging in console
  window.RPAttribution = {
    first: function () { return safeParse(localStorage.getItem(STORAGE_KEY_FIRST)); },
    last: function () { return safeParse(localStorage.getItem(STORAGE_KEY_LAST)); },
    clear: function () {
      localStorage.removeItem(STORAGE_KEY_FIRST);
      localStorage.removeItem(STORAGE_KEY_LAST);
    }
  };
})();
