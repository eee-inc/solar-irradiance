import getDayOfYear from "./getDayOfYear.js";

/**
 *
 * @param date The date to compute for
 * @returns
 */
export const declinationAngle = (date: Date) => {
  const radians = ((2 * Math.PI) / 365) * (getDayOfYear(date) - 1);
  const declinationAngle =
    0.006918 -
    0.399912 * Math.cos(radians) +
    0.070257 * Math.sin(radians) -
    0.006758 * Math.cos(2 * radians) +
    0.000907 * Math.sin(2 * radians) -
    0.002697 * Math.cos(3 * radians) +
    0.00148 * Math.sin(3 * radians);
  return declinationAngle;
};
