interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  confidence: number;
}

const geocodingCache = new Map<string, GeocodingResult>();

export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  if (!address || address.trim().length === 0) {
    return null;
  }

  const cacheKey = address.toLowerCase().trim();
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!;
  }

  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'HealthcareApp/1.0'
        }
      }
    );

    if (!response.ok) {
      console.error('Geocoding API error:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn('No geocoding results for address:', address);
      return null;
    }

    const result: GeocodingResult = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display_name: data[0].display_name,
      confidence: parseFloat(data[0].importance || '0.5')
    };

    geocodingCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

export const geocodeStructuredAddress = async (
  addressLine: string,
  subdistrict: string,
  district: string,
  province: string
): Promise<GeocodingResult | null> => {
  const parts = [addressLine, subdistrict, district, province, 'Thailand'].filter(Boolean);
  const fullAddress = parts.join(', ');
  return geocodeAddress(fullAddress);
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'HealthcareApp/1.0'
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};
