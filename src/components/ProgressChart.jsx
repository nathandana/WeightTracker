import { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { MessageEmptyState } from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { formatDate as formatLocaleDate } from '../utils/locale.js';

function formatDate(iso, locale) {
  return formatLocaleDate(iso, locale, { month: 'numeric', day: 'numeric' });
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

export function ProgressChart({ data = [], unit = 'lbs', goalWeight, height = 320, locale = 'en' }) {
  const l = useLabel;
  const points = useMemo(() =>
    data.map(d => ({ date: formatDate(d.date, locale), weight: Number(d.weight) })),
  [data, locale]);

  if (points.length < 2) {
    return (
      <MessageEmptyState
        icon="info"
        scale="section"
        title={l('progress.chartEmptyMin', 'Log at least 2 days to see your weight chart.')}
      />
    );
  }

  const weights = points.map(p => p.weight);
  const allWeights = goalWeight != null ? [...weights, Number(goalWeight)] : weights;
  const minW = Math.floor(Math.min(...allWeights) - 2);
  const maxW = Math.ceil(Math.max(...allWeights) + 2);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="var(--semantic-color-border-default)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--semantic-color-text-muted)', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[minW, maxW]}
          tick={{ fill: 'var(--semantic-color-text-muted)', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={v => `${v}`}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        {goalWeight != null && (
          <ReferenceLine
            y={Number(goalWeight)}
            stroke="var(--semantic-color-status-success-background)"
            strokeDasharray="10 4"
            strokeWidth={3}
            label={{
              value: l('progress.goal', 'Goal'),
              position: 'insideTopRight',
              fill: 'var(--semantic-color-status-success-background)',
              fontSize: 13,
              fontWeight: 700,
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="weight"
          stroke="var(--semantic-color-action-background)"
          strokeWidth={4}
          dot={{ r: 5, fill: 'var(--semantic-color-action-background)', strokeWidth: 0 }}
          activeDot={{ r: 7, fill: 'var(--semantic-color-action-background)', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
