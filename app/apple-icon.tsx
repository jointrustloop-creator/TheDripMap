import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
        }}
      >
        <div
          style={{
            width: '140px',
            height: '140px',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            borderRadius: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 20px rgba(5, 150, 105, 0.2)',
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: '80px',
              fontWeight: 900,
              fontFamily: 'sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            D
          </div>
        </div>
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    }
  )
}
