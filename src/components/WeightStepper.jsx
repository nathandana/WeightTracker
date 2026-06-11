import { useState, useEffect, useRef } from 'react';
import { NumberField, IconButton, Stack } from '@gtivr4/a1-design-system-react';

const STEP = 0.5;
const FAST_STEP = 5;
const HOLD_DELAY = 400;
const HOLD_INTERVAL = 100;

export function WeightStepper({ value, onChange, unit = 'lbs', min = 50, max = 700 }) {
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const display = value != null && !Number.isNaN(Number(value))
    ? Number(value).toFixed(1)
    : '';

  const [inputStr, setInputStr] = useState(display);

  useEffect(() => {
    setInputStr(display);
  }, [display]);

  function clamp(v) {
    return Math.max(min, Math.min(max, Math.round(v * 10) / 10));
  }

  function adjust(delta) {
    onChange(clamp(Number(value) + delta));
  }

  function startHold(delta) {
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        onChange(prev => clamp(Number(prev) + FAST_STEP * Math.sign(delta)));
      }, HOLD_INTERVAL);
    }, HOLD_DELAY);
  }

  function stopHold() {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
  }

  useEffect(() => () => stopHold(), []);

  function handleInputChange(ev) {
    setInputStr(ev.target.value);
  }

  function handleInputBlur() {
    const parsed = parseFloat(inputStr);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed));
    } else {
      setInputStr(display);
    }
  }

  return (
    <Stack direction="row" gap="sm" align='center' wrap>
      <IconButton
        icon="remove"
        variant='secondary'
        label="Decrease weight"
        onClick={() => adjust(-STEP)}
        onPointerDown={() => startHold(-STEP)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
      />

      <NumberField
        className="boldInput weightInput"
        aria-label={`Weight in ${unit}`}
        value={inputStr}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        min={min}
        max={max}
        step={STEP}
        unit={unit}
        size="comfortable"
        inputMode="decimal"
      />

      <IconButton
        icon="add"
        variant='secondary'
        label="Increase weight"
        onClick={() => adjust(STEP)}
        onPointerDown={() => startHold(STEP)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
      />
    </Stack>
  );
}
