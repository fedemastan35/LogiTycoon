export function getDistance(c1: { lat: number, lng: number }, c2: { lat: number, lng: number }) {
    const R = 6371;
    const dLat = (c2.lat - c1.lat) * (Math.PI / 180);
    const dLon = (c2.lng - c1.lng) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(c1.lat * (Math.PI / 180)) * Math.cos(c2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
