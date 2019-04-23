import leaflet from 'leaflet';
import hash from 'leaflet-hash';
import 'leaflet/dist/leaflet.css';

//use d3-require to call from the internet

import * as d3_TimeFormat from'd3-time-format';
import * as d3_Selection from'd3-selection';
import * as d3_Scale from'd3-scale';
import * as d3_Geo from'd3-geo';
import * as d3_Hexbin from "d3-hexbin";
import * as d3_Fetch from'd3-fetch';
import * as d3_Time from'd3-time';
import * as d3_Timer from'd3-timer';
import * as d3_Array from'd3-array';
import * as d3_Transistion from "d3-transition";

const d3 = Object.assign({},d3_Selection,d3_Scale,d3_Geo,d3_Hexbin,d3_Array,d3_Fetch,d3_Time,d3_TimeFormat,d3_Timer);

import * as config from './config.js';

import '../css/style.css';
import * as places from './places.js';
import * as zooms from './zooms.js';
import * as translate from './translate.js';

//MAP

var hexagonheatmap;
var hmhexaPM_aktuell;
var hmhexaPM_AQI;
var hmhexa_t_h_p;

var map;
var tiles;

var selector1 = config.selection;

var lang = translate.getFirstBrowserLanguage().substring(0,2);

var openedGraph1 = [];

var is_click;

var click_inside_select = false;

var query={};

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
				"PM25":	{
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

var titles = {
				"PM10": "PM10 &micro;g/m&sup3;",
				"PM25": "PM2.5 &micro;g/m&sup3;",
				"Official_AQI_US": "AQI US",
				"Temperature": "Temperature °C",
				"Humidity": "Humidity %",
				"Pressure": "Pressure hPa",
			}

var panelIDs = {
					"PM10": [2,1],
					"PM25": [2,1],
					"Temperature": [4,3],
					"Humidity": [6,5],
					"Pressure": [8,7]
}

var div = d3.select("#sidebar").append("div").attr("id", "table").style("display", "none");

function console_log(text) {
	console.log(text);
}

function get_query_vars() {
	var i=0;
	var telem;
	var search_values=location.search.replace('\?','').split('&');
	for(i=0;i<search_values.length;i++) {
		telem=search_values[i].split('=');
		query[telem[0]]='';
		if (typeof telem[1] != 'undefined') {
			query[telem[0]]=telem[1];
		}
	}
}

get_query_vars();

console_log("Query No overlay: "+query.nooverlay);
if (typeof query.nooverlay !== "undefined") {
	var nooverlay = true;
} else {
	d3.select("#betterplace").style("display", "inline-block");
}

var coordsCenter = config.center;
var zoomLevel = config.zoom;

if (location.hash) {
	var hash_params = location.hash.split("/");
	var coordsCenter = [hash_params[1],hash_params[2]];
	var zoomLevel = hash_params[0].substring(1);
} else {
	var hostname = location.hostname;
	var hostname_parts = hostname.split(".");
	if (hostname_parts.length == 4) {
		var place = hostname_parts[0].toLowerCase();
		console_log(place);
		if (typeof places[place] !== 'undefined' && places[place] !== null) {
			var coordsCenter = places[place];
			var zoomLevel = 11;
		}
		if (typeof zooms[place] !== 'undefined' && zooms[place] !== null) {
			var zoomLevel = zooms[place];
		}
		console_log("Center: "+coordsCenter);
		console_log("Zoom: "+zoomLevel);
	}
};

window.onload=function(){

	// enable elements
	d3.select('#custom-select').style("display", "inline-block");
	d3.select('#legend_PM10').style("display", "block");
	d3.select('#close').html(translate.tr(lang,'(close)'));
	d3.select('#explanation').html(translate.tr(lang,'Show explanation'));
	d3.select('#map-info').html(translate.tr(lang,"<p>The hexagons represent the median of the current values of the sensors which are contained in the area, according to the option selected (PM10, PM2.5, temperature, relative humidity, pressure, AQI). You can refer to the scale on the left side of the map.</p> \
<p>By clicking on a hexagon, you can display a list of all the corresponding sensors as a table. The first column lists the sensor-IDs. In the first line, you can see the amount of sensor in the area and the median value.</p> \
<p>By clicking on the plus symbol next to a sensor ID, you can display two graphics: the individual measurements for the last 24 hours and the 24 hours floating mean for the last seven days. For technical reasons, the first of the 8 days displayed on the graphic has to stay empty.\
The values are refreshed every 5 minutes in order to fit with the measurement frequency of the Airrohr sensors.</p> \
<p>The Air Quality Index (AQI) is calculated according to the recommandations of the United States Environmental Protection Agency. Further information is available on the official page.(<a href='https://www.airnow.gov/index.cfm?action=aqibasics.aqi'>Link</a>). Hover over the AQI scale to display the levels of health concern.</p>"));
	d3.select('#betterplace').html("<a title='"+translate.tr(lang,"Donate for Luftdaten.info (Hardware, Software) now on Betterplace.org")+" target='_blank' href='https://www.betterplace.org/de/projects/38071-fur-den-feinstaub-sensor-sds011-als-bastel-kit-spenden/'>"+translate.tr(lang,"Donate for<br/>Luftdaten.info<br/>now on<br/><span>Betterplace.org</span>")+"</a>");

	d3.select("#custom-select").select("select").selectAll("option").each(function(d,i) {
		d3.select(this).text(translate.tr(lang,d3.select(this).text()));
	});

	d3.select("#custom-select").style("display","inline-block");
	d3.select("#custom-select").select("select").property("value", config.selection);
	d3.select("#custom-select").append("div").attr("class","select-selected").html(translate.tr(lang,d3.select("#custom-select").select("select").select("option:checked").text())).on("click",showAllSelect);

	map.setView(coordsCenter, zoomLevel);
	
	map.clicked = 0;
	
	d3.select("#custom-select").select("select").property("value", config.selection);

	selector1 = config.selection;

	console_log(selector1);

	hexagonheatmap = L.hexbinLayer(scale_options[selector1]).addTo(map);

	switch_legend(selector1);	

//	REVOIR ORDRE DANS FONCTION READY

	d3.json("https://maps.luftdaten.info/data/v2/data.dust.min.json").then(function(data){ready(data,1);
		d3.json("https://maps.luftdaten.info/data/v2/data.24h.json").then(function(data){ready(data,2)});
		d3.json("https://maps.luftdaten.info/data/v2/data.temp.min.json").then(function(data){ready(data,3)});
	})

	d3.interval(function(){

		d3.selectAll('path.hexbin-hexagon').remove();

		d3.json("https://maps.luftdaten.info/data/v2/data.dust.min.json").then(function(data){ready(data,1);
			d3.json("https://maps.luftdaten.info/data/v2/data.24h.json").then(function(data){ready(data,2)});
			d3.json("https://maps.luftdaten.info/data/v2/data.temp.min.json").then(function(data){ready(data,3)});
		})

		console_log('reload')

	}, 300000);
	
	map.on('moveend', function() {hexagonheatmap._zoomChange();});
	map.on('move', function() {});

//	REVOIR LE DOUBLECLIQUE

	map.on('click', function(e) {
		console_log('Click');
		map.clicked = map.clicked + 1;
		d3.timeout(function() {
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

map = L.map('map',{ zoomControl:true,minZoom:config.minZoom,maxZoom:config.maxZoom,doubleClickZoom:false});

new L.Hash(map);

tiles = L.tileLayer(config.tiles, {
				attribution: config.attribution,
				maxZoom: config.maxZoom,
				minZoom: config.minZoom
			}).addTo(map);

function switch_legend(val) {
	d3.select('#legendcontainer').selectAll("[id^=legend_]").style("display","none");
	d3.select('#legend_'+val).style("display","block");
}

function isNumber(obj) {
	return obj !== undefined && typeof(obj) === 'number' && !isNaN(obj);
}

function check_values(obj) {
	var result = false;
	if (isNumber(obj)) {
		if ((selector1 == "Humidity") && (obj >=0 ) && (obj <= 100)) { result = true; }
		else if ((selector1 == "Temperature") && (obj <= 70 && obj >= -50)) { result = true; }
		else if ((selector1 == "Pressure") && (obj >= 850) && (obj < 1200)) { result = true; }
		else if ((selector1 == "PM10") && (obj < 1900)) { result = true; }
		else if ((selector1 == "PM25") && (obj < 900)) { result = true; }
	}
	return result;
}

function ready(data,num) {

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
					filtered.push({"data":{"Official_AQI_US": data_out.AQI, "origin": data_out.origin, "PM10_24h": data_in.PM10, "PM25_24h": data_in.PM25}, "id":item.sensor.id, "latitude":item.location.latitude,"longitude":item.location.longitude})
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

		hmhexa_t_h_p = data.reduce(function(filtered, item) {
			filtered.push({"data":{"Pressure":parseInt(getRightValue(item.sensordatavalues,"pressure_at_sealevel"))/100, "Humidity":parseInt(getRightValue(item.sensordatavalues,"humidity")), "Temperature":parseInt(getRightValue(item.sensordatavalues,"temperature"))}, "id":item.sensor.id, "latitude":item.location.latitude,"longitude":item.location.longitude})
			return filtered;
		}, []);
	}

	var dateParser = d3.timeParse("%Y-%m-%d %H:%M:%S");
	var timestamp = dateParser(data[0].timestamp);

//	console_log(timestamp);

	var localTime = new Date();
	var timeOffset = localTime.getTimezoneOffset();

//	console_log(timeOffset);

	var newTime = d3.timeMinute.offset(timestamp, -(timeOffset));

//	console_log(newTime);

//	var dateFormater = d3.timeFormat("%A %d %B %Y %H:%M:%S");

//	var dateFormater = locale.format("%A, %d. %B %Y, um %H:%M:%S");
	var dateFormater = locale.format("%H:%M:%S");

	d3.select("#update").html(translate.tr(lang,"Last update")+": " + dateFormater(newTime));
	
	if(num == 1 && (selector1 == "PM10" || selector1 == "PM25")) {hexagonheatmap.initialize(scale_options[selector1]);hexagonheatmap.data(hmhexaPM_aktuell.filter(function(value){return check_values(value.data[selector1]);}));};
	if(num == 2 && selector1 == "Official_AQI_US"){hexagonheatmap.initialize(scale_options[selector1]);hexagonheatmap.data(hmhexaPM_AQI);};
	if(num == 3 && (selector1 == "Temperature" || selector1 == "Humidity" || selector1 == "Pressure" )){hexagonheatmap.initialize(scale_options[selector1]);hexagonheatmap.data(hmhexa_t_h_p.filter(function(value){return check_values(value.data[selector1]);}));};

	d3.select("#loading").style("display","none");

};

function reload(val){
	d3.selectAll('path.hexbin-hexagon').remove();
	d3.select("#results").remove();
	d3.select("#sidebar").style("display","none");

	console_log(val);

	selector1 = val;
	
	switch_legend(selector1);

	hexagonheatmap.initialize(scale_options[selector1]);

	if (val == "PM10" || val == "PM25") {
		hexagonheatmap.data(hmhexaPM_aktuell.filter(function(value){return check_values(value.data[val]);}));
	} else if (val == "Official_AQI_US") {
		hexagonheatmap.data(hmhexaPM_AQI);
	} else if (val == "Temperature" || val == "Humidity" || val == "Pressure") {
		hexagonheatmap.data(hmhexa_t_h_p.filter(function(value){return check_values(value.data[val]);}));
	}
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

	if(val>= 0 && val < 25) {
		return "#00796b";
	} else if(val < 50){
		var couleur = interpolColor('#00796b','#f9a825',(col-25)/25);
		return couleur;
	} else if (val < 75) {
		var couleur = interpolColor('#f9a825','#e65100',(col-50)/25);
		return couleur;
	} else if (val < 100) {
		var couleur = interpolColor('#e65100','#dd2c00',(col-75)/25);
		return couleur;
	} else if (val < 500) {
		var couleur = interpolColor('#dd2c00','#8c0084',(col-100)/400);
		return couleur;
	} else {
		return "#8c0084";
	};
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

function close_sidebar() {
	var x = d3.select("#sidebar");

	if (x.style("display") === "block") {
		x.style("display", "none");
		if(!d3.select("#results").empty()){
			d3.select("#results").remove();
		};
	} else {
		x.style("display", "block");
	};
}

//var menu = d3.select("#menu");
d3.select("#menu").on("click", close_sidebar);

//var close_link = d3.select("#close");
d3.select("#close").on("click", close_sidebar);

d3.select("#explanation").on("click", function(e) {

	var x = d3.select("#map-info");
	
	if ( x.style("display") === "none" ) {
		x.style("display", "block");
		d3.select("#explanation").html(translate.tr(lang,"Hide explanation"));
	} else {
		x.style("display", "none");
		d3.select("#explanation").html(translate.tr(lang,"Show explanation"));
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
					d3.timeout(function() {
						if(map.clicked == 1){
							sensorNr(e);
						}
					}, 300)},

		lng: function (d) {
			return d.longitude
		},
		lat: function (d) {
			return d.latitude
		},
		value: function (d) {

//			Median everywhere!
			return d3.median(d, (o) => o.o.data[selector1]);

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

	var x = d3.select("#sidebar");
	if (x.style("display") === "none") {
		x.style("display", "block");
	};

	var textefin = "<table id='results' style='width:380px;'><tr><th class ='title'>"+translate.tr(lang,'Sensor')+"</th><th class = 'title'>"+translate.tr(lang,titles[selector1])+"</th></tr>";
	if (data.length > 1) {
		textefin += "<tr><td class='idsens'>Median "+data.length+" Sens.</td><td>"+parseInt(d3.median(data, (o) => o.o.data[selector1]))+"</td></tr>";
	}
	var sensors = '';
	data.forEach(function(i) {
		sensors += "<tr><td class='idsens' id='id_"+i.o.id+"'>"+inner_pre+i.o.id+"</td>";
		if (selector1 == "PM10"){
			sensors += "<td>"+i.o.data[selector1]+"</td></tr>";
		};
		if (selector1 == "PM25"){
			sensors += "<td>"+i.o.data[selector1]+"</td></tr>";
		};
		if (selector1 == "Official_AQI_US"){
			sensors += "<td>"+i.o.data[selector1]+" ("+i.o.data.origin+")</td></tr>";
		};
		if (selector1 == "Temperature"){
			sensors += "<td>"+i.o.data[selector1]+"</td></tr>";
		};
		if (selector1 == "Humidity"){
			sensors += "<td>"+i.o.data[selector1]+"</td></tr>";
		};
		if (selector1 == "Pressure"){
			sensors += "<td>"+i.o.data[selector1].toFixed(1)+"</td></tr>";
		};
		sensors += "<tr id='graph_"+i.o.id+"'></tr>";
	});
	textefin += sensors;

	textefin += "</table>";

	div.transition()
		.duration(200)
		.style("display", "block");

	div.html(textefin)
		.style("padding","10px")

	d3.selectAll(".idsens").on("click", function() {
		displayGraph(d3.select(this).attr("id"));
	});

};

function aqius(val,type){

	var index;

	if (val >=0) {
		if (type == 'PM10'){
			if(parseInt(val)<= 54){index = formula(50,0,54,0,parseInt(val))}
			else if(parseInt(val)<= 154){index = formula(100,51,154,55,parseInt(val))}
			else if(parseInt(val)<= 254){index = formula(150,101,254,155,parseInt(val))}
			else if(parseInt(val)<= 354){index = formula(200,151,354,255,parseInt(val))}
			else if(parseInt(val)<= 424){index = formula(300,201,424,355,parseInt(val))}
			else if(parseInt(val)<= 504){index = formula(400,301,504,425,parseInt(val))}
			else if(parseInt(val)<= 604){index = formula(500,401,604,505,parseInt(val))}
			else {index = 500};
		};

		if (type == 'PM25'){
			if(val.toFixed(1)<= 12){index = formula(50,0,12,0,val.toFixed(1))}
			else if(val.toFixed(1)<= 35.4){index = formula(100,51,35.4,12.1,val.toFixed(1))}
			else if(val.toFixed(1)<= 55.4){index = formula(150,101,55.4,35.5,val.toFixed(1))}
			else if(val.toFixed(1)<= 150.4){index = formula(200,151,150.4,55.5,val.toFixed(1))}
			else if(val.toFixed(1)<= 250.4){index = formula(300,201,250.4,150.5,val.toFixed(1))}
			else if(val.toFixed(1)<= 350.4){index = formula(400,301,350.4,250.5,val.toFixed(1))}
			else if(val.toFixed(1)<= 550.4){index = formula(500,401,550.4,350.5,val.toFixed(1))}
			else {index = 500};
		};
	}
	return index;
};

function formula(Ih,Il,Ch,Cl,C){

	var result = (((Ih-Il)/(Ch-Cl))*(C-Cl))+Il;

	return parseInt(result);

};

function displayGraph(id) {

	var inner_pre = "";
	var sens = id.substr(3);

	if (!openedGraph1.includes(sens)) {

		openedGraph1.push(sens);

//		console_log(openedGraph1);

		var iddiv = "#graph_"+sens;

		d3.select(iddiv).append("td")
				.attr("id", "frame_"+sens)
				.attr("colspan", "2")
				.html("<iframe src='https://maps.luftdaten.info/grafana/d-solo/000000004/single-sensor-view?orgId=1&panelId="+panelIDs[selector1][0]+"&var-node="+sens+"' width='290' height='200' frameborder='0'></iframe><br><iframe src='https://maps.luftdaten.info/grafana/d-solo/000000004/single-sensor-view?orgId=1&panelId="+panelIDs[selector1][1]+"&var-node="+sens+"' width='290' height='200' frameborder='0'></iframe>");

		if (selector1 != "Official_AQI_US") {
			inner_pre = "(-) ";
		}
		d3.select("#id_"+sens).html(inner_pre+"#"+sens);
	} else {
		if (selector1 != "Official_AQI_US") {
			inner_pre = "(+) ";
		}
		d3.select("#id_"+sens).html(inner_pre+"#"+sens);
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
	return array;
}

function showAllSelect() {
	click_inside_select = true;
	if (d3.select("#custom-select").select(".select-items").empty()) {
		d3.select("#custom-select").append("div").attr("class","select-items");
		d3.select("#custom-select").select("select").selectAll("option").each(function(d,i) {
			if (this.value != selector1) {
				d3.select("#custom-select").select(".select-items").append("div").text(this.text).attr("id","select-item-"+this.value).on("click",function(){ switchTo(this);});
			}
		});
		d3.select("#custom-select").select(".select-selected").attr("class","select-selected select-arrow-active");
	}
}

function switchTo(element) {
	d3.select("#custom-select").select("select").property("value", element.id.substring(12));
	d3.select("#custom-select").select(".select-selected").text(d3.select("#custom-select").select("select").select("option:checked").text());
	selector1=element.id.substring(12);
	reload(selector1);
	d3.select("#custom-select").select(".select-items").remove();
}

/*if the user clicks anywhere outside the select box,
then close all select boxes:*/
document.addEventListener("click", function() {
	if (! click_inside_select) {
		d3.select("#custom-select").select(".select-items").remove();
	} else {
		click_inside_select = false;
	}
});

