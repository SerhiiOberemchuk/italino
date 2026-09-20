import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <svg width="180" height="180" viewBox="0 0 180 180">
      <rect width="180" height="180" rx="42" fill="#14110f" />
      <path d="M69 73h36.5L91 146H54.7z" fill="#fff7ee" />
      <circle cx="95.3" cy="43.3" r="19.7" fill="#d8ff3e" />
      <circle cx="132.2" cy="132.2" r="15.5" fill="#ff4b2b" />
    </svg>,
    size,
  );
}
