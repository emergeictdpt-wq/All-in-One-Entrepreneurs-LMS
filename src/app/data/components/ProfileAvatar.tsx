/**
 * Shared profile icon — the same head-and-shoulders silhouette used in the
 * Program Managers page header. Use this instead of photos / generated images.
 *
 * - Default (round): fixed-size circle, e.g. <ProfileAvatar className="w-16 h-16" />
 * - `fill`: stretches to fill its parent (for large photo slots such as cards).
 */
export function ProfileAvatar({
  className = "w-10 h-10",
  size,
  fill = false,
  rounded = true,
  title,
}: {
  className?: string;
  /** Pixel size (overrides width/height classes). */
  size?: number;
  fill?: boolean;
  rounded?: boolean;
  title?: string;
}) {
  return (
    <div
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={`${fill ? "w-full h-full" : ""} ${rounded ? "rounded-full" : ""} flex items-center justify-center shrink-0 overflow-hidden ${size ? "" : className}`}
      style={{ background: "#4C808A", border: "2px solid #fff", ...(size ? { width: size, height: size } : {}) }}
    >
      <svg viewBox="0 0 32 32" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid meet">
        <circle cx="16" cy="12" r="5" fill="rgba(255,255,255,0.85)" />
        <ellipse cx="16" cy="26" rx="10" ry="6" fill="rgba(255,255,255,0.85)" />
      </svg>
    </div>
  );
}
