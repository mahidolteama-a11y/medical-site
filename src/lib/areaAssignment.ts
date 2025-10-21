import { MapArea } from '../types';
import { geocodeAddress, geocodeStructuredAddress } from './geocoding';

export const isPointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
  // Accept inputs as [lat, lng] pairs but compute using x=lng, y=lat
  const x = point[1];
  const y = point[0];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1]; // lng
    const yi = polygon[i][0]; // lat
    const xj = polygon[j][1];
    const yj = polygon[j][0];

    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

export const findAreaByCoordinates = (lat: number, lng: number, areas: MapArea[]): MapArea | null => {
  const point: [number, number] = [lat, lng];

  for (const area of areas) {
    if (area.geometry && area.geometry.coordinates && area.geometry.coordinates.length > 0) {
      const polygon = area.geometry.coordinates[0];
      if (isPointInPolygon(point, polygon)) {
        return area;
      }
    }
  }

  return null;
};

export interface AreaAssignmentResult {
  area: MapArea | null;
  method: 'gps' | 'address' | 'manual' | 'none';
  confidence: 'high' | 'medium' | 'low';
  geocodedLat?: number;
  geocodedLng?: number;
}

export const assignAreaByGPS = async (
  lat: number | undefined,
  lng: number | undefined,
  areas: MapArea[]
): Promise<AreaAssignmentResult> => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { area: null, method: 'none', confidence: 'low' };
  }

  const area = findAreaByCoordinates(lat, lng, areas);

  if (area) {
    return { area, method: 'gps', confidence: 'high' };
  }

  return { area: null, method: 'none', confidence: 'low' };
};

export const assignAreaByAddress = async (
  address: string,
  areas: MapArea[]
): Promise<AreaAssignmentResult> => {
  const geocoded = await geocodeAddress(address);

  if (!geocoded) {
    return { area: null, method: 'none', confidence: 'low' };
  }

  const area = findAreaByCoordinates(geocoded.lat, geocoded.lng, areas);

  if (area) {
    return {
      area,
      method: 'address',
      confidence: geocoded.confidence > 0.7 ? 'high' : geocoded.confidence > 0.4 ? 'medium' : 'low',
      geocodedLat: geocoded.lat,
      geocodedLng: geocoded.lng
    };
  }

  return {
    area: null,
    method: 'none',
    confidence: 'low',
    geocodedLat: geocoded.lat,
    geocodedLng: geocoded.lng
  };
};

export const assignAreaByStructuredAddress = async (
  addressLine: string,
  subdistrict: string,
  district: string,
  province: string,
  areas: MapArea[]
): Promise<AreaAssignmentResult> => {
  const geocoded = await geocodeStructuredAddress(addressLine, subdistrict, district, province);

  if (!geocoded) {
    return { area: null, method: 'none', confidence: 'low' };
  }

  const area = findAreaByCoordinates(geocoded.lat, geocoded.lng, areas);

  if (area) {
    return {
      area,
      method: 'address',
      confidence: geocoded.confidence > 0.7 ? 'high' : geocoded.confidence > 0.4 ? 'medium' : 'low',
      geocodedLat: geocoded.lat,
      geocodedLng: geocoded.lng
    };
  }

  return {
    area: null,
    method: 'none',
    confidence: 'low',
    geocodedLat: geocoded.lat,
    geocodedLng: geocoded.lng
  };
};

export const assignAreaDualMethod = async (
  lat: number | undefined,
  lng: number | undefined,
  address: string,
  areas: MapArea[]
): Promise<AreaAssignmentResult> => {
  const gpsResult = await assignAreaByGPS(lat, lng, areas);

  if (gpsResult.area && gpsResult.confidence === 'high') {
    return gpsResult;
  }

  const addressResult = await assignAreaByAddress(address, areas);

  if (addressResult.area) {
    return addressResult;
  }

  if (gpsResult.area) {
    return gpsResult;
  }

  return { area: null, method: 'none', confidence: 'low' };
};

export const calculatePolygonCentroid = (coordinates: number[][]): [number, number] => {
  let latSum = 0;
  let lngSum = 0;
  const count = coordinates.length;

  for (const coord of coordinates) {
    latSum += coord[0];
    lngSum += coord[1];
  }

  return [latSum / count, lngSum / count];
};
