import { MapPin, MapPinOff, ExternalLink } from 'lucide-react';

interface LocationPreviewProps {
  latitude: number | null;
  longitude: number | null;
  accuracy?: number | null;
}

/**
 * Lightweight location display: a static preview image from OpenStreetMap
 * plus a link to open the coordinates in the user's own map app. No heavy
 * map SDK / JS map library needed for an MVP.
 */
export function LocationPreview({ latitude, longitude, accuracy }: LocationPreviewProps) {
  if (latitude == null || longitude == null) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-ink-50 border border-ink-200 px-3.5 py-3 text-sm text-ink-500">
        <MapPinOff size={18} className="flex-shrink-0" aria-hidden="true" />
        <span>Location wasn't available for this alert.</span>
      </div>
    );
  }

  const mapsUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
  const staticPreviewUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=16&size=600x240&markers=${latitude},${longitude},red-pushpin`;

  return (
    <div className="rounded-lg overflow-hidden border border-ink-200">
      <a href={mapsUrl} target="_blank" rel="noreferrer" className="block group">
        <img
          src={staticPreviewUrl}
          alt={`Map showing captured location at ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
          className="w-full h-40 object-cover bg-ink-100"
          loading="lazy"
        />
      </a>
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-white text-sm">
        <span className="flex items-center gap-1.5 text-ink-600">
          <MapPin size={16} className="text-brand-600 flex-shrink-0" aria-hidden="true" />
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
          {accuracy ? <span className="text-ink-400">· ±{Math.round(accuracy)}m</span> : null}
        </span>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-brand-700 font-medium hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 rounded"
        >
          Open map <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
