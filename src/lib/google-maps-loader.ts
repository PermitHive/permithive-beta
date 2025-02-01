declare global {
  interface Window {
    google: any;
    initMap?: () => void;
    googleMapsLoaded?: boolean;
    googleMapsLoadPromise?: Promise<void>;
  }
}

export const loadGoogleMaps = (): Promise<void> => {
  // If the API is already loaded, return immediately
  if (typeof window.google !== 'undefined' && window.google.maps) {
    return Promise.resolve();
  }

  // If we're already loading the API, return the existing promise
  if (window.googleMapsLoadPromise) {
    return window.googleMapsLoadPromise;
  }

  // Create a new promise for loading the API
  window.googleMapsLoadPromise = new Promise((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      if (typeof window.google !== 'undefined' && window.google.maps) {
        resolve();
      } else {
        // If script exists but API isn't loaded, wait for it
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', (e) => reject(e.error));
      }
      return;
    }

    // Create and add the script element
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;

    script.addEventListener('load', () => {
      window.googleMapsLoaded = true;
      resolve();
    });

    script.addEventListener('error', (e) => {
      delete window.googleMapsLoadPromise;
      reject(e.error);
    });

    document.head.appendChild(script);
  });

  return window.googleMapsLoadPromise;
}; 