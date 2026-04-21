import { resolveSwatchColor } from "../utils/swatchColor";

interface ColorDotProps {
  colorName: string;
  hexColor?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ColorDot({ colorName, hexColor, size = "md", className }: ColorDotProps) {
  const bgColor = resolveSwatchColor(colorName, hexColor);
  return (
    <span
      className={`color-dot color-dot--${size}${className ? ` ${className}` : ""}`}
      style={{ backgroundColor: bgColor }}
      title={colorName}
    />
  );
}
