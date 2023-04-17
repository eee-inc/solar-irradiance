import { perezModelPerMinute } from "../perezModel.js";

// input parameters
const latitude = 42.337680175758315;
const longitude = -83.06782460812862;
const date = new Date("2023-04-14T00:00:00");
const dt = 24; // hours
const panelRating = 12000; // W/hour
const resolution = 1; // units/hour

const constants = {
  latitude,
  longitude,
  dt,
  resolution,
  date,
  panelRating,
};

const params = [
  // top panel
  {
    ...constants,
    panelElevation: 0,
    panelAzimuth: 90,
  },
  // side panel a
  {
    ...constants,
    panelElevation: 90,
    panelAzimuth: 90,
  },
  // side panel b
  {
    ...constants,
    panelElevation: 90,
    panelAzimuth: 180,
  },
];

params.map((p) => {
  const { energy } = perezModelPerMinute(p);
  console.log(`${Number(energy).toFixed(2)} W in ${p.dt} hours`);
});

////////
