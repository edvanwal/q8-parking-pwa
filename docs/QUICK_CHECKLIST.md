# PWA Cross-Platform Quick Checklist

## 🚨 Critical Issues (Fix Immediately)

- [ ] **Icons Missing** - Create and add icons to manifest
  - Minimum: 192x192.png, 512x512.png
  - Required: maskable-192x192.png, maskable-512x512.png
  - iOS: apple-touch-icon.png (180x180)

- [ ] **Manifest Icons Array Empty** - Update `public/manifest.webmanifest`
  - Add complete icons array with all sizes
  - Include maskable icons with `"purpose": "maskable"`

- [ ] **iOS Meta Tags Missing** - Add to `public/index.html`
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  ```

## ✅ Quick Wins (Easy Fixes)

- [ ] Remove `user-scalable=no` from viewport (accessibility)
- [ ] Add `description` to manifest
- [ ] Add platform detection script
- [ ] Test on 2 real devices (1 iOS, 1 Android)

## 📱 Device Testing Priority

**Must Test:**

1. iPhone (any model) - Safari
2. Android phone (Samsung/Pixel) - Chrome

**Should Test:** 3. iPad - Safari 4. Android tablet - Chrome

## 🔧 Tools You Need

1. **Icon Generator:** https://www.pwabuilder.com/imageGenerator
2. **Manifest Validator:** https://manifest-validator.appspot.com/
3. **Lighthouse:** Chrome DevTools > Lighthouse tab
4. **Maskable Icon Editor:** https://maskable.app/

## 📊 Success Criteria

- ✅ Lighthouse PWA score > 90
- ✅ Icons show correctly on home screen (iOS + Android)
- ✅ App opens in standalone mode
- ✅ No layout breaks on small screens (320px width)
- ✅ Safe areas respected (notched devices)

## 🎯 Implementation Order

**Day 1:**

1. Create icons (use tool above)
2. Update manifest with icons
3. Add iOS meta tags
4. Deploy and test

**Day 2:** 5. Add platform detection 6. Test responsive breakpoints 7. Fix any issues found

**Day 3:** 8. Create splash screens (optional) 9. Add app shortcuts (optional) 10. Final testing and validation

---

**Time Estimate:** 4-6 hours for critical fixes
**Impact:** High - Fixes installation and display issues on all platforms
