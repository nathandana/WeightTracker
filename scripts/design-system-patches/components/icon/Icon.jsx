import "./icon.css";

const SIZE_MAP = {
  xs: "a1-icon-xs",
  sm: "a1-icon-sm",
  lg: "a1-icon-lg",
  xl: "a1-icon-xl",
  jumbo: "a1-icon-jumbo",
  xJumbo: "a1-icon-xjumbo",
};

const COLOR_MAP = {
  muted:   "a1-icon-muted",
  accent:  "a1-icon-accent",
  inverse: "a1-icon-inverse",
  success: "a1-icon-success",
  error:   "a1-icon-error",
  warn:    "a1-icon-warn",
  info:    "a1-icon-info",
};

export function Icon({
  name,
  size,
  color,
  weight,
  grade,
  opticalSize,
  fill,
  className = "",
  style,
  ...props
}) {
  const vars = {
    ...(weight != null && { "--a1-icon-weight": weight }),
    ...(grade != null && { "--a1-icon-grade": grade }),
    ...(opticalSize != null && { "--a1-icon-opsz": opticalSize }),
    ...(fill != null && { "--a1-icon-fill": fill ? 1 : 0 }),
  };

  const classes = [
    "a1-icon",
    "material-symbols-outlined",
    SIZE_MAP[size],
    COLOR_MAP[color],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      style={{ ...vars, ...style }}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  );
}
