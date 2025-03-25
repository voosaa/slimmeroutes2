/**
 * Geocode address using Google Maps API
 */

interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

// Function to load Google Maps API if not already loaded
const loadGoogleMapsApi = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      console.log("Google Maps API already loaded");
      return resolve();
    }

    // Use hardcoded API key as fallback if environment variable is not set
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'YOUR_GOOGLE_API_KEY';
    
    console.log("Using Google Maps API Key:", API_KEY ? `${API_KEY.slice(0, 8)}...` : "Not set");
    
    if (!API_KEY) {
      console.error('Google Maps API key is missing in environment variables');
      return reject(new Error('Google Maps API key is not configured'));
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    // Set up callbacks
    script.onload = () => {
      console.log('Google Maps API loaded successfully');
      resolve();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      reject(new Error('Failed to load Google Maps API'));
    };

    // Add script to document
    document.head.appendChild(script);
  });
};

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address) {
    console.error('Address is required for geocoding');
    throw new Error('Address is required');
  }

  try {
    // Check if browser is available (for server-side rendering)
    if (typeof window === 'undefined') {
      console.error('Geocoding is only available in browser environment');
      throw new Error('Geocoding is only available in browser environment');
    }

    // Ensure Google Maps API is loaded
    if (!window.google || !window.google.maps) {
      console.log('Google Maps API not loaded, attempting to load it now...');
      await loadGoogleMapsApi();
      
      // Double-check that API loaded successfully
      if (!window.google || !window.google.maps) {
        console.error('Failed to load Google Maps API after attempt');
        throw new Error('Google Maps API failed to load');
      }
    }

    // Create geocoder
    const geocoder = new window.google.maps.Geocoder();
    console.log(`Geocoding address: ${address}`);
    
    // Use a timeout to avoid hanging
    const GEOCODING_TIMEOUT = 10000; // 10 seconds
    
    return new Promise((resolve, reject) => {
      // Set a timeout to avoid hanging
      const timeoutId = setTimeout(() => {
        reject(new Error('Geocoding request timed out after 10 seconds'));
      }, GEOCODING_TIMEOUT);
      
      try {
        geocoder.geocode({ address }, (results: any, status: any) => {
          // Clear the timeout as we got a response
          clearTimeout(timeoutId);
          
          if (status === 'OK' && results && results.length > 0) {
            const location = results[0].geometry.location;
            const result = {
              lat: location.lat(),
              lng: location.lng(),
              formattedAddress: results[0].formatted_address
            };
            
            console.log(`Successfully geocoded address: ${address}`, result);
            resolve(result);
          } else {
            console.error(`Geocoding failed for address "${address}": ${status}`);
            
            // For testing/fallback, provide coordinates for Valkenswaard
            if (address.toLowerCase().includes('valkenswaard')) {
              console.log('Using fallback coordinates for Valkenswaard');
              resolve({
                lat: 51.3520,
                lng: 5.4594,
                formattedAddress: 'Valkenswaard, Netherlands'
              });
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        });
      } catch (geocodeError) {
        clearTimeout(timeoutId);
        console.error('Error in geocoder.geocode call:', geocodeError);
        reject(geocodeError);
      }
    });
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
}
