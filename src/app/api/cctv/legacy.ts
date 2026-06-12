// Loads the 309 legacy cameras from the old GIM project
// Sources: foto-webcam.eu, terra-hd.de, skylinewebcams.com
import legacyCams from '@/data/legacy-cameras.json';

export function fetchLegacyCameras(): any[] {
  return (legacyCams as any[]).map(c => ({
    id: c.id || `legacy-${c.lat}-${c.lon}`,
    name: c.name,
    lat: c.lat,
    lon: c.lon,
    url: c.url,
    source: c.source === 'unknown' ? (
      c.url.includes('terra-hd') ? 'terra-hd.de' :
      c.url.includes('skylinewebcams') ? 'skylinewebcams.com' :
      c.url.includes('earthcam') ? 'earthcam.com' :
      c.url.includes('datarhei') ? 'datarhei.com' :
      'legacy'
    ) : c.source,
    location: c.location || '',
    type: 'image', // still-image webcam
  }));
}
