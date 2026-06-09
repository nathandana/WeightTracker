import labels from '../labels/labels.json';

function getMessages(key) {
  const arr = labels.label.encouragement[key];
  if (!arr) return [];
  return arr;
}

function resolve(msgObj, locale) {
  if (locale && msgObj?.locale?.[locale]) return msgObj.locale[locale];
  return msgObj?.$value ?? '';
}

function pick(arr, seed) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.abs(seed) % arr.length];
}

export function getEncouragement({ percent, streak, weightChange, locale, seed = 0 }) {
  let key;

  if (percent >= 100) {
    key = 'goalReached';
  } else if (percent >= 75) {
    key = 'almostThere';
  } else if (percent >= 30) {
    key = 'goodProgress';
  } else if (percent >= 5) {
    key = 'earlyProgress';
  } else {
    key = 'justStarted';
  }

  // If weight went up since last entry, use supportive message
  if (weightChange > 0 && percent < 100 && percent > 0) {
    key = 'weightUp';
  }

  const messages = getMessages(key);
  const msg = resolve(pick(messages, seed), locale);

  // Streak bonus message
  let streakMsg = '';
  if (streak >= 3) {
    const streakMessages = getMessages('streak');
    streakMsg = resolve(pick(streakMessages, streak), locale);
  }

  return { message: msg, streakMessage: streakMsg };
}
