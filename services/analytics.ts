
type EventParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
    dataLayer?: any[];
  }
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public init(measurementId?: string) {
    if (this.initialized) return;
    
    if (measurementId) {
      // Initialize Google Analytics
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer?.push(args);
      }
      gtag('js', new Date());
      gtag('config', measurementId);
      
      this.initialized = true;
      console.log(`[Analytics] Initialized with ID: ${measurementId}`);
    } else {
      console.log('[Analytics] Initialized in debug mode (console logging only)');
    }
  }

  public trackEvent(eventName: string, params?: EventParams) {
    // Log to console in development
    if (import.meta.env.DEV || !this.initialized) {
      console.log(`[Analytics] Event: ${eventName}`, params || '');
    }

    // Send to GA if initialized
    if (this.initialized && window.gtag) {
      window.gtag('event', eventName, params);
    }
  }

  public trackPageview(path: string) {
    this.trackEvent('page_view', { page_path: path });
  }
}

export const analytics = AnalyticsService.getInstance();
