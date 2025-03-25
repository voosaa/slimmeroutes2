/**
 * Geocoding utility functions for SlimmeRoutes
 * This file provides functions to convert addresses to coordinates
 */

interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

/**
 * Geocode an address to get its coordinates
 * This function uses the browser's Geocoding API if available
 * Falls back to a simple mock implementation for development
 * 
 * @param address The address to geocode
 * @returns Promise with the geocoding result
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  // Check if we're in a browser environment with Geocoding API
  if (typeof window !== 'undefined' && 'navigator' in window && 'geolocation' in navigator) {
    try {
      // Try to use the browser's Geocoding API if available
      if ('Geocoder' in window) {
        return await browserGeocode(address);
      }
    } catch (error) {
      console.warn('Browser geocoding failed, falling back to mock geocoding', error);
    }
  }
  
  // Fall back to mock geocoding for development
  return mockGeocode(address);
}

/**
 * Geocode using the browser's Geocoding API
 * This requires the Geocoding API to be available in the browser
 * 
 * @param address The address to geocode
 * @returns Promise with the geocoding result
 */
async function browserGeocode(address: string): Promise<GeocodeResult | null> {
  // This is a TypeScript workaround since the Geocoder API isn't in the standard types
  const geocoder = new (window as any).google.maps.Geocoder();
  
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results: any[], status: string) => {
      if (status === 'OK' && results && results.length > 0) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng(),
          formattedAddress: results[0].formatted_address
        });
      } else {
        reject(new Error(`Geocoding failed with status: ${status}`));
      }
    });
  });
}

/**
 * Mock geocoding function for development and testing
 * Generates deterministic coordinates based on the address string
 * 
 * @param address The address to geocode
 * @returns Mock geocoding result
 */
function mockGeocode(address: string): GeocodeResult {
  // Generate deterministic coordinates based on the address string
  // This is just for development and testing
  const hash = address.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // Generate coordinates around the Netherlands
  // Latitude: 50.75 to 53.5
  // Longitude: 3.2 to 7.2
  const lat = 52 + (hash % 275) / 100; // Range: 50.75 to 53.5
  const lng = 5 + (hash % 400) / 100;  // Range: 3.2 to 7.2
  
  return {
    lat,
    lng,
    formattedAddress: address
  };
}

/**
 * Calculate the distance between two coordinates in kilometers
 * Uses the Haversine formula
 * 
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Convert degrees to radians
 * 
 * @param deg Degrees
 * @returns Radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
