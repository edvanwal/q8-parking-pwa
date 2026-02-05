# PWA Cross-Platform Best Practices Guide

## Q8 Parking App - Complete Implementation Plan

**Last Updated:** February 1, 2026  
**Status:** Implementation Required

---

## Executive Summary

This guide provides a comprehensive plan to ensure the Q8 Parking PWA displays correctly across all devices, platforms, and browsers, including Android, iOS, desktop browsers, and exotic variants.

---

## 1. Icon System (CRITICAL - Currently Missing)

### Current State

- ❌ Only has `favicon.ico` (64x64, 32x32, 24x24, 16x16)
- ❌ No proper PWA icons
- ❌ No maskable icons for Android
- ❌ No iOS touch icons

### Required Icon Sizes

Create icons in the following sizes:

```
icons/
├── icon-48x48.png       # Android small
├── icon-72x72.png       # Android medium
├── icon-96x96.png       # Android large
├── icon-144x144.png     # iOS small
├── icon-168x168.png     # iOS medium
├── icon-192x192.png     # Android baseline (REQUIRED)
├── icon-256x256.png     # Windows
├── icon-384x384.png     # Android extra large
├── icon-512x512.png     # Android splash (REQUIRED)
├── icon-1024x1024.png   # iOS App Store / Source
├── maskable-192x192.png # Android adaptive (REQUIRED)
├── maskable-512x512.png # Android adaptive large (REQUIRED)
└── apple-touch-icon.png # iOS home screen (180x180)
```

### Design Specifications

**Standard Icons:**

- Use transparent background
- Center the Q8 logo
- Ensure logo is clearly visible at smallest size (48x48)
- Use PNG format with transparency

**Maskable Icons (Android):**

- Create 10% safe zone padding on all sides
- Place important content in center 80%
- Test with circular, rounded square, and squircle masks
- Background should be solid color (Q8 blue: #003D6B)

**Apple Touch Icon:**

- 180x180px PNG
- No transparency (use white or Q8 blue background)
- No rounded corners (iOS adds them automatically)

### Icon Creation Tool Recommendations

```bash
# Option 1: Use PWA Asset Generator (Automated)
npm install -g pwa-asset-generator
pwa-asset-generator logo-source.png ./public/icons --background "#003D6B" --maskable true

# Option 2: Use RealFaviconGenerator.net (Web-based)
# Upload your 1024x1024 source image
# Download complete package

# Option 3: Manual creation with ImageMagick
convert logo-source.png -resize 192x192 -background transparent icon-192x192.png
```

---

## 2. Enhanced Web App Manifest

### Current Manifest Issues

- ❌ No icons array (critical failure)
- ❌ Missing description
- ❌ Missing categories
- ❌ No screenshots
- ❌ Basic configuration only

### Complete Manifest Configuration

Replace `public/manifest.webmanifest` with:

```json
{
  "name": "Q8 Liberty Parking",
  "short_name": "Q8 Parking",
  "description": "Smart parking management for Q8 Liberty card holders. Find zones, manage plates, and track parking history.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#003D6B",
  "categories": ["business", "utilities", "productivity"],
  "lang": "en",
  "dir": "ltr",

  "icons": [
    {
      "src": "/icons/icon-48x48.png",
      "sizes": "48x48",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-168x168.png",
      "sizes": "168x168",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-256x256.png",
      "sizes": "256x256",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],

  "screenshots": [
    {
      "src": "/screenshots/map-view.png",
      "sizes": "1170x2532",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Map view with parking zones"
    },
    {
      "src": "/screenshots/zone-details.png",
      "sizes": "1170x2532",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Zone details and pricing"
    }
  ],

  "shortcuts": [
    {
      "name": "Start Parking",
      "short_name": "Park",
      "description": "Quickly start a parking session",
      "url": "/?action=start",
      "icons": [
        {
          "src": "/icons/shortcut-parking.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "View History",
      "short_name": "History",
      "url": "/?view=history",
      "icons": [
        {
          "src": "/icons/shortcut-history.png",
          "sizes": "96x96"
        }
      ]
    }
  ],

  "prefer_related_applications": false
}
```

---

## 3. iOS-Specific Optimizations

### Required Meta Tags

Add to `<head>` section in `public/index.html`:

```html
<!-- iOS-Specific Meta Tags -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Q8 Parking" />

<!-- Apple Touch Icons -->
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
<link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />

<!-- iOS Splash Screens (Optional but recommended) -->
<!-- iPhone 14 Pro Max -->
<link
  rel="apple-touch-startup-image"
  media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
  href="/splash/iphone-14-pro-max.png"
/>

<!-- iPhone 14 Pro -->
<link
  rel="apple-touch-startup-image"
  media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
  href="/splash/iphone-14-pro.png"
/>

<!-- iPhone 14 -->
<link
  rel="apple-touch-startup-image"
  media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
  href="/splash/iphone-14.png"
/>

<!-- iPhone SE -->
<link
  rel="apple-touch-startup-image"
  media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
  href="/splash/iphone-se.png"
/>

<!-- iPad Pro 12.9" -->
<link
  rel="apple-touch-startup-image"
  media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
  href="/splash/ipad-pro-12.9.png"
/>
```

### iOS-Specific CSS Considerations

Your current viewport is good, but verify these settings:

```css
/* Already in your design-system.css - VERIFY these work */
:root {
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 20px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
}

/* Apply to all fixed/absolute positioned elements */
.top-bar {
  padding-top: var(--safe-area-top);
}

.bottom-nav {
  padding-bottom: var(--safe-area-bottom);
}
```

---

## 4. Responsive Design Validation

### Current Viewport Configuration

Your current viewport is GOOD but can be improved:

**Current:**

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
/>
```

**Recommendation:**

```html
<!-- Remove user-scalable=no for accessibility -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

**Note:** `user-scalable=no` is considered bad for accessibility. Only use if absolutely required for your app's UX.

### Breakpoint Strategy

Your app uses a mobile-first approach with max-width constraint:

```css
#app {
  width: 100%;
  max-width: 480px; /* Mobile first constraint */
  height: 100%;
}
```

**Recommended Breakpoints:**

```css
/* Small phones (320px - 374px) */
@media (max-width: 374px) {
  .btn-lg {
    font-size: 0.95rem;
  }
  .page-title {
    font-size: 1rem;
  }
}

/* Standard phones (375px - 428px) */
/* Your default styles - no media query needed */

/* Large phones (429px - 480px) */
@media (min-width: 429px) {
  .login-container {
    max-width: 420px;
  }
}

/* Tablets and Desktop (481px+) */
@media (min-width: 481px) {
  #app {
    box-shadow: 0 0 60px rgba(0, 0, 0, 0.15);
    border-radius: 16px;
  }

  /* Center content better on large screens */
  .content {
    max-width: 600px;
    margin: 0 auto;
  }
}

/* Landscape mode */
@media (orientation: landscape) and (max-height: 500px) {
  .top-bar {
    height: 56px;
  }
  .bottom-nav {
    height: 60px;
  }
  .login-logo-img {
    height: 80px;
  }
}
```

### Touch Target Sizes

Verify all interactive elements meet minimum touch targets:

```css
/* Minimum touch target: 44x44px (iOS) or 48x48px (Android) */
.btn {
  min-height: 48px;
}
.icon-btn {
  min-width: 44px;
  min-height: 44px;
}
.nav-item {
  min-height: 48px;
}
```

---

## 5. Platform Detection & Adaptive Features

### JavaScript Detection Utilities

Create `public/platform-detection.js`:

```javascript
/**
 * Platform Detection Utilities
 * Detect device type, OS, and PWA installation status
 */

const PlatformDetection = {
  // Detect if running as installed PWA
  isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true || // iOS Safari
      document.referrer.includes('android-app://')
    ); // Android TWA
  },

  // Detect iOS
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  },

  // Detect Android
  isAndroid() {
    return /Android/.test(navigator.userAgent);
  },

  // Detect Safari
  isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  },

  // Detect Chrome/Chromium
  isChrome() {
    return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  },

  // Get device type
  getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      )
    ) {
      return 'mobile';
    }
    return 'desktop';
  },

  // Get OS name
  getOS() {
    const ua = navigator.userAgent;
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Win/.test(ua)) return 'Windows';
    if (/Mac/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown';
  },

  // Check if installable
  canInstall() {
    return 'BeforeInstallPromptEvent' in window;
  },

  // Get viewport dimensions
  getViewport() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  },

  // Check for notch/safe areas
  hasNotch() {
    const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue(
      '--safe-area-top'
    );
    return safeAreaTop !== '0px' && safeAreaTop !== '';
  },

  // Log platform info (for debugging)
  logInfo() {
    console.group('🔍 Platform Detection');
    console.log('Standalone:', this.isStandalone());
    console.log('OS:', this.getOS());
    console.log('Device Type:', this.getDeviceType());
    console.log('iOS:', this.isIOS());
    console.log('Android:', this.isAndroid());
    console.log('Viewport:', this.getViewport());
    console.log('Has Notch:', this.hasNotch());
    console.log('Can Install:', this.canInstall());
    console.groupEnd();
  },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlatformDetection;
}
```

### Usage in app.js

```javascript
// Add to public/app.js initialization

// Detect platform and apply adaptive features
document.addEventListener('DOMContentLoaded', () => {
  // Log platform info (remove in production)
  if (window.location.hostname === 'localhost') {
    PlatformDetection.logInfo();
  }

  // Apply platform-specific classes
  const platform = PlatformDetection.getOS();
  const deviceType = PlatformDetection.getDeviceType();
  document.body.classList.add(`platform-${platform.toLowerCase()}`);
  document.body.classList.add(`device-${deviceType}`);

  if (PlatformDetection.isStandalone()) {
    document.body.classList.add('standalone');
  }

  // iOS-specific adjustments
  if (PlatformDetection.isIOS()) {
    // Prevent pull-to-refresh on iOS
    document.body.addEventListener(
      'touchmove',
      (e) => {
        if (e.target === document.body) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    // Fix iOS input zoom
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta && window.innerWidth < 768) {
      // Prevent zoom on input focus
      document.querySelectorAll('input, textarea, select').forEach((input) => {
        input.addEventListener('focus', () => {
          viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
        });
        input.addEventListener('blur', () => {
          viewportMeta.content = 'width=device-width, initial-scale=1.0';
        });
      });
    }
  }

  // Android-specific adjustments
  if (PlatformDetection.isAndroid()) {
    // Android Chrome address bar handling
    let lastScrollY = 0;
    window.addEventListener(
      'scroll',
      () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY) {
          // Scrolling down - hide address bar
          document.body.classList.add('scrolling-down');
        } else {
          // Scrolling up
          document.body.classList.remove('scrolling-down');
        }
        lastScrollY = currentScrollY;
      },
      { passive: true }
    );
  }
});
```

---

## 6. Testing Strategy

### Device Testing Matrix

**Priority 1 - Must Test:**

- ✅ iPhone 14 Pro (iOS 17+) - Safari
- ✅ iPhone SE (iOS 16+) - Safari
- ✅ Samsung Galaxy S23 (Android 13+) - Chrome
- ✅ Google Pixel 7 (Android 14+) - Chrome
- ✅ iPad Air (iPadOS 17+) - Safari

**Priority 2 - Should Test:**

- ⚠️ OnePlus 11 (Android 13+) - Chrome
- ⚠️ Xiaomi 13 (Android 13+) - Chrome
- ⚠️ iPhone 12 (iOS 16+) - Safari
- ⚠️ Samsung Galaxy Tab S8 - Chrome

**Priority 3 - Nice to Test:**

- 🔹 Desktop Chrome (Windows/Mac)
- 🔹 Desktop Firefox (Windows/Mac)
- 🔹 Desktop Edge (Windows)
- 🔹 Desktop Safari (macOS)

### Browser Testing Tools

**Remote Device Testing:**

```bash
# BrowserStack (Recommended)
https://www.browserstack.com/

# LambdaTest
https://www.lambdatest.com/

# Sauce Labs
https://saucelabs.com/
```

**Local Testing:**

```bash
# Chrome DevTools Device Emulation
1. Open Chrome DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Select device from dropdown
4. Test different screen sizes

# Firefox Responsive Design Mode
1. Open Firefox DevTools (F12)
2. Click "Responsive Design Mode" (Ctrl+Shift+M)
3. Test various viewports

# Safari Responsive Design Mode (macOS)
1. Open Safari Developer Tools
2. Enter Responsive Design Mode
3. Test iOS devices
```

**PWA Testing Tools:**

```bash
# Lighthouse PWA Audit
1. Open Chrome DevTools
2. Go to "Lighthouse" tab
3. Select "Progressive Web App"
4. Run audit

# PWA Builder
https://www.pwabuilder.com/
# Upload your manifest and test

# Manifest Validator
https://manifest-validator.appspot.com/
```

### Testing Checklist

**Visual Testing:**

- [ ] All text is readable (no truncation)
- [ ] Images scale properly
- [ ] Buttons are properly sized (min 44x44px)
- [ ] No horizontal scrolling
- [ ] Safe areas respected (notches, rounded corners)
- [ ] Colors match design system
- [ ] Icons render correctly

**Functional Testing:**

- [ ] Touch targets work on all devices
- [ ] Gestures work (swipe, pinch, tap)
- [ ] Keyboard appears correctly on input focus
- [ ] Orientation changes handled gracefully
- [ ] Back button works (Android)
- [ ] Pull-to-refresh disabled where needed
- [ ] Offline functionality works

**Performance Testing:**

- [ ] App loads in < 3 seconds
- [ ] Smooth scrolling (60fps)
- [ ] No layout shifts (CLS < 0.1)
- [ ] Touch response < 100ms
- [ ] Map renders smoothly

**Installation Testing:**

- [ ] Install prompt appears (Android Chrome)
- [ ] Add to Home Screen works (iOS Safari)
- [ ] App icon displays correctly
- [ ] Splash screen shows (if configured)
- [ ] App opens in standalone mode
- [ ] Status bar styled correctly

---

## 7. Common Issues & Solutions

### Issue 1: Icons Not Showing on Android

**Symptoms:**

- White square icon on home screen
- Generic PWA icon in app drawer

**Solution:**

```json
// Ensure manifest has proper icons array
{
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Issue 2: iOS Add to Home Screen Not Working

**Symptoms:**

- Share button doesn't show "Add to Home Screen"
- App doesn't open in standalone mode

**Solution:**

```html
<!-- Add these meta tags -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
```

### Issue 3: Layout Breaks on Small Screens

**Symptoms:**

- Content overflows
- Buttons too large
- Text truncated

**Solution:**

```css
/* Add responsive breakpoints */
@media (max-width: 374px) {
  .btn-lg {
    font-size: 0.95rem;
    padding: 12px;
  }
  .page-title {
    font-size: 1rem;
  }
}
```

### Issue 4: Keyboard Pushes Content Off Screen (iOS)

**Symptoms:**

- Input fields hidden behind keyboard
- Submit button not visible

**Solution:**

```javascript
// Scroll input into view on focus
document.querySelectorAll('input, textarea').forEach((input) => {
  input.addEventListener('focus', (e) => {
    setTimeout(() => {
      e.target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 300); // Wait for keyboard animation
  });
});
```

### Issue 5: Notch/Safe Area Issues

**Symptoms:**

- Content hidden behind notch
- Bottom bar hidden behind home indicator

**Solution:**

```css
/* Use safe area insets */
.top-bar {
  padding-top: max(16px, env(safe-area-inset-top));
}

.bottom-nav {
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}
```

---

## 8. Performance Optimization

### Image Optimization

```bash
# Optimize icons with ImageOptim or similar
# Target: < 10KB per icon

# Use WebP format where supported
<picture>
  <source srcset="logo.webp" type="image/webp">
  <img src="logo.png" alt="Q8 Logo">
</picture>
```

### Font Loading

```css
/* Already using font-display: swap - GOOD */
@import url('https://fonts.googleapis.com/css2?family=Mulish:wght@400;600;700&display=swap');
```

### CSS Optimization

```css
/* Use CSS containment for better performance */
.card {
  contain: layout style paint;
}

.list-item {
  contain: layout style;
}
```

---

## 9. Accessibility Considerations

### Minimum Requirements

```html
<!-- Add lang attribute (already present) -->
<html lang="en">
  <!-- Ensure all images have alt text -->
  <img src="q8-logo.png" alt="Q8 Liberty Logo" />

  <!-- Use semantic HTML (already doing well) -->
  <header>
    ,
    <nav>
      ,
      <main>
        ,
        <footer>
          <!-- Ensure sufficient color contrast -->
          /* Check with Chrome DevTools or WAVE */
        </footer>
      </main>
    </nav>
  </header>
</html>
```

### Touch Target Sizes

```css
/* Ensure all interactive elements are at least 44x44px */
.btn {
  min-height: 48px;
}
.icon-btn {
  min-width: 44px;
  min-height: 44px;
}
```

---

## 10. Implementation Priority

### Phase 1: Critical (Do First)

1. ✅ Create icon set (192x192, 512x512, maskable)
2. ✅ Update manifest.webmanifest with icons
3. ✅ Add iOS meta tags
4. ✅ Test on real devices (iPhone + Android)

### Phase 2: Important (Do Soon)

5. ⚠️ Create splash screens for iOS
6. ⚠️ Add platform detection utilities
7. ⚠️ Implement responsive breakpoints
8. ⚠️ Test on tablet devices

### Phase 3: Enhancement (Nice to Have)

9. 🔹 Add app shortcuts
10. 🔹 Create screenshots for manifest
11. 🔹 Optimize performance
12. 🔹 Add analytics for platform tracking

---

## 11. Validation Checklist

Before deploying, verify:

- [ ] Lighthouse PWA score > 90
- [ ] All icons display correctly on Android
- [ ] iOS Add to Home Screen works
- [ ] App opens in standalone mode
- [ ] No console errors on any platform
- [ ] Touch targets meet minimum size
- [ ] Safe areas respected on notched devices
- [ ] Orientation changes handled
- [ ] Keyboard doesn't break layout
- [ ] Offline mode works (if applicable)

---

## 12. Resources

**Documentation:**

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA](https://web.dev/learn/pwa/)
- [Apple iOS Web Apps](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

**Tools:**

- [PWA Builder](https://www.pwabuilder.com/)
- [Maskable.app](https://maskable.app/) - Test maskable icons
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

**Testing:**

- [BrowserStack](https://www.browserstack.com/)
- [LambdaTest](https://www.lambdatest.com/)
- [Chrome DevTools Device Mode](https://developer.chrome.com/docs/devtools/device-mode/)

---

## Next Steps

1. Review this guide with your team
2. Prioritize implementation phases
3. Create icon assets (Phase 1)
4. Update manifest and HTML (Phase 1)
5. Test on real devices (Phase 1)
6. Iterate based on findings

**Questions?** Document any issues encountered during implementation.

---

**Document Version:** 1.0  
**Last Updated:** February 1, 2026  
**Maintained By:** Development Team
