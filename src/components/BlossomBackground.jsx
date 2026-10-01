import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';

// Single blossom flower SVG
const BlossomFlower = React.memo(({ size = 60, primaryColor }) => {
  const color = primaryColor || '#f472b6';
  // Create a subtle palette based on the primary color
  const petalColors = [
    color,
    `color-mix(in srgb, ${color}, white 20%)`,
    `color-mix(in srgb, ${color}, black 10%)`,
    `color-mix(in srgb, ${color}, white 40%)`
  ];
  const angles = [0, 72, 144, 216, 288];

  return (
    <svg width={size} height={size} viewBox="-32 -32 64 64" xmlns="http://www.w3.org/2000/svg">
      {angles.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const px = Math.cos(rad) * 15;
        const py = Math.sin(rad) * 15;
        return (
          <ellipse
            key={angle}
            cx={px} cy={py}
            rx="13" ry="7"
            transform={`rotate(${angle + 90}, ${px}, ${py})`}
            fill={petalColors[i % petalColors.length]}
            opacity="0.8"
            style={{ fill: petalColors[i % petalColors.length] }}
          />
        );
      })}
      {/* Center */}
      <circle cx="0" cy="0" r="5" fill="#fff5f5" />
      {/* Stamens */}
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line
            key={angle}
            x1="0" y1="0"
            x2={Math.cos(rad) * 8}
            y2={Math.sin(rad) * 8}
            stroke="#fcd34d"
            strokeWidth="1"
            opacity="0.6"
          />
        );
      })}
    </svg>
  );
});

// Falling petal shape
const FallingPetal = React.memo(({ style, color }) => (
  <div style={style} className="falling-petal">
    <svg width="20" height="24" viewBox="0 0 20 24">
      <ellipse cx="10" cy="12" rx="6" ry="9" fill={color || "#f472b6"} opacity="0.8" transform="rotate(-15, 10, 12)" style={{ fill: color || "#f472b6" }} />
    </svg>
  </div>
));

// Flower positions scattered around the screen
const FLOWER_POSITIONS = [
  { top: '3%',  left: '5%',   size: 45,  opacity: 0.45, delay: '0.5s', duration: '8s'  },
  { top: '8%',  left: '85%',  size: 55,  opacity: 0.5,  delay: '1s',  duration: '10s' },
  { top: '12%', left: '96%',  size: 48,  opacity: 0.45, delay: '0s',   duration: '9s'  },
  { top: '45%', left: '93%',  size: 50,  opacity: 0.48, delay: '2s',   duration: '9.5s'},
  { top: '75%', left: '90%',  size: 45,  opacity: 0.45, delay: '3s',   duration: '10s' },
  { top: '92%', left: '15%',  size: 52,  opacity: 0.5,  delay: '1.5s', duration: '12s' },
];

// Falling petals config
const FALLING_PETALS = [
  { left: '5%',   delay: '0s',   duration: '8s'  },
  { left: '15%',  delay: '2s',   duration: '11s' },
  { left: '35%',  delay: '1s',   duration: '13s' },
  { left: '55%',  delay: '7s',   duration: '8.5s'},
  { left: '75%',  delay: '6s',   duration: '9.5s'},
  { left: '95%',  delay: '0.5s', duration: '11.5s'},
];

const BlossomBackground = () => {
  const { settings } = useContext(AppContext);
  const primaryColor = settings.primaryColor;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Floating flowers */}
      {FLOWER_POSITIONS.map((pos, i) => (
        <div
          key={i}
          className="blossom-float absolute"
          style={{
            top: pos.top,
            left: pos.left,
            opacity: pos.opacity,
            animationDelay: pos.delay,
            animationDuration: pos.duration,
          }}
        >
          <BlossomFlower size={pos.size} primaryColor={primaryColor} />
        </div>
      ))}

      {/* Falling petals */}
      {FALLING_PETALS.map((p, i) => (
        <FallingPetal
          key={i}
          color={primaryColor}
          style={{
            position: 'absolute',
            top: '-30px',
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
};

export default BlossomBackground;
