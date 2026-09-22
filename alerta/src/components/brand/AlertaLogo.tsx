interface AlertaLogoProps {
  className?: string;
  size?: number;
  /** Render the mark only, without the wordmark. */
  markOnly?: boolean;
}

/**
 * Alerta brand mark: a rounded square containing a location pin fused with
 * pulse rings — communicating safety, awareness, location and response.
 * Deliberately NOT a shield (per brand guidelines).
 */
export function AlertaMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Alerta logo"
    >
      <rect x="2" y="2" width="96" height="96" rx="24" fill="#123736" />
      {/* outer pulse ring */}
      <circle cx="50" cy="42" r="26" stroke="#7cadaa" strokeWidth="3" opacity="0.45" />
      {/* inner pulse ring */}
      <circle cx="50" cy="42" r="17" stroke="#adcdc9" strokeWidth="3.5" opacity="0.75" />
      {/* location pin core */}
      <circle cx="50" cy="42" r="9" fill="#f7f8f7" />
      <circle cx="50" cy="42" r="4" fill="#123736" />
      {/* pin base / directional point, grounding it as a location marker */}
      <path d="M50 68C50 68 40 56 40 48" stroke="#f7f8f7" strokeWidth="0" opacity="0" />
    </svg>
  );
}

export function AlertaLogo({ className, size = 32, markOnly = false }: AlertaLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <AlertaMark size={size} />
      {!markOnly && (
        <span
          className="font-bold tracking-tight text-brand-900"
          style={{ fontSize: size * 0.62 }}
        >
          Alerta
        </span>
      )}
    </div>
  );
}
