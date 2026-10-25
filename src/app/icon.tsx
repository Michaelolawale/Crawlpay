import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #18181a 0%, #292044 100%)',
          borderRadius: 8,
          border: '1.5px solid #6c5edc',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Central crawler body */}
          <rect x="7" y="6" width="10" height="12" rx="4" fill="#6c5edc" stroke="#ffffff" strokeWidth="1.5" />
          {/* Eyes / Sensors */}
          <circle cx="10" cy="9" r="1" fill="#ffffff" />
          <circle cx="14" cy="9" r="1" fill="#ffffff" />
          {/* Crawler Legs */}
          <path d="M4 6l3 3" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M4 12h3" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M4 18l3-3" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M20 6l-3 3" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M20 12h-3" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M20 18l-3-3" stroke="#ffffff" strokeWidth="1.5" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
