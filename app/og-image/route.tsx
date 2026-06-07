import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0F6E56 0%, #0B4F3D 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: '80px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginBottom: 32,
          }}
        >
          TheDripMap
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            opacity: 0.92,
            maxWidth: 900,
            lineHeight: 1.2,
          }}
        >
          North America&apos;s IV Therapy Clinic Matching Platform
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            opacity: 0.7,
            marginTop: 40,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Find · Compare · Book
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
