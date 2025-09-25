// components/ui/image-with-fallback.tsx
"use client";

import React from "react";
import { getImageUrl } from "../../lib/utils/imageUtils";

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackText?: string;
  onError?: () => void;
}

export function ImageWithFallback({
  src,
  alt,
  className = "",
  fallbackText = "No image",
  onError,
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = React.useState(false);
  const imageUrl = getImageUrl(src);

  if (!imageUrl || imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-500 p-4 rounded ${className}`}
      >
        <span>{fallbackText}</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={(e) => {
        console.error("Failed to load image:", imageUrl);
        setImageError(true);
        if (onError) onError();
      }}
    />
  );
}
