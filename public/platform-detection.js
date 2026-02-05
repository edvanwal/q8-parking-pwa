/**
 * Platform Detection Utilities
 * Detect device type, OS, and PWA installation status
 *
 * Usage:
 *   PlatformDetection.isIOS()
 *   PlatformDetection.isStandalone()
 *   PlatformDetection.getDeviceType()
 */

const PlatformDetection = {
  /**
   * Detect if running as installed PWA
   * @returns {boolean}
   */
  isStandalone() {
    // Check display-mode media query (modern browsers)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }

    // Check iOS Safari standalone mode
    if (window.navigator.standalone === true) {
      return true;
    }

    // Check Android TWA (Trusted Web Activity)
    if (document.referrer.includes('android-app://')) {
      return true;
    }

    return false;
  },

  /**
   * Detect iOS devices
   * @returns {boolean}
   */
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  },

  /**
   * Detect Android devices
   * @returns {boolean}
   */
  isAndroid() {
    return /Android/.test(navigator.userAgent);
  },

  /**
   * Detect Safari browser
   * @returns {boolean}
   */
  isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  },

  /**
   * Detect Chrome/Chromium browser
   * @returns {boolean}
   */
  isChrome() {
    return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  },

  /**
   * Detect Firefox browser
   * @returns {boolean}
   */
  isFirefox() {
    return /Firefox/.test(navigator.userAgent);
  },

  /**
   * Get device type
   * @returns {string} 'mobile' | 'tablet' | 'desktop'
   */
  getDeviceType() {
    const ua = navigator.userAgent;

    // Check for tablet
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }

    // Check for mobile
    if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      )
    ) {
      return 'mobile';
    }

    return 'desktop';
  },

  /**
   * Get operating system name
   * @returns {string} 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'Unknown'
   */
  getOS() {
    const ua = navigator.userAgent;

    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Win/.test(ua)) return 'Windows';
    if (/Mac/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';

    return 'Unknown';
  },

  /**
   * Check if PWA can be installed
   * @returns {boolean}
   */
  canInstall() {
    return 'BeforeInstallPromptEvent' in window;
  },

  /**
   * Get viewport dimensions and pixel ratio
   * @returns {object}
   */
  getViewport() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    };
  },

  /**
   * Check if device has notch or safe areas
   * @returns {boolean}
   */
  hasNotch() {
    // Check if safe-area-inset-top is set
    const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue(
      '--safe-area-top'
    );

    return safeAreaTop !== '0px' && safeAreaTop !== '';
  },

  /**
   * Get safe area insets
   * @returns {object}
   */
  getSafeAreaInsets() {
    const style = getComputedStyle(document.documentElement);

    return {
      top: style.getPropertyValue('--safe-area-top') || '0px',
      bottom: style.getPropertyValue('--safe-area-bottom') || '0px',
      left: style.getPropertyValue('--safe-area-left') || '0px',
      right: style.getPropertyValue('--safe-area-right') || '0px',
    };
  },

  /**
   * Check if device supports touch
   * @returns {boolean}
   */
  hasTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  /**
   * Get network connection info
   * @returns {object}
   */
  getConnection() {
    const connection =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (!connection) {
      return { type: 'unknown', effectiveType: 'unknown' };
    }

    return {
      type: connection.type || 'unknown',
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || null,
      rtt: connection.rtt || null,
      saveData: connection.saveData || false,
    };
  },

  /**
   * Check if device is in dark mode
   * @returns {boolean}
   */
  isDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  /**
   * Check if reduced motion is preferred
   * @returns {boolean}
   */
  prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Get complete platform info object
   * @returns {object}
   */
  getInfo() {
    return {
      standalone: this.isStandalone(),
      os: this.getOS(),
      deviceType: this.getDeviceType(),
      isIOS: this.isIOS(),
      isAndroid: this.isAndroid(),
      isSafari: this.isSafari(),
      isChrome: this.isChrome(),
      isFirefox: this.isFirefox(),
      viewport: this.getViewport(),
      hasNotch: this.hasNotch(),
      safeAreaInsets: this.getSafeAreaInsets(),
      hasTouch: this.hasTouch(),
      canInstall: this.canInstall(),
      connection: this.getConnection(),
      darkMode: this.isDarkMode(),
      reducedMotion: this.prefersReducedMotion(),
      userAgent: navigator.userAgent,
    };
  },

  /**
   * Log platform info to console (for debugging)
   */
  logInfo() {
    const info = this.getInfo();

    console.group('🔍 Platform Detection');
    console.log('📱 Device:', info.deviceType);
    console.log('💻 OS:', info.os);
    console.log(
      '🌐 Browser:',
      info.isChrome ? 'Chrome' : info.isSafari ? 'Safari' : info.isFirefox ? 'Firefox' : 'Other'
    );
    console.log('📲 Standalone:', info.standalone);
    console.log(
      '📐 Viewport:',
      `${info.viewport.width}x${info.viewport.height} @ ${info.viewport.devicePixelRatio}x`
    );
    console.log('🔔 Has Notch:', info.hasNotch);
    console.log('👆 Touch:', info.hasTouch);
    console.log('📶 Connection:', info.connection.effectiveType);
    console.log('🌙 Dark Mode:', info.darkMode);
    console.log('♿ Reduced Motion:', info.reducedMotion);
    console.groupEnd();

    return info;
  },

  /**
   * Apply platform-specific classes to body
   */
  applyClasses() {
    const info = this.getInfo();

    // Add OS class
    document.body.classList.add(`platform-${info.os.toLowerCase()}`);

    // Add device type class
    document.body.classList.add(`device-${info.deviceType}`);

    // Add standalone class if installed
    if (info.standalone) {
      document.body.classList.add('standalone');
    }

    // Add browser class
    if (info.isChrome) document.body.classList.add('browser-chrome');
    if (info.isSafari) document.body.classList.add('browser-safari');
    if (info.isFirefox) document.body.classList.add('browser-firefox');

    // Add notch class if present
    if (info.hasNotch) {
      document.body.classList.add('has-notch');
    }

    // Add touch class
    if (info.hasTouch) {
      document.body.classList.add('has-touch');
    }

    // Add dark mode class
    if (info.darkMode) {
      document.body.classList.add('dark-mode');
    }
  },
};

// Auto-initialize on load (optional)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    PlatformDetection.applyClasses();

    // Log info in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      PlatformDetection.logInfo();
    }
  });
} else {
  PlatformDetection.applyClasses();

  // Log info in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    PlatformDetection.logInfo();
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlatformDetection;
}
