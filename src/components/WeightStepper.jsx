import { useRef, useEffect } from 'react';
import {  Heading, IconButton, Paragraph, Stack } from '@gtivr4/a1-design-system-react';

const STEP = 1;
const FAST_STEP = 5;
const HOLD_DELAY = 400;
const HOLD_INTERVAL = 80;

export function WeightStepper({ value, onChange, unit = 'lbs', min = 50, max = 700 }) {
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  function clamp(v) {
    return Math.max(min, Math.min(max, Math.round(v)));
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

  const display = value != null && !Number.isNaN(Number(value))
    ? String(Math.round(Number(value)))
    : '—';

  return (
    <Stack direction="row" gap="lg" align='center'>

      

            <IconButton
        icon="remove"
                variant='secondary'

                label="Decrease weight"
        onClick={() => adjust(-STEP)}
        onPointerDown={() => startHold(-STEP)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
      />

      
        <Heading size="jumbo" type='display'>
          {display}
        </Heading>
       
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
