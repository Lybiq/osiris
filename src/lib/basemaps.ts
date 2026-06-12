// Basemap catalogue — ported from the legacy GIM project.
// value === 'dark' uses the built-in CARTO dark-matter vector base style.
// Any other value is a raster XYZ tile template ({z}/{x}/{y}).

export interface Basemap {
  id: string;
  label: string;
  value: string; // 'dark' or an XYZ raster tile URL
  group: string;
}

export const BASEMAPS: Basemap[] = [
  // ── Dark / default ──
  { id: 'dark', label: 'OSINT Dark', value: 'dark', group: 'Dark' },
  { id: 'carto-dark-raster', label: 'CARTO Dark Raster', value: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', group: 'Dark' },

  // ── Satellite / imagery ──
  { id: 'esri-sat', label: 'ESRI Satellite', value: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', group: 'Satellite' },
  { id: 'google-sat', label: 'Google Satellite', value: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', group: 'Satellite' },
  { id: 'google-hybrid', label: 'Google Hybrid', value: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', group: 'Satellite' },
  { id: 'usgs-imagery', label: 'USGS Imagery', value: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}', group: 'Satellite' },

  // ── Street / road ──
  { id: 'osm', label: 'OpenStreetMap', value: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', group: 'Street' },
  { id: 'google-roads', label: 'Google Roads', value: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', group: 'Street' },
  { id: 'esri-street', label: 'ESRI Street', value: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', group: 'Street' },
  { id: 'carto-voyager', label: 'CARTO Voyager', value: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', group: 'Street' },
  { id: 'carto-positron', label: 'CARTO Light', value: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', group: 'Street' },

  // ── Terrain / topo ──
  { id: 'opentopo', label: 'OpenTopoMap', value: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png', group: 'Terrain' },
  { id: 'esri-topo', label: 'ESRI Topographic', value: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', group: 'Terrain' },
  { id: 'esri-terrain', label: 'ESRI Terrain', value: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}', group: 'Terrain' },
  { id: 'google-terrain', label: 'Google Terrain', value: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', group: 'Terrain' },
  { id: 'esri-natgeo', label: 'ESRI NatGeo', value: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', group: 'Terrain' },
  { id: 'esri-ocean', label: 'ESRI Ocean', value: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', group: 'Terrain' },
];

export const BASEMAP_GROUPS = ['Dark', 'Satellite', 'Street', 'Terrain'];
