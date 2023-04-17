import * as THREE from "three";
export function getAngleOfIncidence(
  faceAzimuth,
  faceElevation,
  bodyAzimuth,
  bodyAltitude
) {
  const faceNormal = getFaceNormal(faceAzimuth, faceElevation);
  const sunDirection = getSunDirection(bodyAzimuth, bodyAltitude);
  const angleOfIncidence =
    Math.acos(faceNormal.dot(sunDirection)) * (180 / Math.PI);
  const AOIRad = (angleOfIncidence * Math.PI) / 180;
  return AOIRad;
}

export function getFaceNormal(azimuth, elevation) {
  const azimuthRad = (azimuth * Math.PI) / 180;
  const elevationRad = (elevation * Math.PI) / 180;
  const x = Math.cos(azimuthRad) * Math.cos(elevationRad);
  const y = Math.sin(azimuthRad) * Math.cos(elevationRad);
  const z = Math.sin(elevationRad);
  return new THREE.Vector3(x, y, z).normalize();
}

export function getSunDirection(azimuth, altitude) {
  const azimuthRad = (azimuth * Math.PI) / 180;
  const altitudeRad = (altitude * Math.PI) / 180;
  const x = Math.cos(altitudeRad) * Math.sin(azimuthRad);
  const y = Math.cos(altitudeRad) * Math.cos(azimuthRad);
  const z = Math.sin(altitudeRad);
  return new THREE.Vector3(x, y, z).normalize();
}
