interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-20 h-20 text-2xl",
  xl: "w-24 h-24 text-2xl",
};

export function Avatar({
  src,
  alt = "Avatar",
  fallback,
  size = "md",
  className = "",
}: AvatarProps): JSX.Element {
  const sizeClass = sizeClasses[size];
  const fallbackLetter = (fallback || alt || "?")[0].toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} rounded-full object-cover ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-muted flex items-center justify-center ${className}`}
    >
      <span className="text-muted-foreground">{fallbackLetter}</span>
    </div>
  );
}
