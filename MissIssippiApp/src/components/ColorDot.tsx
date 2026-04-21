import { getSwatchColor } from "../utils/swatchColor";

interface ColorDotProps {
  colorName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ColorDot({ colorName, size = "md", className }: ColorDotProps) {
  return (
    <span
      className={`color-dot color-dot--${size}${className ? ` ${className}` : ""}`}
      style={{ backgroundColor: getSwatchColor(colorName) }}
      title={colorName}
    />
  );
}
