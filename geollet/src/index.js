import L from 'leaflet';

const map = L.map('map').setView([42.6977, 23.3219], 13); // Set the coordinates to Sofia (latitude, longitude) and adjust the desired zoom level.

// // Add a basemap layer
// https://b.tile.openstreetmap.org/11/1157/755.png
// https://a.tile.openstreetmap.org/11/1158/753.png
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  opacity: 0.5, // Set the opacity to 0.5 (50%)
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
}).addTo(map);

// // Add a basemap layer
// L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
//   attribution: 'Map data &copy; <a href="https://www.opentopomap.org/">OpenTopoMap</a> contributors',
// }).addTo(map);

const url = 'https://gis.sofiaplan.bg/arcgis/rest/services/basic_data/FeatureServer/0/query';
const queryParams = {
  where: '1=1', // Query condition (optional)
  outFields: '*', // Fields to include in the response (optional)
  returnGeometry: true, // Include geometry in the response
  f: 'geojson', // Specify the desired response format as GeoJSON
};
//  build params string
const  paramsString = 
  Object.entries(queryParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

// Construct the query URL with the parameters
const queryUrl = `${url}?${paramsString}`;

// Send the request to fetch the GeoJSON data
// fetch(`${url}?${new URLSearchParams(queryParams)}`)
fetch(queryUrl)
  .then(response => response.json())
  .then(data => {
    const dotIcon = L.divIcon({
      className: 'dot-icon',
      html: '<svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="blue" /></svg>',
      iconSize: [8, 8],
    });

    const geojsonLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => L.marker(latlng, { icon: dotIcon }),
      onEachFeature: function (feature, layer) {
        layer.on('click', function (event) {
          // Handle the click event
          document.getElementById('status').innerHTML = `${feature.properties.name}(${feature.properties.code})`;
          console.log('Clicked feature:', feature);
          console.log('Clicked coordinates:', event.latlng);
        });
      },
    }).addTo(map);

    map.fitBounds(geojsonLayer.getBounds());
  })
  .catch(error => {
    console.error(error);
  });


  ////

// const urlCycle = 'https://api.sofiaplan.bg/datasets/290'
const urlCycle = '/velo.json'

fetch(urlCycle)
  .then(response => response.json())
  .then(data => {
    const filteredData = {
      type: 'FeatureCollection',
      features: data.features.filter(feature => 
        feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString'),
    };
    
    const multiLineLayer = L.geoJSON(filteredData, {
      style: {
        fill: false,
        weight: 3,
        color: 'green',
      },
    }).addTo(map);
  })
  .catch(error => {
    console.error(error);
  });


const urlBoundaries = 'https://gis.sofiaplan.bg/arcgis/rest/services/basic_data/FeatureServer/6';

fetch(`${urlBoundaries}/query?where=1=1&f=geojson`)
  .then(response => response.json())
  .then(data => {
    const polygonsLayer = L.geoJSON(data, {
      style: {
        fillColor: 'yellow',
        fillOpacity: 0.5,
        color: 'black',
        weight: 1,
        strokeDasharray: '5.20 5.20', // Set the stroke dash array
        strokeDashoffset: '19.35', // Set the stroke dash offset
      },
      onEachFeature: function (feature, layer) {
        // Add custom behavior or popups for each polygon feature
      },
    }).addTo(map);

    map.fitBounds(polygonsLayer.getBounds());
  })
  .catch(error => {
    console.error(error);
  });
