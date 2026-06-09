import { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { MessageEmptyState } from '@gtivr4/a1-design-system-react';

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--semantic-color-surface-raised)',
      border: '1px solid var(--semantic-color-border-subtle)',
      borderRadius: 'var(--base-border-radius-md)',
      padding: '8px 12px',
      fontSize: 13,
      color: 'var(--semantic-color-text-default)',
      boxShadow: 'var(--base-shadow-md)',
    }}>
      <div style={{ color: 'var(--semantic-color-text-muted)', marginBottom: 2 }}>{label}</div>
      <strong>{payload[0].value} {unit}</strong>
    </div>
  );
}

export function ProgressChart({ data = [], unit = 'lbs', goalWeight }) {
  const points = useMemo(() =>
    data.map(d => ({ date: formatDate(d.date), weight: Number(d.weight) })),
  [data]);

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
  const minW = Math.floor(Math.min(...allWeights) - 2);
  const maxW = Math.ceil(Math.max(...allWeights) + 2);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="var(--semantic-color-border-subtle)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--semantic-color-text-muted)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[minW, maxW]}
          tick={{ fill: 'var(--semantic-color-text-muted)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={38}
          tickFormatter={v => `${v}`}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        {goalWeight != null && (
          <ReferenceLine
            y={Number(goalWeight)}
            stroke="var(--semantic-color-status-success-text)"
            strokeDasharray="6 3"
            strokeWidth={2}
            label={{
              value: 'Goal',
              position: 'insideTopRight',
              fill: 'var(--semantic-color-status-success-text)',
              fontSize: 11,
              fontWeight: 600,
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="weight"
          stroke="var(--semantic-color-action-background)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: 'var(--semantic-color-action-background)', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: 'var(--semantic-color-action-background)', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
