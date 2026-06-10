import {
  BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer,
} from 'recharts';

const BMI_MIN = 15;
const BMI_MAX = 45;
const BMI_RANGE = BMI_MAX - BMI_MIN;

const bmiData = [{
  name: '',
  underweight: 18.5 - BMI_MIN,
  normal: 25 - 18.5,
  overweight: 30 - 25,
  obese: BMI_MAX - 30,
}];

const LABEL_STYLE = { fontSize: 10, color: 'var(--semantic-color-text-muted, #888)' };

export function BmiRangeChart({ bmi }) {
  if (!bmi?.value) return null;
  const pos = Math.min(BMI_RANGE - 0.5, Math.max(0.5, bmi.value - BMI_MIN));

  return (
    <div style={{ marginTop: 8 }}>
      <ResponsiveContainer width="100%" height={48}>
        <BarChart
          data={bmiData}
          layout="vertical"
          margin={{ top: 16, right: 8, bottom: 0, left: 8 }}
          barCategoryGap={0}
          barSize={28}
        >
          <XAxis type="number" domain={[0, BMI_RANGE]} hide />
          <YAxis type="category" dataKey="name" hide />
          <Bar dataKey="underweight" stackId="bmi" fill="#64b5f6" isAnimationActive={false} radius={[2, 0, 0, 2]} />
          <Bar dataKey="normal"      stackId="bmi" fill="#66bb6a" isAnimationActive={false} />
          <Bar dataKey="overweight"  stackId="bmi" fill="#ffa726" isAnimationActive={false} />
          <Bar dataKey="obese"       stackId="bmi" fill="#ef5350" isAnimationActive={false} radius={[0, 2, 2, 0]} />
          <ReferenceLine
            x={pos}
            stroke="var(--semantic-color-text-default, #222)"
            strokeWidth={2}
            label={{
              value: String(bmi.value),
              position: 'top',
              fill: 'var(--semantic-color-text-default, #222)',
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px 0' }}>
        <span style={LABEL_STYLE}>Underweight</span>
        <span style={LABEL_STYLE}>Healthy</span>
        <span style={LABEL_STYLE}>Overweight</span>
        <span style={LABEL_STYLE}>Obese</span>
      </div>
    </div>
  );
}
