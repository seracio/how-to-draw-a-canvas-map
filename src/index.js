// @flow
import Canvas from 'canvas';
import { max } from 'd3-array';
import { geoPath } from 'd3-geo';
import { geoWinkel3 } from 'd3-geo-projection';
import { scaleLinear } from 'd3-scale';
import fs from 'fs';
import _ from 'lodash/fp';

// helper to read a json file and parse it
const readJSON: Function = _.flow(fs.readFileSync, JSON.parse);

const size = 2500;
// our big geojson
const geojson: Object = readJSON('data/communes-metropole.json');

// canvas init
const canvas = new Canvas(size, size);
const context = canvas.getContext('2d');

// projection
const projection = geoWinkel3()
  .fitExtent([[0, 0], [size, size]], geojson)
  .precision(1);
// path generator
const pathGen: Function = geoPath()
  .projection(projection)
  .context(context);

const getZ = _.get('properties.Z_MOYEN');
const maxZ = _.flow(
  _.get('features'),
  _.map(getZ),
  max
)(geojson);
const scaleZ = scaleLinear()
  .domain([0, maxZ])
  .range(['white', 'red']);

geojson.features.forEach(feature => {
  context.beginPath();
  pathGen(feature);
  const color = _.flow(getZ, scaleZ)(feature);
  context.strokeStyle = color;
  context.fillStyle = color;
  context.stroke();
  context.fill();
  context.closePath();
});

const out = fs.createWriteStream('output.png');
const stream = canvas.pngStream();

stream.on('data', function(chunk) {
  out.write(chunk);
});

stream.on('end', function() {
  console.log('saved png');
});