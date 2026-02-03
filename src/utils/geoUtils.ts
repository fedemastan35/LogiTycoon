import { Coordinates, City } from '../types';

/**
 * Calculates the Euclidean distance between two coordinates.
 * (Simple enough for city proximity in this scope)
 */
export const calculateDistance = (p1: Coordinates, p2: Coordinates): number => {
    const dLat = p1.lat - p2.lat;
    const dLng = p1.lng - p2.lng;
    return Math.sqrt(dLat * dLat + dLng * dLng);
};

/**
 * Finds the closest city from a list to a given set of coordinates.
 */
export const getClosestCity = (coords: Coordinates, cities: City[]): string => {
    if (cities.length === 0) return 'Unknown';

    let closest = cities[0];
    let minDistance = calculateDistance(coords, closest.coordinates);

    for (let i = 1; i < cities.length; i++) {
        const dist = calculateDistance(coords, cities[i].coordinates);
        if (dist < minDistance) {
            minDistance = dist;
            closest = cities[i];
        }
    }

    return closest.name;
};
