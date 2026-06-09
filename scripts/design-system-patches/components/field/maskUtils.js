// Shared mask utilities for PhoneField and ZipField.
// '#' in a mask is a digit placeholder; any other character is a literal separator.

export function buildDisplay(digits, mask) {
  let out = "", di = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === "#") {
      out += di < digits.length ? digits[di++] : "_";
    } else {
      out += mask[i];
    }
  }
  return out;
}

export const extractDigits = (v) => v.replace(/\D/g, "");
export const maskMaxDigits  = (mask) => [...mask].filter(c => c === "#").length;

// Returns the index in the mask string where the next digit should go.
// Equivalently: the position of the first unfilled '_' in buildDisplay output.
export function nextSlotIndex(digitCount, mask) {
  let dc = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === "#") {
      if (dc === digitCount) return i;
      dc++;
    }
  }
  return mask.length;
}
