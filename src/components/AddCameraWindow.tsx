'use client';

import { useState } from 'react';
import { Search, Save, Loader2, Camera, MapPin, Tag, Globe } from 'lucide-react';
import { authFetch } from '@/lib/authClient';
import { useToast } from '@/components/UiDialogs';
import { GLASS_STYLE } from '@/components/LFrame';

interface Props {
  defaultLat?: number;
  defaultLon?: number;
  defaultName?: string;
  onSaved?: () => void;
}

export default function AddCameraWindow({ defaultLat = 0, defaultLon = 0, defaultName = '', onSaved }: Props) {
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [name, setName] = useState(defaultName);
  const [lat, setLat] = useState(defaultLat);
  const [lon, setLon] = useState(defaultLon);
  const [type, setType] = useState<'camera' | 'youtube' | 'stream'>('camera');
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const autoDetect = async () => {
    if (!url) { toast('URL eingeben', 'err'); return; }
    setDetecting(true);
    try {
      const r = await authFetch('/api/admin/detect', { method: 'POST', body: JSON.stringify({ url, type: url.includes('youtube') ? 'youtube' : 'camera' }) });
      if (r.ok) {
        const d = await r.json();
        if (d.name && !name) setName(d.name);
        if (d.lat && (!lat || lat === 0)) setLat(d.lat);
        if (d.lon && (!lon || lon === 0)) setLon(d.lon);
        // Auto-detect type
        if (url.includes('youtube.com') || url.includes('youtu.be')) setType('youtube');
        else if (url.includes('.mjpg') || url.includes('.jpg') || url.includes('snapshot') || url.includes('current')) setType('camera');
        else setType('stream');
        // Preview for image URLs
        if (url.match(/\.(jpg|jpeg|png|gif|mjpg)/i)) setPreview(url);
        toast(d.name ? `Erkannt: ${d.name}` : 'Kein Titel erkannt — manuell eingeben');
      }
    } catch (e) { toast((e as Error).message, 'err'); }
    setDetecting(false);
  };

  const save = async () => {
    if (!url) { toast('URL erforderlich', 'err'); return; }
    if (!name) { toast('Name erforderlich', 'err'); return; }
    setSaving(true);
    try {
      // Get existing cameras, append new one
      const existing = await authFetch('/api/admin/cameras').then(r => r.ok ? r.json() : []);
      const newCam = { url, name, lat, lon, type };
      const updated = [...existing, newCam];
      const r = await authFetch('/api/admin/cameras', { method: 'POST', body: JSON.stringify({ cameras: updated }) });
      if (r.ok) {
        toast(`"${name}" gespeichert`);
        setUrl(''); setName(''); setLat(0); setLon(0); setPreview(null);
        onSaved?.();
      } else toast('Fehler beim Speichern', 'err');
    } catch (e) { toast((e as Error).message, 'err'); }
    setSaving(false);
  };

  return (
    <div className="p-4 flex flex-col gap-3 text-[10px] font-mono">
      {/* URL + Auto-Detect */}
      <div className="flex flex-col gap-1">
        <label className="text-white/40 tracking-wider text-[8px]">STREAM / CAMERA URL</label>
        <div className="flex gap-2">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1.5 text-white/80 outline-none focus:border-[var(--gold-primary)]/50" />
          <button onClick={autoDetect} disabled={detecting} className="flex items-center gap-1 px-3 py-1.5 rounded border border-[var(--cyan-primary)]/50 text-[var(--cyan-primary)] bg-[var(--cyan-primary)]/10 hover:bg-[var(--cyan-primary)]/20 disabled:opacity-50 flex-shrink-0">
            {detecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            ERKENNEN
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="rounded overflow-hidden border border-white/10 h-[100px]">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" onError={() => setPreview(null)} />
        </div>
      )}

      {/* Name + Type */}
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-white/40 tracking-wider text-[8px]">NAME</label>
          <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 rounded px-2 py-1.5">
            <Tag className="w-3 h-3 text-white/30" />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Kamera-Name" className="bg-transparent text-white/80 outline-none flex-1" />
          </div>
        </div>
        <div className="w-[90px] flex flex-col gap-1">
          <label className="text-white/40 tracking-wider text-[8px]">TYP</label>
          <select value={type} onChange={e => setType(e.target.value as any)} className="bg-black/30 border border-white/10 rounded px-2 py-1.5 text-white/60 outline-none">
            <option value="camera">Kamera</option>
            <option value="youtube">YouTube</option>
            <option value="stream">Stream</option>
          </select>
        </div>
      </div>

      {/* Location */}
      <div className="flex flex-col gap-1">
        <label className="text-white/40 tracking-wider text-[8px]">STANDORT (GPS)</label>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 rounded px-2 py-1.5 flex-1">
            <MapPin className="w-3 h-3 text-white/30" />
            <input type="number" step="0.0001" value={lat || ''} onChange={e => setLat(parseFloat(e.target.value) || 0)} placeholder="Latitude" className="bg-transparent text-white/80 outline-none flex-1 w-0" />
          </div>
          <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 rounded px-2 py-1.5 flex-1">
            <Globe className="w-3 h-3 text-white/30" />
            <input type="number" step="0.0001" value={lon || ''} onChange={e => setLon(parseFloat(e.target.value) || 0)} placeholder="Longitude" className="bg-transparent text-white/80 outline-none flex-1 w-0" />
          </div>
        </div>
        {lat === 0 && lon === 0 && <span className="text-[var(--gold-primary)]/60 text-[8px]">Tipp: Pinpoint auf der Karte setzen für automatische Koordinaten</span>}
      </div>

      {/* Save */}
      <button onClick={save} disabled={saving || !url} className="flex items-center justify-center gap-2 py-2 rounded border border-[var(--gold-primary)]/60 text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 hover:bg-[var(--gold-primary)]/20 disabled:opacity-40 transition-all text-[11px] tracking-wider">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        SPEICHERN
      </button>
    </div>
  );
}
