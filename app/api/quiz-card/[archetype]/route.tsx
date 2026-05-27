import { ImageResponse } from 'next/og';
import { getArchetype } from '../../../../src/lib/quiz-archetype';

export const runtime = 'edge';

// GET /api/quiz-card/[archetype]
// Returns a 1080×1920 PNG share card for the given drip-type archetype.
// Used on the quiz results page (download / share to Instagram Story).
// Cached for 1 day at the edge since the cards are deterministic per slug.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ archetype: string }> }
) {
  const { archetype } = await params;
  const a = getArchetype(archetype);
  if (!a) {
    return new Response('Archetype not found', { status: 404 });
  }

  const { name, quote, gradient, icon } = a;
  // Split the archetype name at the space after "The" so "The Recovery Athlete"
  // becomes "The" (small) + "Recovery Athlete" (big two-line wrap)
  const [thePrefix, ...rest] = name.split(' ');
  const headline = rest.join(' ');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '120px 100px',
          background: `linear-gradient(160deg, ${gradient.from} 0%, ${gradient.via || gradient.from} 50%, ${gradient.to} 100%)`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Soft radial highlight top-right for depth */}
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        {/* Soft radial shadow bottom-left for depth */}
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-150px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,0,0,0.25) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Brand mark top-left */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '36px',
            fontWeight: 800,
            letterSpacing: '0.05em',
          }}
        >
          <div
            style={{
              width: '18px',
              height: '18px',
              background: 'white',
              borderRadius: '50%',
              display: 'flex',
            }}
          />
          TheDripMap
        </div>

        {/* Eyebrow */}
        <div
          style={{
            marginTop: '180px',
            fontSize: '32px',
            fontWeight: 800,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.75)',
            display: 'flex',
          }}
        >
          Your Drip Type
        </div>

        {/* Archetype name — "The" small, rest big */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '32px',
          }}
        >
          <div
            style={{
              fontSize: '54px',
              fontWeight: 500,
              opacity: 0.85,
              fontStyle: 'italic',
              display: 'flex',
            }}
          >
            {thePrefix}
          </div>
          <div
            style={{
              fontSize: '128px',
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              marginTop: '8px',
              textShadow: '0 6px 24px rgba(0,0,0,0.25)',
              display: 'flex',
            }}
          >
            {headline}
          </div>
        </div>

        {/* Icon — centered, with subtle white glow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '120px',
            width: '100%',
          }}
        >
          <div
            style={{
              width: '320px',
              height: '320px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.10)',
              border: '2px solid rgba(255,255,255,0.30)',
              boxShadow: '0 0 80px rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(20px)',
            }}
          >
            <svg
              width="200"
              height="200"
              viewBox={icon.viewBox || '0 0 24 24'}
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {icon.paths.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </svg>
          </div>
        </div>

        {/* Quote */}
        <div
          style={{
            marginTop: '90px',
            fontSize: '38px',
            fontWeight: 600,
            fontStyle: 'italic',
            lineHeight: 1.35,
            opacity: 0.92,
            display: 'flex',
            flexDirection: 'column',
            textShadow: '0 2px 12px rgba(0,0,0,0.2)',
          }}
        >
          {quote.split('\n').map((line, i) => (
            <span key={i} style={{ display: 'flex' }}>{line}</span>
          ))}
        </div>

        {/* Footer / CTA */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            paddingTop: '60px',
          }}
        >
          <div
            style={{
              width: '120px',
              height: '2px',
              background: 'rgba(255,255,255,0.4)',
              display: 'flex',
            }}
          />
          <div
            style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.75)',
              display: 'flex',
            }}
          >
            Find your match →
          </div>
          <div
            style={{
              fontSize: '42px',
              fontWeight: 900,
              letterSpacing: '-0.01em',
              display: 'flex',
            }}
          >
            thedripmap.com/quiz
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: {
        // Cache for a day at the edge; cards are deterministic per slug
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
      },
    }
  );
}
