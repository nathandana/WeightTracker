import { useMemo } from 'react';
import {
  MessageEmptyState,
} from '@gtivr4/a1-design-system-react';


const PAD = { top: 16, right: 16, bottom: 32, left: 44 };
const W = 340;
const H = 160;

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function ProgressChart({ data = [], unit = 'lbs', goalWeight }) {
  const points = useMemo(() => {
    if (data.length < 1) return [];
    return data.map(d => ({ ...d, weight: Number(d.weight) }));
  }, [data]);

  if (points.length < 2) {
    return (
      <MessageEmptyState
  icon="info"
  scale="section"
  title="Log at least 2 days to see your weight chart."
/>
      
    );
  }

  const weights = points.map(p => p.weight);
  const allWeights = goalWeight != null ? [...weights, Number(goalWeight)] : weights;
  const minW = Math.min(...allWeights) - 2;
  const maxW = Math.max(...allWeights) + 2;
  const range = maxW - minW || 1;

  const totalW = W - PAD.left - PAD.right;
  const totalH = H - PAD.top - PAD.bottom;

  function xOf(i) { return PAD.left + (i / (points.length - 1)) * totalW; }
  function yOf(w) { return PAD.top + (1 - (w - minW) / range) * totalH; }

  // Build SVG path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i)} ${yOf(p.weight)}`)
    .join(' ');

  // Area path (fill under line)
  const areaPath = linePath
    + ` L ${xOf(points.length - 1)} ${PAD.top + totalH}`
    + ` L ${xOf(0)} ${PAD.top + totalH} Z`;

  // Goal line y
  const goalY = goalWeight != null ? yOf(Number(goalWeight)) : null;

  // Y-axis ticks
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const w = minW + (range * i) / tickCount;
    return { w: Math.round(w * 10) / 10, y: yOf(w) };
  });

  // X-axis labels (show first, last, and middle if space)
  const xLabels = [0, Math.floor(points.length / 2), points.length - 1]
    .filter((v, i, a) => a.indexOf(v) === i && v < points.length);

  const gradId = 'chart-area-grad';

  return (
    <svg
      viewBox={`0 0 ${W} ${H + PAD.top + PAD.bottom}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--semantic-color-action-background)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--semantic-color-action-background)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y-axis ticks */}
      {ticks.map(({ w, y }) => (
        <g key={w}>
          <line
            x1={PAD.left} y1={y}
            x2={PAD.left + totalW} y2={y}
            stroke="var(--semantic-color-border-subtle)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <text
            x={PAD.left - 6}
            y={y + 4}
            textAnchor="end"
            fill="var(--semantic-color-text-subtle)"
            fontSize={10}
          >
            {w}
          </text>
        </g>
      ))}

      {/* Goal line */}
      {goalY != null && (
        <g>
          <line
            x1={PAD.left} y1={goalY}
            x2={PAD.left + totalW} y2={goalY}
            stroke="var(--semantic-color-status-success-background)"
            strokeWidth={2}
            strokeDasharray="6 3"
          />
          <text
            x={PAD.left + totalW + 2}
            y={goalY + 4}
            fill="var(--semantic-color-status-success-text)"
            fontSize={10}
            fontWeight={600}
          >
            Goal
          </text>
        </g>
      )}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="var(--semantic-color-action-background)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={xOf(i)}
          cy={yOf(p.weight)}
          r={i === points.length - 1 ? 5 : 3}
          fill={i === points.length - 1 ? 'var(--semantic-color-action-background)' : 'var(--semantic-color-surface-page)'}
          stroke="var(--semantic-color-action-background)"
          strokeWidth={2}
        />
      ))}

      {/* X-axis labels */}
      {xLabels.map(i => (
        <text
          key={i}
          x={xOf(i)}
          y={H + PAD.top + 14}
          textAnchor="middle"
          fill="var(--semantic-color-text-subtle)"
          fontSize={10}
        >
          {formatDate(points[i].date)}
        </text>
      ))}
    </svg>
  );
}
