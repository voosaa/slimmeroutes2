import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Address } from "./supabase"

/**
 * Calculate Haversine distance between two points (in kilometers)
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c
  
  return distance
}

/**
 * Interface for route optimization result
 */
export interface RouteOptimizationResult {
  orderedAddresses: Address[];
  totalDistance: number;
  totalDuration: number;
  legs: {
    startAddress: string;
    endAddress: string;
    distance: number;
    duration: number;
    durationInTraffic?: number;
  }[];
}

/**
 * Optimize route using Google Maps Directions API
 * This function uses a combination of algorithms:
 * 1. First attempts to use Google's waypoint optimization
 * 2. Falls back to a more advanced 2-opt algorithm if Google's optimization fails
 * 3. As a last resort, uses a simple nearest neighbor algorithm
 */
export async function optimizeRoute(addresses: Address[]): Promise<RouteOptimizationResult> {
  if (addresses.length < 2) {
    throw new Error('At least 2 addresses are required for route optimization');
  }

  try {
    // First try using Google Maps Directions API for optimization
    return await optimizeWithGoogleMaps(addresses);
  } catch (error) {
    console.error('Google Maps optimization failed, falling back to 2-opt algorithm:', error);
    
    try {
      // Fall back to 2-opt algorithm
      return await optimizeWith2Opt(addresses);
    } catch (fallbackError) {
      console.error('2-opt optimization failed, falling back to nearest neighbor:', fallbackError);
      
      try {
        // Last resort: nearest neighbor algorithm
        return optimizeWithNearestNeighbor(addresses);
      } catch (finalError) {
        console.error('All optimization methods failed:', finalError);
        
        // If all methods fail, return the original order with calculated distances
        return createBasicRouteResult(addresses);
      }
    }
  }
}

/**
 * Optimize route using Google Maps Directions API
 */
async function optimizeWithGoogleMaps(addresses: Address[]): Promise<RouteOptimizationResult> {
  return new Promise((resolve, reject) => {
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || !google.maps || !google.maps.DirectionsService) {
      reject(new Error('Google Maps API not loaded'));
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    
    // Origin is the first address
    const origin = {
      lat: addresses[0].lat,
      lng: addresses[0].lng
    };
    
    // Destination is the last address
    const destination = {
      lat: addresses[addresses.length - 1].lat,
      lng: addresses[addresses.length - 1].lng
    };
    
    // Waypoints are all addresses in between
    const waypoints = addresses.slice(1, addresses.length - 1).map(addr => ({
      location: new google.maps.LatLng(addr.lat, addr.lng),
      stopover: true
    }));
    
    directionsService.route({
      origin,
      destination,
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true, // Let Google optimize the waypoints
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: google.maps.TrafficModel.BEST_GUESS
      },
      avoidHighways: false,
      avoidTolls: false
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        // Process the optimized route
        const optimizedWaypoints = result.routes[0].waypoint_order;
        
        // Reorder addresses based on Google's optimization
        // First address stays as origin
        const orderedAddresses = [addresses[0]];
        
        // Add waypoints in the optimized order
        for (const waypointIndex of optimizedWaypoints) {
          orderedAddresses.push(addresses[waypointIndex + 1]); // +1 because waypoints start from the second address
        }
        
        // Add the destination (last address)
        if (addresses.length > 1) {
          orderedAddresses.push(addresses[addresses.length - 1]);
        }
        
        // Calculate total distance and duration
        let totalDistance = 0;
        let totalDuration = 0;
        const legs = result.routes[0].legs.map(leg => {
          const legDistance = leg.distance ? leg.distance.value / 1000 : 0; // Convert to km
          const legDuration = leg.duration ? leg.duration.value / 60 : 0; // Convert to minutes
          const legDurationInTraffic = leg.duration_in_traffic ? leg.duration_in_traffic.value / 60 : undefined;
          
          totalDistance += legDistance;
          totalDuration += legDuration;
          
          return {
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            distance: legDistance,
            duration: legDuration,
            durationInTraffic: legDurationInTraffic
          };
        });
        
        resolve({
          orderedAddresses,
          totalDistance,
          totalDuration,
          legs
        });
      } else {
        reject(new Error(`Google Maps Directions API failed: ${status}`));
      }
    });
  });
}

/**
 * Optimize route using 2-opt algorithm
 * This is a more advanced algorithm than nearest neighbor
 * It iteratively improves the route by swapping pairs of edges
 */
async function optimizeWith2Opt(addresses: Address[]): Promise<RouteOptimizationResult> {
  // Start with nearest neighbor as initial solution
  const initialSolution = optimizeWithNearestNeighbor(addresses);
  let bestRoute = [...initialSolution.orderedAddresses];
  let bestDistance = initialSolution.totalDistance;
  let improved = true;
  
  // Maximum iterations to prevent infinite loops
  const maxIterations = 100;
  let iterations = 0;
  
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    
    // Try all possible 2-opt swaps
    for (let i = 1; i < bestRoute.length - 2; i++) {
      for (let j = i + 1; j < bestRoute.length - 1; j++) {
        // Create a new route with the 2-opt swap
        const newRoute = [...bestRoute];
        // Reverse the segment between i and j
        const segment = newRoute.slice(i, j + 1).reverse();
        newRoute.splice(i, segment.length, ...segment);
        
        // Calculate the new distance
        let newDistance = 0;
        for (let k = 0; k < newRoute.length - 1; k++) {
          newDistance += calculateHaversineDistance(
            newRoute[k].lat, newRoute[k].lng,
            newRoute[k + 1].lat, newRoute[k + 1].lng
          );
        }
        
        // If the new route is better, keep it
        if (newDistance < bestDistance) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
          // Break out of the inner loop to start again with the new route
          break;
        }
      }
      
      if (improved) {
        // Break out of the outer loop to start again with the new route
        break;
      }
    }
  }
  
  // Calculate the total duration (estimate based on average speed)
  const averageSpeed = 50; // km/h
  const totalDuration = bestDistance / averageSpeed * 60; // minutes
  
  // Create legs information
  const legs = [];
  for (let i = 0; i < bestRoute.length - 1; i++) {
    const distance = calculateHaversineDistance(
      bestRoute[i].lat, bestRoute[i].lng,
      bestRoute[i + 1].lat, bestRoute[i + 1].lng
    );
    
    const duration = distance / averageSpeed * 60; // minutes
    
    legs.push({
      startAddress: bestRoute[i].address,
      endAddress: bestRoute[i + 1].address,
      distance,
      duration
    });
  }
  
  return {
    orderedAddresses: bestRoute,
    totalDistance: bestDistance,
    totalDuration,
    legs
  };
}

/**
 * Optimize route using nearest neighbor algorithm
 * This is a simple greedy algorithm that always chooses the closest next point
 */
function optimizeWithNearestNeighbor(addresses: Address[]): RouteOptimizationResult {
  // Start with the first address as the current point
  const remainingAddresses = [...addresses];
  const startAddress = remainingAddresses[0];
  const optimizedAddresses = [startAddress];
  let currentAddress = startAddress;
  
  // Remove the start address from remaining addresses
  remainingAddresses.splice(0, 1);
  
  // While we have remaining addresses, find the nearest one to the current point
  while (remainingAddresses.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Number.MAX_VALUE;
    
    // Find the nearest address to the current one
    for (let i = 0; i < remainingAddresses.length; i++) {
      const distance = calculateHaversineDistance(
        currentAddress.lat, currentAddress.lng,
        remainingAddresses[i].lat, remainingAddresses[i].lng
      );
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }
    
    // Add the nearest address to our optimized route
    const nearestAddress = remainingAddresses[nearestIndex];
    optimizedAddresses.push(nearestAddress);
    currentAddress = nearestAddress;
    
    // Remove the nearest address from remaining addresses
    remainingAddresses.splice(nearestIndex, 1);
  }
  
  // Calculate total distance
  let totalDistance = 0;
  const legs = [];
  
  for (let i = 0; i < optimizedAddresses.length - 1; i++) {
    const start = optimizedAddresses[i];
    const end = optimizedAddresses[i + 1];
    
    const distance = calculateHaversineDistance(
      start.lat, start.lng,
      end.lat, end.lng
    );
    
    totalDistance += distance;
    
    // Estimate duration based on average speed of 50 km/h
    const duration = distance / 50 * 60; // minutes
    
    legs.push({
      startAddress: start.address,
      endAddress: end.address,
      distance,
      duration
    });
  }
  
  // Estimate total duration based on average speed of 50 km/h
  const totalDuration = totalDistance / 50 * 60; // minutes
  
  return {
    orderedAddresses: optimizedAddresses,
    totalDistance,
    totalDuration,
    legs
  };
}

/**
 * Create a basic route result using the original order
 * This is used as a last resort when all optimization methods fail
 */
function createBasicRouteResult(addresses: Address[]): RouteOptimizationResult {
  let totalDistance = 0;
  let totalDuration = 0;
  const legs = [];
  
  for (let i = 0; i < addresses.length - 1; i++) {
    const start = addresses[i];
    const end = addresses[i + 1];
    
    const distance = calculateHaversineDistance(
      start.lat, start.lng,
      end.lat, end.lng
    );
    
    // Estimate duration based on average speed of 50 km/h
    const duration = distance / 50 * 60; // minutes
    
    totalDistance += distance;
    totalDuration += duration;
    
    legs.push({
      startAddress: start.address || `${start.lat},${start.lng}`,
      endAddress: end.address || `${end.lat},${end.lng}`,
      distance,
      duration,
    });
  }
  
  return {
    orderedAddresses: addresses,
    totalDistance,
    totalDuration,
    legs
  };
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
