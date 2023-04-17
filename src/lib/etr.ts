import getDayOfYear from "./getDayOfYear.js";
import { Body, HourAngle, Observer } from "./astronomy.js";
import { declinationAngle } from "./declinationAngle.js";
import cosZenithAngle from "./cosZenithAngle.js";
const etr = (date: Date, zenith: number, observer: Observer) => {
  return {
    radiation: radiation(date, zenith),
    irradiance: irradiance(date, observer),
  };
};

/**
 *
 * @param date The date to compute for
 * @param zenith The zenith of the sun
 * @returns
 */
export const radiation = (date: Date, zenith: number) => {
  const S = 1367; // solar constant in W/m^2

  const doy = getDayOfYear(date);

  const cosZenith = Math.cos(zenith);

  const etr = S * cosZenith * (1 + 0.033 * Math.cos((2 * Math.PI * doy) / 365));

  return etr;
};

/**
 *
 * @param date The date to compute for
 * @returns
 */
export const irradiance = (date: Date, observer: Observer) => {
  const Gsc = 1367; // solar constant in W/m^2
  const d = declinationAngle(date);
  const hourAngle = HourAngle(Body.Sun, date, observer);
  const cza = cosZenithAngle(observer.latitude, d, hourAngle);
  const ETR = Gsc * cza;
  return ETR;
};

export default etr;
