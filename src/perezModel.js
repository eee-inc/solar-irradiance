import pkg from "suncalc";
import { getAngleOfIncidence } from "./vectorMath.js";
const { getPosition } = pkg;

export function getETRadiation(date, zenith) {
  const S = 1367; // solar constant in W/m^2

  const doy = getDayOfYear(date);

  const cosZenith = Math.cos(zenith);

  const etr = S * cosZenith * (1 + 0.033 * Math.cos((2 * Math.PI * doy) / 365));

  return etr;
}

export function calculateETIrradiance(date) {
  const doy = getDayOfYear(date);
  const Gsc = 1367; // solar constant in W/m^2
  const declinationAngle = calculateDeclinationAngle(doy);
  const hourAngle = calculateHourAngle(date);
  const cosZenithAngle = calculateCosineOfZenithAngle(
    declinationAngle,
    hourAngle
  );
  const ETR = Gsc * cosZenithAngle;
  return ETR;
}

export function calculateDeclinationAngle(dayOfYear) {
  const radians = ((2 * Math.PI) / 365) * (dayOfYear - 1);
  const declinationAngle =
    0.006918 -
    0.399912 * Math.cos(radians) +
    0.070257 * Math.sin(radians) -
    0.006758 * Math.cos(2 * radians) +
    0.000907 * Math.sin(2 * radians) -
    0.002697 * Math.cos(3 * radians) +
    0.00148 * Math.sin(3 * radians);
  return declinationAngle;
}

export function calculateHourAngle(date) {
  const solarNoon = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0
  );
  const hourAngle =
    ((date.getTime() - solarNoon.getTime()) / (1000 * 60 * 60)) * 15;
  return hourAngle;
}

export function calculateCosineOfZenithAngle(declinationAngle, hourAngle) {
  const latitude = 42; // example latitude in degrees
  const radians = Math.PI / 180;
  const sinLatitude = Math.sin(latitude * radians);
  const cosLatitude = Math.cos(latitude * radians);
  const sinDeclinationAngle = Math.sin(declinationAngle);
  const cosDeclinationAngle = Math.cos(declinationAngle);
  const sinHourAngle = Math.sin(hourAngle * radians);
  const cosHourAngle = Math.cos(hourAngle * radians);
  const cosZenithAngle =
    sinLatitude * sinDeclinationAngle +
    cosLatitude * cosDeclinationAngle * cosHourAngle;
  return cosZenithAngle;
}

export function perezModel({
  solarZenith,
  solarAltitude,
  extraterrestrialIrradiance,
  date,
  aerosolOpticalDepth,
  waterVaporContent,
  ozoneContent,
  altitude,
}) {
  const doy = getDayOfYear(date);
  const refractionCorrection =
    0.96 /
    Math.pow(
      Math.tan(
        ((0.5 * Math.PI) / 180.0) *
          (90.0 - solarZenith + 7.31 / (solarZenith + 4.4))
      ),
      1.02
    );
  const zenithCorrected =
    (Math.PI / 180.0) * Math.min(87.0, solarZenith + refractionCorrection);

  const AM = 1 / Math.cos(zenithCorrected);
  const amRelative = Math.exp(-0.0001184 * solarAltitude);
  const opticalDepth =
    aerosolOpticalDepth +
    0.174 +
    0.035 * Math.log(AM) -
    0.345 * amRelative +
    0.056 * amRelative * Math.log(AM);
  const waterVaporCorrection =
    0.0000509 * solarAltitude + 0.000000256 * solarAltitude ** 2;
  const ozoneCorrection = 0.3 * Math.exp(-0.009 * solarAltitude * ozoneContent);

  const diffuseIrradiance =
    extraterrestrialIrradiance *
    (1.0 +
      0.033 * Math.cos((Math.PI / 180.0) * ((360.0 * (doy - 2.0)) / 365.0)));
  const cosZenith = Math.cos(zenithCorrected);
  const airMass = 1.0 / cosZenith;

  const { T: tau } = transmittance({
    aerosolOpticalDepth,
    waterVaporContent,
    ozoneContent,
    airMass,
    ETR: calculateETIrradiance(date),
    zenith: zenithCorrected,
    date,
  });

  // I0 is the extraterrestrial radiation for the specific date and time (in W/m^2)
  const IO = getETRadiation(date, zenithCorrected);
  // DNI = I0 * cos(θ) * tau
  const DNI = IO * Math.cos(zenithCorrected) * tau;

  console.log(IO, Math.cos(zenithCorrected), tau);

  const extraTerrestrialHorizontal = extraterrestrialIrradiance * cosZenith;

  const diffuseHorizontal =
    (diffuseIrradiance * (1.0 + Math.cos((Math.PI / 180.0) * solarAltitude))) /
    2.0;
  const directHorizontal = Math.max(0, DNI * cosZenith);

  const diffuseHorizontalCorrected =
    diffuseHorizontal * (1.0 - 0.75 * Math.pow(waterVaporCorrection, 0.4));
  const directHorizontalCorrected =
    directHorizontal * (1.0 - 0.75 * Math.pow(waterVaporCorrection, 0.4));

  const GHI =
    diffuseHorizontalCorrected +
    directHorizontalCorrected +
    extraTerrestrialHorizontal *
      0.1 *
      Math.exp(
        -opticalDepth * (1.0 + 0.1 * airMass) -
          0.12 * (waterVaporContent / Math.sin(zenithCorrected))
      );
  const DHI = GHI - cosZenith * DNI;

  return { GHI, DHI, DNI };
}

export const getEffectiveIrradiance = (DNI, DHI, AOI) => {
  const cosThetaZ = Math.cos(AOI);

  // compute the diffuse fraction
  const diffuseFraction = DHI / (DNI / cosThetaZ + DHI);

  // compute the effective irradiance
  const directComponent = DNI * cosThetaZ;
  const diffuseComponent = DHI * diffuseFraction;

  console.log(
    `DHI: ${Number(DHI).toFixed(2)}`,
    `DNI: ${Number(DNI).toFixed(2)}`,
    `AOI: ${Number(AOI).toFixed(2)}`
  );
  const effectiveIrradiance = directComponent + diffuseComponent;

  return effectiveIrradiance;
};

export function perezModelPerMinute({
  panelAzimuth,
  panelElevation,
  latitude,
  longitude,
  date,
  dt, // hours
  resolution, // units/hour
  panelRating,
}) {
  const numUnits = dt * resolution;
  const resolutionMs = (1 / resolution) * 60 * 60 * 1000;
  const irradiancePointValues = new Array(numUnits).fill(null).map((_, i) => {
    // should get these values from a weather library
    const aerosolOpticalDepth = 0.1;
    const waterVaporContent = 1.5; // cm
    const ozoneContent = 300; // DU

    const time = new Date(date.getTime() + i * resolutionMs);
    const { altitude: solarAltitude, azimuth: solarAzimuth } = getPosition(
      time,
      latitude,
      longitude
    );
    const guardedSolarAltitude = solarAltitude < 0 ? 0 : solarAltitude;
    const AOI = getAngleOfIncidence(
      panelAzimuth,
      panelElevation,
      solarAzimuth,
      guardedSolarAltitude
    );
    const solarZenith = Math.acos(
      Math.cos(90 - guardedSolarAltitude) * Math.cos(solarAzimuth) +
        Math.sin(90 - guardedSolarAltitude) *
          Math.sin(solarAzimuth) *
          Math.cos(latitude)
    );
    const etr = calculateETIrradiance(time);
    const { DNI, GHI, DHI } = perezModel({
      solarZenith,
      solarAltitude: guardedSolarAltitude,
      extraterrestrialIrradiance: etr,
      date: time,
      aerosolOpticalDepth,
      waterVaporContent,
      ozoneContent,
    });

    const effectiveIrradiance = getEffectiveIrradiance(DNI, DHI, AOI); // W/m^2
    const payload = {
      time: new Date(time).getTime(),
      value: effectiveIrradiance,
    };
    // console.log(payload);
    return payload;
  });

  const energy = calculateEnergyGenerated(irradiancePointValues, panelRating);
  return { energy };
}
export function calculateEnergyOutput(
  panelRating,
  effectiveIrradiance,
  duration
) {
  const powerOutput = (panelRating * effectiveIrradiance) / 1000; // Convert effective irradiance from kW/m² to W/m²
  const energyOutput = powerOutput * duration;
  return energyOutput;
}

export function calculateEnergyGenerated(data, panelRating) {
  return data.reduce((acc, curr, index, array) => {
    if (index === 0) {
      return acc;
    }
    const prev = array[index - 1];
    const irradianceAverage = (prev.value + curr.value) / 2;
    const dt = (curr.time - prev.time) / (60 * 60 * 1000); // hours
    const energyGenerated = calculateEnergyOutput(
      panelRating,
      irradianceAverage,
      dt
    );
    return acc + energyGenerated;
  }, 0);
}

function transmittance({
  aerosolOpticalDepth,
  waterVaporContent,
  ozoneContent,
  airMass,
  ETR,
  zenith,
  alpha = 0.2, // molecular absorption coefficient
  lambda = 0.55, // wavelength of light in micrometers
  k = 0.3, // diffuse fraction model parameter,
  cloudCoverFraction = 0.3,
  date,
}) {
  console.log({
    aerosolOpticalDepth,
    waterVaporContent,
    ozoneContent,
    airMass,
    ETR,
    zenith,
    alpha, // molecular absorption coefficient
    lambda, // wavelength of light in micrometers
    k, // diffuse fraction model parameter,
    cloudCoverFraction,
    date,
  });
  // convert solar zenith angle to radians
  const solarZenithAngleRad = (zenith * Math.PI) / 180;

  // Tr is the transmittance due to Rayleigh scattering
  const Tr = 0.008569 * lambda ** -4 * airMass;

  // Tm is the transmittance due to molecular (air) absorption
  // Tm = e^(-alpha * airmass)
  // airmass = 1 / cos(zenith angle)
  const Tm = Math.exp((-alpha * airMass) / Math.cos(solarZenithAngleRad));

  // Tc is the transmittance due to cloud cover
  const Tc = Math.exp(-k * cloudCoverFraction);

  // Tc is the transmittance due aerosols
  const B = calculateAerosolOpticalDepth(aerosolOpticalDepth);

  // To is the transmittance due to water vapor
  const WVOD = calculateWaterVaporOpticalDepth(waterVaporContent);

  // To is the transmittance due to ozone absorption
  const To = calculateOzoneOpticalDepth(ozoneContent);

  // compute the total optical depth
  const Tsum = Tr + Tm + B + WVOD + To + Tc;

  const year = date.getFullYear(); // Get the year of the date
  const jan1 = new Date(year, 0, 1); // January is 0, so 0 is passed as the month argument

  // T is the transmittance due to atmospheric gases and aerosols
  const T =
    Math.exp(-Tsum / Math.sin(solarZenithAngleRad)) *
    Math.pow(ETR / calculateETIrradiance(jan1), Math.cos(solarZenithAngleRad));

  return { Tr, Tm, Tc, B, WVOD, To, T };
}

export function calculateRayleighOpticalDepth(airMass) {
  const lambda = 0.55; // wavelength of light in micrometers
  const k = 0.008569 * lambda ** -4; // constant factor
  const rayleighOpticalDepth = k * airMass;

  return rayleighOpticalDepth;
}

export function calculateAerosolOpticalDepth(aerosolDepth) {
  // constants
  const p = 1013.0; // air pressure (millibars)
  const t = 288.0; // temperature (Kelvin)
  const R = 287.0; // gas constant for air (J/kg*K)
  const g = 9.8; // acceleration due to gravity (m/s^2)

  // calculate the aerosol optical depth
  const AOD =
    (0.008569 * aerosolDepth * p) / (t * Math.exp((-g * 0.03) / (R * t)));

  return AOD;
}

export function calculateWaterVaporOpticalDepth(waterVaporContent) {
  // Constants
  const M = 18.01534; // molar mass of water vapor
  const R = 8.31447; // universal gas constant

  // Convert water vapor content from g/m^3 to kg/m^3
  const waterVaporDensity = waterVaporContent / 1000;

  // Calculate the water vapor scale height
  const waterVaporScaleHeight = (R * 1000) / (M * 9.81);

  // Calculate the water vapor optical depth
  const waterVaporOpticalDepth =
    0.008569 * waterVaporDensity * waterVaporScaleHeight;

  return waterVaporOpticalDepth;
}

export function calculateOzoneOpticalDepth(ozoneContent) {
  const ozoneCrossSection = 2.68e-23; // cm^2/molecule at 310 nm
  const Avogadro = 6.02214179e23; // molecules/mol
  const airMolecularWeight = 28.9644; // g/mol
  const rho = 2.687e19; // molecules/cm^3 at 293 K and 1013 hPa

  const ozoneNumberDensity =
    (ozoneContent / ((48 * airMolecularWeight) / Avogadro)) * rho;
  const ozoneOpticalDepth = ozoneNumberDensity * ozoneCrossSection;

  return ozoneOpticalDepth;
}
