import { Coordinates } from '../types';

const OSRM_API_URL = 'https://router.project-osrm.org/route/v1/driving';

export const getRoute = async (start: Coordinates, end: Coordinates): Promise<Coordinates[]> => {
    try {
        // OSRM expects lon,lat
        const url = `${OSRM_API_URL}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            console.error('OSRM Error:', data);
            // Fallback to straight line if routing fails
            return [start, end];
        }

        // Convert GeoJSON [lon, lat] to {lat, lng}
        const coordinates = data.routes[0].geometry.coordinates.map((coord: number[]) => ({
            lat: coord[1],
            lng: coord[0]
        }));

        return coordinates;
    } catch (error) {
        console.error('Routing fetch error:', error);
        return [start, end];
    }
};
