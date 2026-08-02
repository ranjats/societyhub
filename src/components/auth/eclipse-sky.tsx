/**
 * Decorative sky layer for the auth pages — twinkling stars and periodic
 * shooting stars drifting over the solar eclipse background.
 * Purely presentational: pointer-events are disabled and the layer is
 * hidden from screen readers.
 */

const TWINKLE_STARS = [
  { top: "8%", left: "14%", size: 3, delay: 0.0, dur: 2.8 },
  { top: "18%", left: "72%", size: 2, delay: 1.2, dur: 3.4 },
  { top: "30%", left: "88%", size: 3, delay: 0.6, dur: 2.4 },
  { top: "42%", left: "6%", size: 2, delay: 2.1, dur: 3.8 },
  { top: "55%", left: "92%", size: 2, delay: 1.6, dur: 3.0 },
  { top: "68%", left: "12%", size: 3, delay: 0.9, dur: 2.6 },
  { top: "78%", left: "82%", size: 2, delay: 2.4, dur: 3.6 },
  { top: "88%", left: "28%", size: 3, delay: 1.9, dur: 2.2 },
  { top: "14%", left: "45%", size: 2, delay: 2.8, dur: 3.2 },
  { top: "60%", left: "56%", size: 2, delay: 0.3, dur: 2.9 },
];

const SHOOTING_STARS = [
  { top: "6%", left: "70%", delay: 2.5, dur: 7 },
  { top: "20%", left: "52%", delay: 9.5, dur: 9 },
  { top: "12%", left: "84%", delay: 16, dur: 8 },
];

export default function EclipseSky() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {TWINKLE_STARS.map((s, i) => (
        <span
          key={`star-${i}`}
          className="star"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
      {SHOOTING_STARS.map((s, i) => (
        <span
          key={`shoot-${i}`}
          className="shooting-star"
          style={{
            top: s.top,
            left: s.left,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
