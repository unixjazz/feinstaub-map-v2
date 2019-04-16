import leaflet from 'leaflet';
import hash from 'leaflet-hash';
import 'leaflet/dist/leaflet.css';

//use d3-require to call from the internet

import * as d3Selection from'd3-selection';
import * as d3Timer from'd3-timer';
import * as d3TimeFormat from'd3-time-format';
import * as d3Scale from'd3-scale';
import * as d3Array from'd3-array';
import * as d3Geo from'd3-geo';
//import * as d3Queue from'd3-queue';
import * as d3Request from'd3-request';
import * as d3Time from'd3-time';
import * as d3Hexbin from "d3-hexbin";
import * as d3Transistion from "d3-transition";

const d3 = Object.assign({}, d3Selection, d3Timer,d3TimeFormat,d3Scale,d3Array,d3Geo,d3Request,d3Time,d3Hexbin,d3Transistion);

import '../css/style.css';
import * as places from './places.js';
import * as zooms from './zooms.js';


//MAP

var hexagonheatmap;
var hmhexaPM_aktuell;
var hmhexaPM_AQI;
var hmhexatemp;
var hmhexahumi;
var hmhexapressure;

var map;
var tiles;

var selector1 = "PM10";

var openedGraph1 = [];

var is_click;

var locale = d3.timeFormatLocale({
	"dateTime": "%Y.%m.%d %H:%M:%S",
	"date": "%d.%m.%Y",
	"time": "%H:%M:%S",
	"periods": ["AM", "PM"],
	"days": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
	"shortDays": ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."],
	"months": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
	"shortMonths": ["Jan.", "Feb.", "Mar.", "Apr.", "Mai", "Jun.", "Jul.", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."]
});

var scale_options = {
				"PM10":		{
								valueDomain: [20, 40, 60, 100, 500],
								colorRange: ['#00796B', '#F9A825', '#E65100', '#DD2C00', '#960084']	
							},
				"PM2.5":	{
								valueDomain: [10, 20, 40, 60, 100],
								colorRange: ['#00796B', '#F9A825', '#E65100', '#DD2C00', '#960084']	
							},
				"Official_AQI_US": {
								valueDomain: [0,50,100,150,200,300],
								colorRange: ['#00E400','#FFFF00','#FF7E00','#FF0000','rgb(143, 63, 151)','#7E0023']	
							},
				"Temperature": {
								valueDomain: [-20, 0, 50],
								colorRange: ['#0022FE', '#FFFFFF', '#FF0000']	
							},
				"Humidity": {
								valueDomain: [0,100],
								colorRange: ['#FFFFFF', '#0000FF']	
							},
				"Pressure": {
								valueDomain: [926, 947.75, 969.50, 991.25, 1013, 1034.75, 1056.50, 1078.25, 1100],
								colorRange: ["#dd2e97", "#6b3b8f", "#2979b9", "#02B9ed", "#13ae52", "#c9d841", "#fad635", "#f0a03d", "#892725"]	
							}
				};

var panelIDs = {
					"PM10": [2,1],
					"PM25": [2,1],
					"Temperature": [4,3],
					"Humidity": [6,5],
					"Pressure": [8,7]
}


var div = d3.select("#sidebar").append("div")
				.attr("id", "table")
				.style("display", "none");

var tooltipDiv = document.getElementsByClassName('tooltip-div');

function console_log(text) {
	console.log(text);
}

window.onmousemove = function (e) {
	var x = e.clientX,
	y = e.clientY;

	for (var i = 0; i < tooltipDiv.length; i++) {
		tooltipDiv.item(i).style.top = (y - 10 )+ 'px';
		tooltipDiv.item(i).style.left = (x + 20) + 'px';
	};
};

var cooCenter = [50.495171, 9.730827];
var zoomLevel = 6;

if (location.hash) {
	var hash_params = location.hash.split("/");
	var cooCenter = [hash_params[1],hash_params[2]];
	var zoomLevel = hash_params[0].substring(1);
} else {
	var hostname = location.hostname;
	var hostname_parts = hostname.split(".");
	if (hostname_parts.length == 4) {
		var place = hostname_parts[0].toLowerCase();
		console_log(place);
		if (typeof places[place] !== 'undefined' && places[place] !== null) {
			var cooCenter = places[place];
			var zoomLevel = 11;
		}
		if (typeof zooms[place] !== 'undefined' && zooms[place] !== null) {
			var zoomLevel = zooms[place];
		}
		console_log("Center: "+cooCenter);
		console_log("Zoom: "+zoomLevel);
	}
};

window.onload=function(){
	
	document.getElementById('custom-select').style.display='inline-block';
	document.getElementById('legend_PM10').style.display='block';

	map.setView(cooCenter, zoomLevel);
	
	map.clicked = 0;

	hexagonheatmap = L.hexbinLayer(scale_options["PM10"]).addTo(map);

//	REVOIR ORDRE DANS FONCTION READY

	var all = document.getElementsByTagName("*");

//	console_log(all);

	d3.json("https://maps.luftdaten.info/data/v2/data.dust.min.json", function(error,data){ready(error,data,1);
		d3.json("https://maps.luftdaten.info/data/v2/data.24h.json", function(error,data){ready(error,data,2)});
		d3.json("https://maps.luftdaten.info/data/v2/data.temp.min.json", function(error,data){ready(error,data,3)});
	})

	d3.interval(function(){

		d3.selectAll('path.hexbin-hexagon').remove();

		d3.json("https://maps.luftdaten.info/data/v2/data.dust.min.json", function(error,data){ready(error,data,1);
			d3.json("https://maps.luftdaten.info/data/v2/data.24h.json", function(error,data){ready(error,data,2)});
			d3.json("https://maps.luftdaten.info/data/v2/data.temp.min.json", function(error,data){ready(error,data,3)});
		})

		console_log('reload')

	}, 300000);
	
	map.on('moveend', function() {hexagonheatmap._zoomChange();});
	map.on('move', function() {});

//	REVOIR LE DOUBLECLIQUE

	map.on('click', function(e) {
		console_log('Click');
		map.clicked = map.clicked + 1;
		setTimeout(function() {
			if(map.clicked == 1){
				map.setView([e.latlng.lat, e.latlng.lng], map.getZoom());
				map.clicked = 0;
			}
		}, 300);
	});
	map.on('dblclick', function(e) {
		console_log('Doubleclick');
		map.clicked = 0;
		map.zoomIn();
	});
};

map = L.map('map',{ zoomControl:true,minZoom:1,doubleClickZoom:false});

new L.Hash(map);

tiles = L.tileLayer('https://maps.luftdaten.info/tiles/{z}/{x}/{y}.png',{
			attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
			maxZoom: 18}).addTo(map);


function ready(error,data,num) {

	if (error) throw error;

	if (num == 1) {
		hmhexaPM_aktuell = data.reduce(function(filtered, item) {
			if (item.sensor.sensor_type.name == "SDS011" || item.sensor.sensor_type.name == "PMS1003" || item.sensor.sensor_type.name == "PMS3003" || item.sensor.sensor_type.name == "PMS5003" || item.sensor.sensor_type.name == "PMS6003" || item.sensor.sensor_type.name == "PMS7003" || item.sensor.sensor_type.name == "HPM" || item.sensor.sensor_type.name == "SPS30") {
				filtered.push({"data":{"PM10": parseInt(getRightValue(item.sensordatavalues,"P1")) , "PM25":parseInt( getRightValue(item.sensordatavalues,"P2"))}, "id":item.sensor.id, "latitude":item.location.latitude,"longitude":item.location.longitude})
			}
			return filtered;
		}, []);
//		console_log(hmhexaPM_aktuell);

	} else if (num == 2) {

		hmhexaPM_AQI = data.reduce(function(filtered, item) {
			if (item.sensor.sensor_type.name == "SDS011" || item.sensor.sensor_type.name == "PMS1003" || item.sensor.sensor_type.name == "PMS3003" || item.sensor.sensor_type.name == "PMS5003" || item.sensor.sensor_type.name == "PMS6003" || item.sensor.sensor_type.name == "PMS7003" || item.sensor.sensor_type.name == "HPM" || item.sensor.sensor_type.name == "SPS30") {
				var data_in = {"PM10": parseInt(getRightValue(item.sensordatavalues,"P1")), "PM25": parseInt(getRightValue(item.sensordatavalues,"P2"))}
				var data_out = officialaqius(data_in);
				if (typeof data_out != 'undefined') {
					filtered.push({"data":{"AQI": data_out.AQI, "origin": data_out.origin, "PM10": data_in.PM10, "PM25": data_in.PM25}, "id":item.sensor.id, "latitude":item.location.latitude,"longitude":item.location.longitude})
				} else {
					console_log("Failed:");
					console_log(item);
				}
			}
			return filtered;
		}, []);
//		console_log(hmhexaPM_AQI);

	} else {

//		REVOIR LES TYPES DE SENSORS

		hmhexatemp = data.reduce(function(filtered, item) {
			if (item.sensor.sensor_type.name == "BME280" || item.sensor.sensor_type.name == "DHT22") {
				filtered.push({"data":{"Temperature":parseInt(getRightValue(item.sensordatavalues,"temperature"))}, "id":item.sensor.id, "latitude":item.location.latitude,"longitude":item.location.longitude})
			}
			return filtered;
		}, []);

		hmhexahumi = data.reduce(function(filtered, item) {
			if (item.sensor.sensor_type.name == "BME280" || item.sensor.sensor_type.name == "DHT22") {
				filtered.push({"data":{"Humidity":parseInt(getRightValue(item.sensordatavalues,"humidity"))}, "id":item.sensor.id, "latitude":item.location.latitude,"longitude":item.location.longitude})
			}
			return filtered;
		}, []);

		hmhexapressure = data.reduce(function(filtered, item) {
			if (item.sensor.sensor_type.name == "BME280" || item.sensor.sensor_type.name == "BMP180" || item.sensor.sensor_type.name == "BMP280" ) {
				var value_temp = parseInt(getRightValue(item.sensordatavalues,"pressure_at_sealevel"))/100;
				if ((value_temp > 850) && (value_temp < 1200)) {
					filtered.push({"data":{"Pressure":value_temp}, "id":item.sensor.id, "latitude":item.location.latitude,"longitude":item.location.longitude})
				}
			}
			return filtered;
		}, []);

	}

	var dateParser = d3.timeParse("%Y-%m-%d %H:%M:%S");
	var timestamp = dateParser(data[0].timestamp);

	console_log(timestamp);

	var localTime = new Date();
	var timeOffset = localTime.getTimezoneOffset();

	console_log(timeOffset);

	var newTime = d3.timeMinute.offset(timestamp, -(timeOffset));

	console_log(newTime);

//	var dateFormater = d3.timeFormat("%A %d %B %Y %H:%M:%S");

//	var dateFormater = locale.format("%A, %d. %B %Y, um %H:%M:%S");
	var dateFormater = locale.format("%H:%M:%S");

	document.getElementById('update').innerHTML = "Last update: " + dateFormater(newTime);

//	document.getElementById('update').innerHTML = "Last update: " + data[0][0].timestamp;
	
	
	if(num == 1 && selector1 == "PM10") {hexagonheatmap.initialize(scale_options[selector1]);hexagonheatmap.data(hmhexaPM_aktuell);};
	if(num == 1 && selector1 == "PM25") {hexagonheatmap.initialize(scale_options[selector1]);hexagonheatmap.data(hmhexaPM_aktuell);};
	if(num == 2 && selector1 == "Official_AQI_US"){hexagonheatmap.initialize(scale_options[selector1]);hexagonheatmap.data(hmhexaPM_AQI);};
	if(num == 3 && selector1 == "Temperature"){hexagonheatmap.initialize(scale_options[selector1]);hexagonheatmap.data(hmhexatemp);};
	if(num == 3 && selector1 == "Humidity"){hexagonheatmap.initialize(scale_options[selector1]);hexagonheatmap.data(hmhexahumi);};
	if(num == 3 && selector1 == "Pressure"){hexagonheatmap.initialize(scale_options[selector1]);hexagonheatmap.data(hmhexapressure);};

	document.getElementById('loading').style.display='none';

};

function reload(val){
	d3.selectAll('path.hexbin-hexagon').remove();
	d3.select("#results").remove();
	document.getElementById('sidebar').style.display='none';

	console_log(val);

	selector1 = val;
	
	document.getElementById('legend_Official_AQI_US').style.display='none';
	document.getElementById('legend_PM10').style.display='none';
	document.getElementById('legend_PM25').style.display='none';
	document.getElementById('legend_Temperature').style.display='none';
	document.getElementById('legend_Humidity').style.display='none';
	document.getElementById('legend_Pressure').style.display='none';

	hexagonheatmap.initialize(scale_options[val]);

	document.getElementById('legend_'+val).style.display='block';

	switch (val) {
		case "PM10":
					hexagonheatmap.data(hmhexaPM_aktuell);
					break;
		case "PM25":
					hexagonheatmap.data(hmhexaPM_aktuell);
					break;
		case "Official_AQI_US":
					hexagonheatmap.data(hmhexaPM_AQI);
					break;
		case "Temperature":
					hexagonheatmap.data(hmhexatemp);
					break;
		case "Humidity":
					hexagonheatmap.data(hmhexahumi);
					break;
		case "Pressure":
					hexagonheatmap.data(hmhexapressure);
					break;
	}

	if (document.getElementById("sidebar").style.display === "block") {
		document.getElementById("sidebar").style.display = "none";
		if(!d3.select("#results").empty()){
			d3.select("#results").remove();
		};
	};

};

function getRightValue(array,type){
	var value;
	array.forEach(function(item){
		if (item.value_type == type){value = item.value;};
	});
	return value;
};

function color(val){
	var col= parseInt(val);

	if(val>= 0 && val < 25){ return "#00796b";};
	if(val>= 25 && val < 50){
		var couleur = interpolColor('#00796b','#f9a825',(col-25)/25);
		return couleur;
	};
	if(val>= 50 && val < 75){
		var couleur = interpolColor('#f9a825','#e65100',(col-50)/25);
		return couleur;
	};
	if(val>= 75 && val < 100){
		var couleur = interpolColor('#e65100','#dd2c00',(col-75)/25);
		return couleur;
	};
	if(val>=100 && val < 500){
		var couleur = interpolColor('#dd2c00','#8c0084',(col-100)/400);
		return couleur;
	};

	if(val>=100 && val < 500){ return "#8c0084";};
};

function interpolColor(a, b, amount) {
	var ah = parseInt(a.replace(/#/g, ''), 16),
			ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
			bh = parseInt(b.replace(/#/g, ''), 16),
			br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
			rr = ar + amount * (br - ar),
			rg = ag + amount * (bg - ag),
			rb = ab + amount * (bb - ab);
//	console_log('#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1));
	return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
};

//MENU


var menu = document.getElementById("menu");
menu.addEventListener("click", function(e) {

	var x = document.getElementById("sidebar");

	if (x.style.display === "block") {
		x.style.display = "none";
		if(!d3.select("#results").empty()){
			d3.select("#results").remove();
		};
	} else {
		x.style.display = "block";
	};
});

var close_link = document.getElementById("close");
close_link.addEventListener("click", function(e) {

	var x = document.getElementById("sidebar");

	if (x.style.display === "block") {
		x.style.display = "none";
		if(!d3.select("#results").empty()){
			d3.select("#results").remove();
		};
	} else {
		x.style.display = "block";
	};
});

var erkl = document.getElementById("erklaerung");
erkl.addEventListener("click", function(e) {

	var x = document.getElementById("map-info");

	console_log(x.style.display);
	if (x.style.display === "none") {
		x.style.display = "block";
		document.getElementById("erklaerung").innerHTML = "Erklärung ausblenden";
	} else {
		x.style.display = "none";
		document.getElementById("erklaerung").innerHTML = "Erklärung einblenden";
	};
});

//HEXBINS

L.HexbinLayer = L.Layer.extend({
	_undef (a) { return typeof a === 'undefined' },
	options: {
		radius: 25,
		opacity: 0.6,
		duration: 200,
		onmouseover: undefined,
		onmouseout: undefined,

//		REVOIR LE DOUBLECLIQUE

		click: 	function(e) {
					setTimeout(function() {
						if(map.clicked == 1){
							sensorNr(e)
						}
					}, 300)},

		lng: function (d) {
			return d.longitude
		},
		lat: function (d) {
			return d.latitude
		},
		value: function (d) {

//		Median everywhere!

			if (selector1 == "PM10"){return parseInt(d3.median(d, (o) => o.o.data.PM10))}
			if (selector1 == "PM25"){return parseInt(d3.median(d, (o) => o.o.data.PM25))}
			if (selector1 == "Official_AQI_US"){return d3.median(d, (o) => o.o.data.AQI)}
			if (selector1 == "Temperature"){return d3.median(d, (o) => o.o.data.Temperature)}
			if (selector1 == "Humidity"){return d3.median(d, (o) => o.o.data.Humidity)}
			if (selector1 == "Pressure"){return d3.median(d, (o) => o.o.data.Pressure)}
		}
	},

	initialize (options) {
		L.setOptions(this, options)
		this._data = []
		this._colorScale = d3.scaleLinear()
			.domain(this.options.valueDomain)
			.range(this.options.colorRange)
			.clamp(true)
	},

//	Make hex radius dynamic for different zoom levels to give a nicer overview of the sensors as well as making sure that the hex grid does not cover the whole world when zooming out
	getFlexRadius () {
		if (this.map.getZoom() < 3) {
			return this.options.radius / (3 * (4 - this.map.getZoom()))
		} else if (this.map.getZoom() > 2 && this.map.getZoom() < 8) {
			return this.options.radius / (9 - this.map.getZoom())
		} else {
			return this.options.radius
		}
	},

	onAdd (map) {
		this.map = map
		let _layer = this

		// SVG element
		this._svg = L.svg()
		map.addLayer(this._svg)
		this._rootGroup = d3.select(this._svg._rootGroup).classed('d3-overlay', true)
		this.selection = this._rootGroup

		// Init shift/scale invariance helper values
		this._pixelOrigin = map.getPixelOrigin()
		this._wgsOrigin = L.latLng([0, 0])
		this._wgsInitialShift = this.map.latLngToLayerPoint(this._wgsOrigin)
		this._zoom = this.map.getZoom()
		this._shift = L.point(0, 0)
		this._scale = 1

		// Create projection object
		this.projection = {
			latLngToLayerPoint: function (latLng, zoom) {
				zoom = _layer._undef(zoom) ? _layer._zoom : zoom
				let projectedPoint = _layer.map.project(L.latLng(latLng), zoom)._round()
				return projectedPoint._subtract(_layer._pixelOrigin)
			},
			layerPointToLatLng: function (point, zoom) {
				zoom = _layer._undef(zoom) ? _layer._zoom : zoom
				let projectedPoint = L.point(point).add(_layer._pixelOrigin)
				return _layer.map.unproject(projectedPoint, zoom)
			},
			unitsPerMeter: 256 * Math.pow(2, _layer._zoom) / 40075017,
			map: _layer.map,
			layer: _layer,
			scale: 1
		}
		this.projection._projectPoint = function (x, y) {
			let point = _layer.projection.latLngToLayerPoint(new L.LatLng(y, x))
			this.stream.point(point.x, point.y)
		}

		this.projection.pathFromGeojson = d3.geoPath().projection(d3.geoTransform({point: this.projection._projectPoint}))

		// Compatibility with v.1
		this.projection.latLngToLayerFloatPoint = this.projection.latLngToLayerPoint
		this.projection.getZoom = this.map.getZoom.bind(this.map)
		this.projection.getBounds = this.map.getBounds.bind(this.map)
		this.selection = this._rootGroup // ???

		// Initial draw
		this.draw()
	},

	onRemove (map) {
		if (this._container != null)
			this._container.remove()

		// Remove events
		map.off({'moveend': this._redraw}, this)

		this._container = null
		this._map = null

		// Explicitly will leave the data array alone in case the layer will be shown again
		// this._data = [];
	},

	addTo (map) {
		map.addLayer(this)
		return this
	},

	_disableLeafletRounding () {
		this._leaflet_round = L.Point.prototype._round
		L.Point.prototype._round = function () { return this }
	},

	_enableLeafletRounding () {
		L.Point.prototype._round = this._leaflet_round
	},

	draw () {
		this._disableLeafletRounding()
		this._redraw(this.selection, this.projection, this.map.getZoom())
		this._enableLeafletRounding()
	},
	getEvents: function () { return {zoomend: this._zoomChange} },

	_zoomChange: function () {

		let mapZoom = map.getZoom()
		let MapCenter = map.getCenter()
		this._disableLeafletRounding()
		let newZoom = this._undef(mapZoom) ? this.map._zoom : mapZoom
		this._zoomDiff = newZoom - this._zoom
		this._scale = Math.pow(2, this._zoomDiff)
		this.projection.scale = this._scale
		this._shift = this.map.latLngToLayerPoint(this._wgsOrigin)
				._subtract(this._wgsInitialShift.multiplyBy(this._scale))
		let shift = ["translate(", this._shift.x, ",", this._shift.y, ") "]
		let scale = ["scale(", this._scale, ",", this._scale,") "]
		this._rootGroup.attr("transform", shift.concat(scale).join(""))
		this.draw()
		this._enableLeafletRounding()
	},
	_redraw(selection, projection, zoom){
		// Generate the mapped version of the data
		let data = this._data.map( (d) => {
			let lng = this.options.lng(d)
			let lat = this.options.lat(d)

			let point = projection.latLngToLayerPoint([lat, lng])
			return { o: d, point: point }
		});

		// Select the hex group for the current zoom level. This has
		// the effect of recreating the group if the zoom level has changed
		let join = selection.selectAll('g.hexbin')
			.data([zoom], (d) => d)


		// enter
		join.enter().append('g')
			.attr('class', (d) => 'hexbin zoom-' + d)

		// exit
		join.exit().remove()


		// add the hexagons to the select
		this._createHexagons(join, data, projection)

	},

	_createHexagons(g, data, projection) {
		// Create the bins using the hexbin layout

		let hexbin = d3.hexbin()
			.radius(this.getFlexRadius() / projection.scale)
			.x( (d) => d.point.x )
			.y( (d) => d.point.y )
		let bins = hexbin(data)

//		console_log(bins)

		// Join - Join the Hexagons to the data
		let join = g.selectAll('path.hexbin-hexagon')
			.data(bins)


		// Update - set the fill and opacity on a transition (opacity is re-applied in case the enter transition was cancelled)
		join.transition().duration(this.options.duration)
			.attr('fill', (d) => this._colorScale(this.options.value(d)))
			.attr('fill-opacity', this.options.opacity)
			.attr('stroke-opacity', this.options.opacity)

		// Enter - establish the path, the fill, and the initial opacity
		join.enter().append('path').attr('class', 'hexbin-hexagon')
			.attr('d', (d) => 'M' + d.x + ',' + d.y + hexbin.hexagon())
			.attr('fill', (d) => this._colorScale(this.options.value(d)))
			.attr('fill-opacity', 0.01)
			.attr('stroke-opacity', 0.01)
			.on('mouseover', this.options.mouseover)
			.on('mouseout', this.options.mouseout)
			.on('click', this.options.click)
			.transition().duration(this.options.duration)
				.attr('fill-opacity', this.options.opacity)
				.attr('stroke-opacity', this.options.opacity)

		// Exit
		join.exit().transition().duration(this.options.duration)
			.attr('fill-opacity', 0.01)
			.attr('stroke-opacity', 0.01)
			.remove()
	},
	data (data) {
		this._data = (data != null) ? data : []
		this.draw()
		return this
	}
});

L.hexbinLayer = function(options) {
	return new L.HexbinLayer(options);
};


function sensorNr(data){

	var inner_pre = "#";

	if (selector1 != "Official_AQI_US") {
		inner_pre = "(+) #"
	}

	openedGraph1 = [];

	if(!d3.select("#results").empty()){
		d3.select("#results").remove();
	};

	var x = document.getElementById("sidebar");
	if (x.style.display = "none") {
		x.style.display = "block";
//		document.getElementById('menu').innerHTML='Close';
	};

	if (data.length == 1){
		var textefin = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensor</th>";
		if (selector1 == "PM10"){
			textefin += "<th class = 'titre'>PM10 &micro;g/m&sup3;</th></tr><tr><td class='idsens' value="+data[0].o.id+">"+inner_pre+data[0].o.id+"</td><td id='P1sens'>"+parseInt(data[0].o.data.PM10)+"</td></tr><tr id='graph_"+data[0].o.id+"'></tr></table>";
		};
		if (selector1 == "PM25"){
			textefin += "<th class = 'titre'>PM2.5 &micro;g/m&sup3;</th></tr><tr><td class='idsens' value="+data[0].o.id+">"+inner_pre+data[0].o.id+"</td><td id='P2sens'>"+parseInt(data[0].o.data.PM25)+"</td></tr><tr id='graph_"+data[0].o.id+"'></tr></table>";
		};
		if (selector1 == "Official_AQI_US"){
			textefin += "<th class = 'titre'>AQI US</th></tr><tr><td class='idsens' value="+data[0].o.id+">"+inner_pre+data[0].o.id+"</td><td id='AQIsens'>"+parseInt(data[0].o.data.AQI)+" ("+data[0].o.data.origin+")</td></tr><tr id='graph_"+data[0].o.id+"'></tr></table>";
		};
		if (selector1 == "Temperature"){
			textefin += "<th class = 'titre'>Temperatur °C</th></tr><tr><td class='idsens' value="+data[0].o.id+">"+inner_pre+data[0].o.id+"</td><td id='tempsens'>"+parseInt(data[0].o.data.Temperature)+"</td></tr><tr id='graph_"+data[0].o.id+"'></tr></table>";
		};
		if (selector1 == "Humidity"){
			textefin += "<th class = 'titre'>Feuchtigkeit %</th></tr><tr><td class='idsens' value="+data[0].o.id+">"+inner_pre+data[0].o.id+"</td><td id='humisens'>"+parseInt(data[0].o.data.Humidity)+"</td></tr><tr id='graph_"+data[0].o.id+"'></tr></table>";
		};
		if (selector1 == "Pressure"){
			textefin += "<th class = 'titre'>Druck hPa</th></tr><tr><td class='idsens' value="+data[0].o.id+">"+inner_pre+data[0].o.id+"</td><td id='pressuresens'>"+parseInt(data[0].o.data.Pressure)+"</td></tr><tr id='graph_"+data[0].o.id+"'></tr></table>";
		};
	};

	if (data.length > 1){

		var sensors = '';
		var texte = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensors</th>";
		if (selector1 == "PM10"){
			texte += "<th class = 'titre'>PM10 &micro;g/m&sup3;</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='P1sens'>"+parseInt(d3.median(data, (o) => o.o.data.PM10))+"</td></tr>";

			data.forEach(function(i) {
				sensors += "<tr><td class='idsens' value="+i.o.id+">"+inner_pre+i.o.id+"</td><td id='P1sens'>"+i.o.data.PM10+"</td></tr><tr id='graph_"+i.o.id+"'></tr>";
			});
		};
		if (selector1 == "PM25"){
			texte += "<th class = 'titre'>PM2.5 &micro;g/m&sup3;</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='P2sens'>"+parseInt(d3.median(data, (o) => o.o.data.PM25))+"</td></tr>";

			data.forEach(function(i) {
				sensors += "<tr><td class='idsens' value="+i.o.id+">"+inner_pre+i.o.id+"</td><td id='P2sens'>"+i.o.data.PM25+"</td></tr><tr id='graph_"+i.o.id+"'></tr>";
			});
		};
		if (selector1 == "Official_AQI_US"){
			texte += "<th class = 'titre'>AQI US</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='AQIsens'>"+parseInt(d3.median(data, (o) => o.o.data.AQI))+"</td></tr>";

			data.forEach(function(i) {
				sensors += "<tr><td class='idsens' value="+i.o.id+">"+inner_pre+i.o.id+"</td><td id='AQIsens'>"+i.o.data.AQI+" ("+i.o.data.origin+")</td></tr><tr id='graph_"+i.o.id+"'></tr>";
			});
		};
		if (selector1 == "Temperature"){
			texte += "<th class = 'titre'>Temperatur °C</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='tempsens'>"+parseInt(d3.median(data, (o) => o.o.data.Temperature))+"</td></tr>";

			data.forEach(function(i) {
				sensors += "<tr><td class='idsens' value="+i.o.id+">"+inner_pre+i.o.id+"</td><td id='tempsens'>"+i.o.data.Temperature+"</td></tr><tr id='graph_"+i.o.id+"'></tr>";
			});
		};
		if (selector1 == "Humidity"){
			texte += "<th class = 'titre'>Feuchtigkeit %</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='humisens'>"+parseInt(d3.median(data, (o) => o.o.data.Humidity))+"</td></tr>";

			data.forEach(function(i) {
				sensors += "<tr><td class='idsens' value="+i.o.id+">"+inner_pre+i.o.id+"</td><td id='humisens'>"+i.o.data.Humidity+"</td></tr><tr id='graph_"+i.o.id+"'></tr>";
			});

		};
		if (selector1 == "Pressure"){
			texte += "<th class = 'titre'>Druck hPa</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='pressuresens'>"+(d3.median(data, (o) => o.o.data.Pressure)).toFixed(1)+"</td></tr>";

			data.forEach(function(i) {
				sensors += "<tr><td class='idsens' value="+i.o.id+">"+inner_pre+i.o.id+"</td><td id='pressuresens'>"+i.o.data.Pressure.toFixed(1)+"</td></tr><tr id='graph_"+i.o.id+"'></tr>";
			});
		};
		var textefin = texte + sensors + "</table>";
	};

	div.transition()
		.duration(200)
		.style("display", "block");

	div.html(textefin)
		.style("padding","10px")

	d3.selectAll(".idsens").on("click", function() {
		displayGraph(d3.select(this).attr("value"));
	});

};

function aqius(val,type){

	var index;

	if (type == 'PM10'){
		if(parseInt(val) >= 0 && parseInt(val)<= 54){index = formula(50,0,54,0,parseInt(val))};
		if(parseInt(val) >= 55 && parseInt(val)<= 154){index = formula(100,51,154,55,parseInt(val))};
		if(parseInt(val) >= 155 && parseInt(val)<= 254){index = formula(150,101,254,155,parseInt(val))};
		if(parseInt(val) >= 255 && parseInt(val)<= 354){index = formula(200,151,354,255,parseInt(val)) };
		if(parseInt(val) >= 355 && parseInt(val)<= 424){index = formula(300,201,424,355,parseInt(val))};
		if(parseInt(val) >= 425 && parseInt(val)<= 504){index = formula(400,301,504,425,parseInt(val))};
		if(parseInt(val) >= 505 && parseInt(val)<= 604){index = formula(500,401,604,505,parseInt(val))};

		if(parseInt(val) > 604){index = 500};
	};

	if (type == 'PM25'){
		if(val.toFixed(1) >= 0 && val.toFixed(1)<= 12){index = formula(50,0,12,0,val.toFixed(1))};
		if(val.toFixed(1) >= 12.1 && val.toFixed(1)<= 35.4){index = formula(100,51,35.4,12.1,val.toFixed(1))};
		if(val.toFixed(1) >= 35.5 && val.toFixed(1)<= 55.4){index = formula(150,101,55.4,35.5,val.toFixed(1))};
		if(val.toFixed(1) >= 55.5 && val.toFixed(1)<= 150.4){index = formula(200,151,150.4,55.5,val.toFixed(1))};
		if(val.toFixed(1) >= 150.5 && val.toFixed(1)<= 250.4){index = formula(300,201,250.4,150.5,val.toFixed(1))};
		if(val.toFixed(1) >= 250.5 && val.toFixed(1)<= 350.4){index = formula(400,301,350.4,250.5,val.toFixed(1))};
		if(val.toFixed(1) >= 350.5 && val.toFixed(1)<= 550.4){index = formula(500,401,550.4,350.5,val.toFixed(1))};

		if(val.toFixed(1) > 550.4){index = 500};
	};

	return index;
};

function formula(Ih,Il,Ch,Cl,C){

	var result = (((Ih-Il)/(Ch-Cl))*(C-Cl))+Il;

	return parseInt(result);

};

function displayGraph(sens) {

	var inner_pre = "";

	if (!openedGraph1.includes(sens)) {

		openedGraph1.push(sens);

//		console_log(openedGraph1);

		var iddiv = "#graph_"+sens;

		var td = d3.select(iddiv).append("td")
				.attr("id", "frame_"+sens)
				.attr("colspan", "2")
				.html("<iframe src='https://maps.luftdaten.info/grafana/d-solo/000000004/single-sensor-view?orgId=1&panelId="+panelIDs[selector1][0]+"&var-node="+sens+"' width='290' height='200' frameborder='0'></iframe><br><iframe src='https://maps.luftdaten.info/grafana/d-solo/000000004/single-sensor-view?orgId=1&panelId="+panelIDs[selector1][1]+"&var-node="+sens+"' width='290' height='200' frameborder='0'></iframe>");

		if (selector1 != "Official_AQI_US") {
			inner_pre = "(-) ";
		}
		document.querySelectorAll("td.idsens[value='"+sens+"']")[0].innerHTML = inner_pre+"#"+sens;
	} else {
		if (selector1 != "Official_AQI_US") {
			inner_pre = "(+) ";
		}
		document.querySelectorAll("td.idsens[value='"+sens+"']")[0].innerHTML = inner_pre+"#"+sens;
		removeTd(sens);
	};

};

function removeTd(id){
	d3.select("#frame_"+id).remove();
	removeInArray(openedGraph1,id);
};

function officialaqius(data){
	var P1 = aqius(data.PM10,'PM10');
	var P2 = aqius(data.PM25,'PM25');

	if (P1>=P2){return {"AQI": P1, "origin": "PM10"}};
	if (P1<P2){return {"AQI": P2, "origin": "PM2.5"}};
};

function removeInArray(array) {
	var what, a = arguments, L = a.length, ax;
	while (L > 1 && array.length) {
		what = a[--L];
		while ((ax= array.indexOf(what)) !== -1) {
			array.splice(ax, 1);
		}
	}

//	console_log(array);

	return array;
}

//SELECT

var x, i, j, selElmnt, a, b, c;
/*look for any elements with the class "custom-select":*/
console_log(selector1);
x = document.getElementsByClassName("custom-select");
for (i = 0; i < x.length; i++) {
	selElmnt = x[i].getElementsByTagName("select")[0];
	selector1 = selElmnt.value;
	/*for each element, create a new DIV that will act as the selected item:*/
	a = document.createElement("DIV");
	a.setAttribute("class", "select-selected");
	a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
	x[i].appendChild(a);
	/*for each element, create a new DIV that will contain the option list:*/
	b = document.createElement("DIV");
	b.setAttribute("class", "select-items select-hide");

	for (j = 0; j < selElmnt.length; j++) {
		if (selElmnt.options[j].value != selector1){

			/*for each option in the original select element,
			create a new DIV that will act as an option item:*/
			c = document.createElement("DIV");
			c.innerHTML = selElmnt.options[j].innerHTML;
			c.addEventListener("click", function(e) {
				/*when an item is clicked, update the original select box,
				and the selected item:*/
				var y, i, k, s, h;
				s = this.parentNode.parentNode.getElementsByTagName("select")[0];
				h = this.parentNode.previousSibling;
				for (i = 0; i < s.length; i++) {
					if (s.options[i].innerHTML == this.innerHTML) {

						reload(s.options[i].value);
						s.selectedIndex = i;
						h.innerHTML = this.innerHTML;

//						console_log(h.value);
//						console_log(this.innerHTML);
//
//						y = this.parentNode.getElementsByClassName("same-as-selected");
//						for (k = 0; k < y.length; k++) {
//							y[k].removeAttribute("class");
//						}
//						this.setAttribute("class", "same-as-selected");
						break;
					}
				}
				h.click();
			});
			b.appendChild(c);
		}
	}

	x[i].appendChild(b);
	a.addEventListener("click", function(e) {
		/*when the select box is clicked, close any other select boxes,
		and open/close the current select box:*/
		e.stopPropagation();
		closeAllSelect(this);
		this.nextSibling.classList.toggle("select-hide");
		this.classList.toggle("select-arrow-active");
	});
}

function closeAllSelect(elmnt) {
	/*a function that will close all select boxes in the document,
	except the current select box:*/
	var x, y,z, i, arrNo = [],selElmnt;
	x = document.getElementsByClassName("select-items");
	y = document.getElementsByClassName("select-selected");
	z = document.getElementsByClassName("same-as-selected");
	selElmnt = document.getElementsByTagName("select")[0];
	for (i = 0; i < y.length; i++) {
		if (elmnt == y[i]) {
			arrNo.push(i)
			var element = x[0];
			while (element.firstChild) {
				element.removeChild(element.firstChild);
			};

			for (j = 0; j < selElmnt.length; j++) {

				if (selElmnt.options[j].value != selector1){

					/*for each option in the original select element,
					create a new DIV that will act as an option item:*/
					c = document.createElement("DIV");
					c.innerHTML = selElmnt.options[j].innerHTML;
					c.addEventListener("click", function(e) {
						/*when an item is clicked, update the original select box,
						and the selected item:*/
						var y, i, k, s, h;
						s = this.parentNode.parentNode.getElementsByTagName("select")[0];
						h = this.parentNode.previousSibling;
						for (i = 0; i < s.length; i++) {
							if (s.options[i].innerHTML == this.innerHTML) {

								reload(s.options[i].value);
								s.selectedIndex = i;
								h.innerHTML = this.innerHTML;
//								y = this.parentNode.getElementsByClassName("same-as-selected");
//								for (k = 0; k < y.length; k++) {
//									y[k].removeAttribute("class");
//								}
//								this.setAttribute("class", "same-as-selected");
								break;
							}
						}
						h.click();
					});
					b.appendChild(c);
				}
			}
		} else {
			y[i].classList.remove("select-arrow-active");
		}
	}
	for (i = 0; i < x.length; i++) {
		if (arrNo.indexOf(i)) {
			x[i].classList.add("select-hide");
		}
	}
}
/*if the user clicks anywhere outside the select box,
then close all select boxes:*/
document.addEventListener("click", closeAllSelect);
