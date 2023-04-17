/**
 *
 * @param latitude The observer's latitude, measured in degrees
 * @param declination The declination angle of the celestial body, measured in degrees
 * @param hourAngle The hour angle of the celestial body, measured in degrees
 * @returns Cosine of the zenith angle, which is a number between 1 and 0.
 */
const cosZenithAngle = (
  latitude: number,
  declination: number,
  hourAngle: number
) => {
  const latRad = (latitude * Math.PI) / 180; // convert latitude to radians
  const decRad = (declination * Math.PI) / 180; // convert declination to radians
  const haRad = (hourAngle * Math.PI) / 180; // convert hour angle to radians

  const cosZenith =
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);

  return cosZenith;
};
export default cosZenithAngle;
