"use client"

import { Address } from './supabase'

// This is a simplified route optimization algorithm
// In a real application, you would use a more sophisticated algorithm or a third-party API
export async function optimizeRoute(addresses: Address[], startAddress?: Address) {
  // If we have fewer than 2 addresses, no optimization is needed
  if (addresses.length < 2) {
    return {
      optimizedOrder: addresses.map(a => a.id),
      totalDistance: 0,
      totalDuration: 0
    }
  }

  // Check if any addresses have appointment times
  const hasAppointments = addresses.some(a => a.appointment_time);
  
  // If we have appointments, we need to prioritize those in the route
  if (hasAppointments) {
    return optimizeRouteWithAppointments(addresses, startAddress);
  }

  // In a real application, we would use the Google Maps Distance Matrix API or similar
  // to get the actual distances between all addresses
  // For this demo, we'll use a simple nearest neighbor algorithm
  
  // Start with the start address if provided, otherwise use the first address
  const start = startAddress || addresses[0]
  const unvisited = addresses.filter(a => a.id !== start.id)
  const visited = [start]
  const optimizedOrder = [start.id]
  
  let totalDistance = 0
  let totalDuration = 0
  
  // Simple nearest neighbor algorithm
  while (unvisited.length > 0) {
    const current = visited[visited.length - 1]
    
    // Find the nearest unvisited address
    let nearestIndex = 0
    let nearestDistance = calculateDistance(
      current.lat,
      current.lng,
      unvisited[0].lat,
      unvisited[0].lng
    )
    
    for (let i = 1; i < unvisited.length; i++) {
      const distance = calculateDistance(
        current.lat,
        current.lng,
        unvisited[i].lat,
        unvisited[i].lng
      )
      
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = i
      }
    }
    
    const nearest = unvisited[nearestIndex]
    visited.push(nearest)
    optimizedOrder.push(nearest.id)
    
    // Remove the visited address from unvisited
    unvisited.splice(nearestIndex, 1)
    
    // Add to total distance
    totalDistance += nearestDistance
    
    // Estimate duration (assuming 50 km/h average speed)
    const travelDuration = (nearestDistance / 50) * 60 // minutes
    totalDuration += travelDuration
    
    // Add time spent at the destination if specified
    if (nearest?.time_spent !== undefined && nearest?.time_spent !== null) {
      totalDuration += nearest.time_spent;
    }
  }
  
  return {
    optimizedOrder,
    totalDistance: Math.round(totalDistance * 10) / 10, // Round to 1 decimal place
    totalDuration: Math.round(totalDuration) // Round to nearest minute
  }
}

// Function to optimize route considering appointment times
function optimizeRouteWithAppointments(addresses: Address[], startAddress?: Address) {
  // Start with the start address if provided, otherwise use the first address
  const start = startAddress || addresses[0];
  
  // Sort addresses by appointment time (if available)
  const addressesWithAppointments = addresses
    .filter(a => a.appointment_time)
    .sort((a, b) => {
      // Use non-null assertion since we've already filtered for addresses with appointment_time
      const timeA = new Date(a.appointment_time as string).getTime();
      const timeB = new Date(b.appointment_time as string).getTime();
      return timeA - timeB;
    });
  
  // Addresses without appointment times
  const addressesWithoutAppointments = addresses.filter(a => !a.appointment_time);
  
  // Create initial route with start address and addresses with appointments in chronological order
  const route = [start];
  const optimizedOrder = [start.id];
  
  // Add addresses with appointments in chronological order
  for (const address of addressesWithAppointments) {
    if (address.id !== start.id) {
      route.push(address);
      optimizedOrder.push(address.id);
    }
  }
  
  // For remaining addresses without appointments, use nearest neighbor
  let remainingAddresses = addressesWithoutAppointments.filter(a => a.id !== start.id);
  
  while (remainingAddresses.length > 0) {
    const current = route[route.length - 1];
    
    // Find the nearest address
    let nearestIndex = 0;
    let nearestDistance = calculateDistance(
      current.lat,
      current.lng,
      remainingAddresses[0].lat,
      remainingAddresses[0].lng
    );
    
    for (let i = 1; i < remainingAddresses.length; i++) {
      const distance = calculateDistance(
        current.lat,
        current.lng,
        remainingAddresses[i].lat,
        remainingAddresses[i].lng
      );
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }
    
    const nearest = remainingAddresses[nearestIndex];
    route.push(nearest);
    optimizedOrder.push(nearest.id);
    
    // Remove the visited address
    remainingAddresses.splice(nearestIndex, 1);
  }
  
  // Calculate total distance and duration
  let totalDistance = 0;
  let totalDuration = 0;
  
  for (let i = 0; i < route.length - 1; i++) {
    const distance = calculateDistance(
      route[i].lat,
      route[i].lng,
      route[i + 1].lat,
      route[i + 1].lng
    );
    
    totalDistance += distance;
    
    // Estimate travel duration (assuming 50 km/h average speed)
    const travelDuration = (distance / 50) * 60; // minutes
    totalDuration += travelDuration;
    
    // Add time spent at the destination if specified
    if (route[i]?.time_spent !== undefined && route[i]?.time_spent !== null) {
      totalDuration += route[i].time_spent;
    }
  }
  
  // Add time spent at the last destination if specified
  const lastStop = route[route.length - 1];
  if (lastStop?.time_spent !== undefined && lastStop?.time_spent !== null) {
    totalDuration += lastStop.time_spent;
  }
  
  return {
    optimizedOrder,
    totalDistance: Math.round(totalDistance * 10) / 10, // Round to 1 decimal place
    totalDuration: Math.round(totalDuration) // Round to nearest minute
  };
}

// Multi-driver route optimization
export async function optimizeMultiDriverRoute(addresses: Address[], driverCount: number, startAddresses?: Address[]) {
  // If we have fewer addresses than drivers, assign one address to each driver
  if (addresses.length <= driverCount) {
    const result = addresses.map((address, index) => ({
      driverId: `driver_${index}`,
      addresses: [address],
      optimizedOrder: [address.id],
      totalDistance: 0,
      totalDuration: 0
    }));
    
    // Fill in empty routes for remaining drivers
    for (let i = addresses.length; i < driverCount; i++) {
      result.push({
        driverId: `driver_${i}`,
        addresses: [],
        optimizedOrder: [],
        totalDistance: 0,
        totalDuration: 0
      });
    }
    
    return result;
  }
  
  // Distribute addresses among drivers using a cluster-first, route-second approach
  
  // Step 1: Cluster addresses into driverCount groups
  const clusters = clusterAddresses(addresses, driverCount);
  
  // Step 2: Optimize route for each cluster
  const driverRoutes = [];
  
  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i];
    const startAddress = startAddresses && startAddresses[i] ? startAddresses[i] : undefined;
    
    if (cluster.length === 0) {
      driverRoutes.push({
        driverId: `driver_${i}`,
        addresses: [],
        optimizedOrder: [],
        totalDistance: 0,
        totalDuration: 0
      });
      continue;
    }
    
    const { optimizedOrder, totalDistance, totalDuration } = await optimizeRoute(cluster, startAddress);
    
    driverRoutes.push({
      driverId: `driver_${i}`,
      addresses: cluster,
      optimizedOrder,
      totalDistance,
      totalDuration
    });
  }
  
  return driverRoutes;
}

// Cluster addresses into groups based on proximity
function clusterAddresses(addresses: Address[], clusterCount: number): Address[][] {
  if (addresses.length <= clusterCount) {
    // Return each address as its own cluster
    return addresses.map(address => [address]);
  }
  
  // Simple k-means clustering
  // Initialize cluster centers randomly
  const centers = [];
  for (let i = 0; i < clusterCount; i++) {
    const randomIndex = Math.floor(Math.random() * addresses.length);
    centers.push({
      lat: addresses[randomIndex].lat,
      lng: addresses[randomIndex].lng
    });
  }
  
  // Assign addresses to clusters
  let clusters: Address[][] = Array(clusterCount).fill(null).map(() => []);
  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 10;
  
  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;
    
    // Reset clusters
    clusters = Array(clusterCount).fill(null).map(() => []);
    
    // Assign each address to the nearest center
    for (const address of addresses) {
      let nearestCenterIndex = 0;
      let minDistance = calculateDistance(
        address.lat,
        address.lng,
        centers[0].lat,
        centers[0].lng
      );
      
      for (let i = 1; i < centers.length; i++) {
        const distance = calculateDistance(
          address.lat,
          address.lng,
          centers[i].lat,
          centers[i].lng
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestCenterIndex = i;
        }
      }
      
      clusters[nearestCenterIndex].push(address);
    }
    
    // Recalculate centers
    for (let i = 0; i < clusterCount; i++) {
      if (clusters[i].length === 0) continue;
      
      const newCenter = {
        lat: clusters[i].reduce((sum, addr) => sum + addr.lat, 0) / clusters[i].length,
        lng: clusters[i].reduce((sum, addr) => sum + addr.lng, 0) / clusters[i].length
      };
      
      // Check if center has changed significantly
      const centerChanged = Math.abs(newCenter.lat - centers[i].lat) > 0.0001 ||
                           Math.abs(newCenter.lng - centers[i].lng) > 0.0001;
      
      if (centerChanged) {
        changed = true;
        centers[i] = newCenter;
      }
    }
  }
  
  // Handle empty clusters by redistributing addresses from the largest cluster
  for (let i = 0; i < clusters.length; i++) {
    if (clusters[i].length === 0) {
      // Find the largest cluster
      let largestClusterIndex = 0;
      let maxSize = clusters[0].length;
      
      for (let j = 1; j < clusters.length; j++) {
        if (clusters[j].length > maxSize) {
          maxSize = clusters[j].length;
          largestClusterIndex = j;
        }
      }
      
      // Take addresses from the largest cluster
      if (clusters[largestClusterIndex].length > 1) {
        const addressesToMove = Math.floor(clusters[largestClusterIndex].length / 2);
        clusters[i] = clusters[largestClusterIndex].splice(0, addressesToMove);
      }
    }
  }
  
  return clusters;
}

// Calculate distance between two points using the Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km
  return distance
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}

// Geocode an address to get lat/lng coordinates
export async function geocodeAddress(address: string) {
  try {
    // In a real application, you would use the Google Maps Geocoding API or similar
    // For this demo, we'll return mock coordinates
    
    // Mock geocoding - in a real app, you would call a geocoding API
    const mockCoordinates = {
      lat: 40.7128 + (Math.random() - 0.5) * 0.1, // Random coordinates near New York
      lng: -74.0060 + (Math.random() - 0.5) * 0.1
    }
    
    return {
      success: true as const,
      lat: mockCoordinates.lat,
      lng: mockCoordinates.lng
    }
  } catch (error) {
    console.error('Error geocoding address:', error)
    return {
      success: false as const,
      error: 'Failed to geocode address'
    }
  }
}
