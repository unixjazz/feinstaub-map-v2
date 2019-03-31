import leaflet from 'leaflet';
import hash from 'leaflet-hash';
import * as d3 from "d3";
import 'leaflet/dist/leaflet.css';
import './../css/style.css';
//import './../js/hexbin.js';

import * as d3Hexbin from "d3-hexbin";

const hexbin = d3Hexbin.hexbin();



//var L = require('leaflet');
//var d3 = require('d3');


var hexagonheatmap;
var hmhexaPM_aktuell;
var hmhexaPM_24Stunden;
var hmhexatemp;
var hmhexahumi;
var hmhexadruck;

var map;
var tiles;
//var hash;

var selector1 = "P1";

var P1orP2 = "";

var places;
var zooms;

var oriAQI;

var openenedTab = false;

var dataStock;


//EN FAIRE 2 pou PM et H/T/P

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






//	P10

	var options1 = {
				valueDomain: [20, 40, 60, 100, 500],
				colorRange: ['#00796B', '#F9A825', '#E65100', '#DD2C00', '#960084']	
				};

//	PM2.5

	var options2 = {
				valueDomain: [10, 20, 40, 60, 100],
				colorRange: ['#00796B', '#F9A825', '#E65100', '#DD2C00', '#960084']	
				};


//	AQI US

//	change in order to make gradient

//	var options3 = {
//				valueDomain: [0,50,51,100,101,150,151,200,201,300,301,500],
//				colorRange: ['#00E400','#00E400','#FFFF00','#FFFF00','#FF7E00', '#FF7E00','#FF0000', '#FF0000','rgb(143, 63, 151)', 'rgb(143, 63, 151)','#7E0023','#7E0023']	
//				};

	var options3 = {
				valueDomain: [0,50,100,150,200,300],
				colorRange: ['#00E400','#FFFF00','#FF7E00','#FF0000','rgb(143, 63, 151)','#7E0023']	
				};

	var options4 = {
				valueDomain: [-20, 0, 50],
				colorRange: ['#0022FE', '#FFFFFF', '#FF0000']	
				};

	var options5 = {
				valueDomain: [0,100],
				colorRange: ['#FFFFFF', '#0000FF']	
				};

	var options6 = {
				valueDomain: [926, 947.75, 969.50, 991.25, 1013, 1034.75, 1056.50, 1078.25, 1100],
				colorRange: ["#dd2e97", "#6b3b8f", "#2979b9",
               "#02B9ed", "#13ae52", "#c9d841",
               "#fad635", "#f0a03d", "#892725"]	
				};
//
	var div = d3.select("body").append("div")
				.attr("id", "tooltip")
				.style("display", "none");

	var div = d3.select("#sidebar").append("div")
				.attr("id", "table")
				.style("display", "none");

	var tooltipDiv = document.getElementsByClassName('tooltip-div');

	window.onmousemove = function (e) {
		var x = e.clientX,
		y = e.clientY;

		for (var i = 0; i < tooltipDiv.length; i++) {
			tooltipDiv.item(i).style.top = (y - 10 )+ 'px';
			tooltipDiv.item(i).style.left = (x + 20) + 'px';
		};
	};

//window.onpopstate = function(event) {
//	if ((typeof location.search !== 'undefined') && (typeof location.hash !== 'undefined') && (location.hash !== '')) {
//		if (typeof location.pathname !== 'undefined') {
//			var path = location.pathname;
//			path = path.substring(0, path.lastIndexOf('/') + 1);
//		} else {
//			var path = "/";
//		}
//
//		var new_location = location.protocol+'//'+location.host+path;
//		if (typeof location.hash !== 'undefined') {
//			new_location += location.hash;
//		}
//		console.log("New location: "+new_location);
////		location.replace(new_location);
//		history.pushState('remove_query', null, new_location);
//	} 
//};
//
//
//

	if (location.hash) {
		var hash_params = location.hash.split("/");
		var cooCenter = [hash_params[1],hash_params[2]];
		var zoomLevel = hash_params[0].substring(1);
//	} else if (location.hostname.split(".").length == 4){

	} else {
		var hostname = location.hostname;
		var hostname_parts = hostname.split(".");
		if (hostname_parts.length == 4) {
			var place = hostname_parts[0].toLowerCase();
			console.log(place);
			if (typeof places[place] !== 'undefined' && places[place] !== null) {
				var cooCenter = places[place];
				var zoomLevel = 11;
			}
			if (typeof zooms[place] !== 'undefined' && zooms[place] !== null) {
				var zoomLevel = zooms[place];
			}
			console.log("Center: "+cooCenter);
			console.log("Zoom: "+zoomLevel)
		} else {
			var cooCenter = [50.495171, 9.730827];
			var zoomLevel = 6;
		}
	};

	window.onload=function(){
        
//		if (!navigator.geolocation){
//			console.log("Geolocation is not supported by your browser");
//		};
//
//		navigator.geolocation.getCurrentPosition(success, error);

//		map.setView([50.495171, 9.730827], 6);

		map.setView(cooCenter, zoomLevel);

		hexagonheatmap = L.hexbinLayer(options1).addTo(map);

//		REVOIR ORDRE DANS FONCTION READY

		d3.queue()
			.defer(d3.json, "https://maps.luftdaten.info/data/v2/data.dust.min.json")
			.defer(d3.json, "https://maps.luftdaten.info/data/v2/data.24h.json")
			.defer(d3.json, "https://maps.luftdaten.info/data/v2/data.temp.min.json")

			.awaitAll(ready); 

		d3.interval(function(){

		d3.selectAll('path.hexbin-hexagon').remove();

		d3.queue()
			.defer(d3.json, "https://maps.luftdaten.info/data/v2/data.dust.min.json")
			.defer(d3.json, "https://maps.luftdaten.info/data/v2/data.24h.json")
			.defer(d3.json, "https://maps.luftdaten.info/data/v2/data.temp.min.json")

			.awaitAll(ready); 

		console.log('reload')

	}, 300000);

 
	map.on('moveend', function() { 

		hexagonheatmap._zoomChange();

	});

//	REVOIR LES idselec!

	map.on('move', function() { 
//		div.style("display", "none");
//		idselec1=0;
//		idselec0=0;
	});

//	map.on('dblclick', function() { 
//		div.style("display", "none");
//		idselec1=0;
//		idselec0=0;
//	});
//
//	map.on('click', function() { 
//		div.style("display", "none");
//			idselec1=0;
//			idselec0=0;
//	});

//	REVOIR LE DOUBLECLIQUE

	map.on('click', function(e) {
		map.setView([e.latlng.lat, e.latlng.lng], map.getZoom()); 
//		idselec1=0;
//		idselec0=0;
	});

};

map = L.map('map',{ zoomControl:true,minZoom:1,doubleClickZoom:false});

//hash = new L.Hash(map);

new L.Hash(map);


tiles = L.tileLayer('https://maps.luftdaten.info/tiles/{z}/{x}/{y}.png',{
			attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
			maxZoom: 18}).addTo(map);


function ready(error,data) {
	if (error) throw error;

	hmhexaPM_aktuell = data[0].reduce(function(filtered, item) {
		if (item.sensor.sensor_type.name == "SDS011") {
			filtered.push({"data":{"PM10": parseInt(getRightValue(item.sensordatavalues,"P1")) , "PM25":parseInt( getRightValue(item.sensordatavalues,"P2"))}, "id":item.sensor.id, "latitude":item.location.latitude,"longitude":item.location.longitude})
		}
		return filtered;
	}, []);

//	console.log(hmhexaPM_aktuell);

	hmhexaPM_24Stunden = data[1].reduce(function(filtered, item) {
		if (item.sensor.sensor_type.name == "SDS011") {
			filtered.push({"data":{"PM10": parseInt(getRightValue(item.sensordatavalues,"P1")) , "PM25":parseInt( getRightValue(item.sensordatavalues,"P2"))}, "id":item.sensor.id, "latitude":item.location.latitude,"longitude":item.location.longitude})
		}
		return filtered;
	}, []);

//	console.log(hmhexaPM_24Stunden);

//	REVOIR LES TYPES DE SENSORS

	hmhexatemp = data[2].reduce(function(filtered, item) {
		if (item.sensor.sensor_type.name == "BME280" || item.sensor.sensor_type.name == "DHT22") {
			filtered.push({"data":{"Temp":parseInt(getRightValue(item.sensordatavalues,"temperature"))}, "id":item.sensor.id, "latitude":item.location.latitude,"longitude":item.location.longitude})
		}
		return filtered;
	}, []);

	hmhexahumi = data[2].reduce(function(filtered, item) {
		if (item.sensor.sensor_type.name == "BME280" || item.sensor.sensor_type.name == "DHT22") {
			filtered.push({"data":{"Humi":parseInt(getRightValue(item.sensordatavalues,"humidity"))}, "id":item.sensor.id, "latitude":item.location.latitude,"longitude":item.location.longitude})
		}
		return filtered;
	}, []);

//	console.log(hmhexahumi);

	hmhexadruck = data[2].reduce(function(filtered, item) {
//		if (item.sensordatavalues.length == 3) {
		if (item.sensor.sensor_type.name == "BME280" || item.sensor.sensor_type.name == "BMP180" || item.sensor.sensor_type.name == "BMP280" ) {
			var value_temp = parseInt(getRightValue(item.sensordatavalues,"pressure_at_sealevel"))/100;
			if ((value_temp > 850) && (value_temp < 1200)) {
				filtered.push({"data":{"Press":value_temp}, "id":item.sensor.id, "latitude":item.location.latitude,"longitude":item.location.longitude})
			}
		}
		return filtered;
	}, []);

//	console.log(hmhexadruck);
    
    var dateParser = d3.timeParse("%Y-%m-%d %H:%M:%S");    
    var timestamp = dateParser(data[0][0].timestamp);

    console.log(timestamp);
    
    var localTime = new Date();
    var timeOffset = localTime.getTimezoneOffset(); 
    
    console.log(timeOffset);
    
    var newTime = d3.timeMinute.offset(timestamp, -(timeOffset));

    console.log(newTime);
    
    
    
    
    
    
    
    
    
    
    
    
    
    var dateFormater = locale.format("%A, %d. %B %Y, um %H:%M:%S");
    
//        var dateFormater = d3.timeFormat("%A %d %B %Y %H:%M:%S");

    
    	document.getElementById('update').innerHTML = "Last update: " + dateFormater(newTime);


    
//	document.getElementById('update').innerHTML = "Last update: " + data[0][0].timestamp;

	if(selector1 == "P1") {makeHexagonmap(hmhexaPM_aktuell,options1);};
	if(selector1 == "P2") {makeHexagonmap(hmhexaPM_aktuell,options2);};

	if(selector1 == "officialus"){makeHexagonmap(hmhexaPM_24Stunden,options3);};
	if(selector1 == "temp"){makeHexagonmap(hmhexatemp,options4);};
	if(selector1 == "humi"){makeHexagonmap(hmhexahumi,options5);};
	if(selector1 == "druck"){makeHexagonmap(hmhexadruck,options6);};

};

function makeHexagonmap(data,option){

	hexagonheatmap.initialize(option);
	hexagonheatmap.data(data);

};

function reload(val){
	console.log(val);

//	div.style("display", "none");
	d3.selectAll('path.hexbin-hexagon').remove();

	switch(val) {
		case "P1":
			selector1 = "P1";
			break;
		case "P2":
			selector1 = "P2";
			break;
		case "officialus":
			selector1 = "officialus";
			break;
		case "temp":
			selector1 = "temp";
			break;
		case "humi":
			selector1 = "humi";
			break;
		case "druck":
			selector1 = "druck";
			break;
	};

	console.log(selector1);

	if(selector1 == "P1"){
		hexagonheatmap.initialize(options1);
		hexagonheatmap.data(hmhexaPM_aktuell); 
		document.getElementById('legendaqius').style.visibility='hidden';
		document.getElementById('legendpm').style.visibility='visible';
		document.getElementById('legendpm2').style.visibility='hidden';
		document.getElementById('legendtemp').style.visibility='hidden';
		document.getElementById('legendhumi').style.visibility='hidden';
		document.getElementById('legenddruck').style.visibility='hidden';
	};

	if(selector1 == "P2"){
		hexagonheatmap.initialize(options2);
		hexagonheatmap.data(hmhexaPM_aktuell); 
		document.getElementById('legendaqius').style.visibility='hidden';
		document.getElementById('legendpm').style.visibility='hidden';
		document.getElementById('legendpm2').style.visibility='visible';
		document.getElementById('legendtemp').style.visibility='hidden';
		document.getElementById('legendhumi').style.visibility='hidden';
		document.getElementById('legenddruck').style.visibility='hidden';
	};

	if(selector1 == "officialus"){
		hexagonheatmap.initialize(options3);
		hexagonheatmap.data(hmhexaPM_24Stunden); 
		document.getElementById('legendaqius').style.visibility='visible';
		document.getElementById('legendpm').style.visibility='hidden';
		document.getElementById('legendpm2').style.visibility='hidden';
		document.getElementById('legendtemp').style.visibility='hidden';
		document.getElementById('legendhumi').style.visibility='hidden';
		document.getElementById('legenddruck').style.visibility='hidden';
	};

	if(selector1 == "temp"){
		hexagonheatmap.initialize(options4);
		hexagonheatmap.data(hmhexatemp); 
		document.getElementById('legendaqius').style.visibility='hidden';
		document.getElementById('legendpm').style.visibility='hidden';
		document.getElementById('legendpm2').style.visibility='hidden';
		document.getElementById('legendtemp').style.visibility='visible';
		document.getElementById('legendhumi').style.visibility='hidden';
		document.getElementById('legenddruck').style.visibility='hidden';
	};

	if(selector1 == "humi"){
		hexagonheatmap.initialize(options5);
		hexagonheatmap.data(hmhexahumi); 
		document.getElementById('legendaqius').style.visibility='hidden';
		document.getElementById('legendpm').style.visibility='hidden';
		document.getElementById('legendpm2').style.visibility='hidden';
		document.getElementById('legendtemp').style.visibility='hidden';
		document.getElementById('legendhumi').style.visibility='visible';
		document.getElementById('legenddruck').style.visibility='hidden';
	};

	if(selector1 == "druck"){
		hexagonheatmap.initialize(options6);
		hexagonheatmap.data(hmhexadruck); 
		document.getElementById('legendaqius').style.visibility='hidden';
		document.getElementById('legendpm').style.visibility='hidden';
		document.getElementById('legendpm2').style.visibility='hidden';
		document.getElementById('legendtemp').style.visibility='hidden';
		document.getElementById('legendhumi').style.visibility='hidden';
		document.getElementById('legenddruck').style.visibility='visible';
	}; 

	if (openedGraph.length >0){

		openedGraph.forEach(function(item){

			removeSvg2(item);
			displayGraph(item);

		});

	};

    
    
//    buildMenu();
    
//    sensorNr(dataStock);
    
};

function getRightValue(array,type){
	var value;
	array.forEach(function(item){
		if (item.value_type == type){value = item.value;};
	});
	return value;
};

//function success(position) {
//	var latitude  = position.coords.latitude;
//	var longitude = position.coords.longitude;
//
//	console.log("OK POSITION");
//
//	L.marker([latitude,longitude]).addTo(map);
//
//	map.setView([latitude, longitude], 10);
//
//};

//function error() {
//	console.log("Unable to retrieve your location");
//};


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
//	console.log('#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1));
	return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
};

function drop() {
	document.getElementById("control").classList.toggle("show");
	idselec1=0;
	idselec0=0;
}

function openSideBar(){
	var x = document.getElementById("sidebar");
	if (x.style.display === "block") {
		x.style.display = "none";
        
        if(openenedTab = true && !d3.select("#results").empty()){
           
           d3.select("#results").remove();
           openenedTab = false;
           
           };
        
        
	} else {
		x.style.display = "block";
	};
};






function openErklaerung(){
	var x = document.getElementById("map-info");
    
    console.log(x.style.display);
	if (x.style.display === "none") {
		x.style.display = "block";
//        		x.style.display = "inline-block";

        document.getElementById("erklaerung").innerHTML = "Erklärung ausblenden";
	} else {
		x.style.display = "none";
        document.getElementById("erklaerung").innerHTML = "Erklärung einblenden"
	};
};



L.HexbinLayer = L.Layer.extend({
	_undef (a) { return typeof a === 'undefined' },
	options: {
		radius: 25,
		opacity: 0.6,
		duration: 200,
		onmouseover: undefined,
		onmouseout: undefined,

//		REVOIR LE DOUBLECLIQUE

		click: sensorNr,

		lng: function (d) {
			return d.longitude
		},
		lat: function (d) {
			return d.latitude
		},
		value: function (d) {

//		Median everywhere!

			if (selector1 == "P1"){return parseInt(d3.median(d, (o) => o.o.data.PM10))}
			if (selector1 == "P2"){return parseInt(d3.median(d, (o) => o.o.data.PM25))}
			if (selector1 == "officialus"){return d3.median(d, (o) => officialaqius(o.o.data))}
			if (selector1 == "temp"){return d3.median(d, (o) => o.o.data.Temp)} 
			if (selector1 == "humi"){return d3.median(d, (o) => o.o.data.Humi)} 
			if (selector1 == "druck"){return d3.median(d, (o) => o.o.data.Press)} 
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

		let hexbin = d3Hexbin.hexbin()
//        		let hexbin = d3Hexbin()
//			.radius(this.options.radius / projection.scale)
			.radius(this.getFlexRadius() / projection.scale)
			.x( (d) => d.point.x )
			.y( (d) => d.point.y )
		let bins = hexbin(data)

//		console.log(bins)

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



var openedGraph = [];

function sensorNr(data){

	openedGraph = [];
    
    dataStock = data;

	var x = document.getElementById("sidebar");
	if (x.style.display = "none") {
		x.style.display = "block";
//		document.getElementById('menu').innerHTML='Close';
	};

    
    
    
    
    
    
    
    
    
    
    
	if (data.length == 1){

		if (selector1 == "P1"){
			var textefin = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensor</th><th class = 'titre'>PM10 &micro;g/m&sup3;</th></tr><tr><td class='idsens' value="+data[0].o.id+" onclick='displayGraph("+data[0].o.id+")'>(+) #"+data[0].o.id+"</td><td id='P1sens'>"+parseInt(data[0].o.data.PM10)+"</td></tr><tr id='graph_"+data[0].o.id+"'></tr></table>";
		};
		if (selector1 == "P2"){
			var textefin = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensor</th><th class = 'titre'>PM2.5 &micro;g/m&sup3;</th></tr><tr><td class='idsens' value="+data[0].o.id+" onclick='displayGraph("+data[0].o.id+")'>(+) #"+data[0].o.id+"</td><td id='P2sens'>"+parseInt(data[0].o.data.PM25)+"</td></tr><tr id='graph_"+data[0].o.id+"'></tr></table>";
		};
		if (selector1 == "officialus"){
			var textefin = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensor</th><th class = 'titre'>AQI US</th></tr><tr><td class='idsens' value="+data[0].o.id+" onclick='displayGraph("+data[0].o.id+")'>(+) #"+data[0].o.id+"</td><td id='AQIsens'>"+parseInt(officialaqius(data[0].o.data))+" ("+oriAQI+")</td></tr><tr id='graph_"+data[0].o.id+"'></tr></table>";
		};
		if (selector1 == "temp"){
			var textefin = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensor</th><th class = 'titre'>Temperature °C</th></tr><tr><td class='idsens' value="+data[0].o.id+" onclick='displayGraph("+data[0].o.id+")'>(+) #"+data[0].o.id+"</td><td id='tempsens'>"+parseInt(data[0].o.data.Temp)+"</td></tr><tr id='graph_"+data[0].o.id+"'></tr></table>";
		};
		if (selector1 == "humi"){
			var textefin = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensor</th><th class = 'titre'>Feuctigkeit %</th></tr><tr><td class='idsens' value="+data[0].o.id+" onclick='displayGraph("+data[0].o.id+")'>(+) #"+data[0].o.id+"</td><td id='humisens'>"+parseInt(data[0].o.data.Humi)+"</td></tr><tr id='graph_"+data[0].o.id+"'></tr></table>";
		};
		if (selector1 == "druck"){
			var textefin = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensor</th><th class = 'titre'>Druck hPa</th></tr><tr><td class='idsens' value="+data[0].o.id+" onclick='displayGraph("+data[0].o.id+")'>(+) #"+data[0].o.id+"</td><td id='drucksens'>"+parseInt(data[0].o.data.Press/10)+"</td></tr><tr id='graph_"+data[0].o.id+"'></tr></table>";
		};
	};

	if (data.length > 1){

		if (selector1 == "P1"){
			var texte = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensors</th><th class = 'titre'>PM10 &micro;g/m&sup3;</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='P1sens'>"+parseInt(d3.median(data, (o) => o.o.data.PM10))+"</td></tr>";

			var sensors = '';

			data.forEach(function(i) {
				sensors += "<tr><td class='idsens' value="+i.o.id+" onclick='displayGraph("+i.o.id+")'>(+) #"+i.o.id+"</td><td id='P1sens'>"+i.o.data.PM10+"</td></tr><tr id='graph_"+i.o.id+"'></tr>";
			});

			var textefin = texte + sensors + "</table>";

		};
		if (selector1 == "P2"){
			var texte = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensors</th><th class = 'titre'>PM2.5 &micro;g/m&sup3;</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='P2sens'>"+parseInt(d3.median(data, (o) => o.o.data.PM25))+"</td></tr>";

			var sensors = '';

			data.forEach(function(i) {
				sensors += "<tr><td class='idsens' value="+i.o.id+" onclick='displayGraph("+i.o.id+")'>(+) #"+i.o.id+"</td><td id='P2sens'>"+i.o.data.PM25+"</td></tr><tr id='graph_"+i.o.id+"'></tr>";
			});

			var textefin = texte + sensors + "</table>";

		};
		if (selector1 == "officialus"){
		var texte = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensors</th><th class = 'titre'>AQI US</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='AQIsens'>"+parseInt(d3.median(data, (o) => officialaqius(o.o.data)))+"</td></tr>";

			var sensors = '';

			data.forEach(function(i) {
				sensors += "<tr><td class='idsens' value="+i.o.id+" onclick='displayGraph("+i.o.id+")'>(+) #"+i.o.id+"</td><td id='AQIsens'>"+officialaqius(i.o.data)+" ("+oriAQI+")</td></tr><tr id='graph_"+i.o.id+"'></tr>";
			});

			var textefin = texte + sensors + "</table>";

		};
		if (selector1 == "temp"){

			var texte = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensors</th><th class = 'titre'>Temperature °C</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='tempsens'>"+parseInt(d3.median(data, (o) => o.o.data.Temp))+"</td></tr>";

			var sensors = '';

			data.forEach(function(i) {
				sensors += "<tr><td class='idsens' value="+i.o.id+" onclick='displayGraph("+i.o.id+")'>(+) #"+i.o.id+"</td><td id='tempsens'>"+i.o.data.Temp+"</td></tr><tr id='graph_"+i.o.id+"'></tr>";
			});

			var textefin = texte + sensors + "</table>";

		};
		if (selector1 == "humi"){

			var texte = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensors</th><th class = 'titre'>Feuchtigkeit %</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='humisens'>"+parseInt(d3.median(data, (o) => o.o.data.Humi))+"</td></tr>"; 

			var sensors = '';

			data.forEach(function(i) {
				sensors += "<tr><td class='idsens' value="+i.o.id+" onclick='displayGraph("+i.o.id+")'>(+) #"+i.o.id+"</td><td id='humisens'>"+i.o.data.Humi+"</td></tr><tr id='graph_"+i.o.id+"'></tr>";
			});

			var textefin = texte + sensors + "</table>";
		};
		if (selector1 == "druck"){
			var texte = "<table id='results' style='width:380px;'><tr><th class ='titre'>Sensors</th><th class = 'titre'>Druck hPa</th></tr><tr><td class='idsens'>Median "+data.length+" Sens.</td><td id='drucksens'>"+(d3.median(data, (o) => o.o.data.Press)).toFixed(1)+"</td></tr>";
			var sensors = '';

			data.forEach(function(i) {
				sensors += "<tr><td class='idsens' value="+i.o.id+" onclick='displayGraph("+i.o.id+")'>(+) #"+i.o.id+"</td><td id='drucksens'>"+i.o.data.Press.toFixed(1)+"</td></tr><tr id='graph_"+i.o.id+"'></tr>";
			});
			var textefin = texte + sensors + "</table>";
		};
	};

	div.transition()
		.duration(200)
		.style("display", "block");
//    		.style("display", "inline-block");

//    .style("display", "inline");


	div.html(textefin)
//		.style("left","0px")
        .style("padding","10px")		
		.style("top","100px");
};

function aqius(val,type){

	var index;

	if (type == 'P1'){
		if(parseInt(val) >= 0 && parseInt(val)<= 54){index = formula(50,0,54,0,parseInt(val))};
		if(parseInt(val) >= 55 && parseInt(val)<= 154){index = formula(100,51,154,55,parseInt(val))};
		if(parseInt(val) >= 155 && parseInt(val)<= 254){index = formula(150,101,254,155,parseInt(val))};
		if(parseInt(val) >= 255 && parseInt(val)<= 354){index = formula(200,151,354,255,parseInt(val)) };
		if(parseInt(val) >= 355 && parseInt(val)<= 424){index = formula(300,201,424,355,parseInt(val))};
		if(parseInt(val) >= 425 && parseInt(val)<= 504){index = formula(400,301,504,425,parseInt(val))};
		if(parseInt(val) >= 505 && parseInt(val)<= 604){index = formula(500,401,604,505,parseInt(val))}; 

		if(parseInt(val) > 604){index = 500};
	};

	if (type == 'P2'){
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


		if (!openedGraph.includes(sens)){
            
            openedGraph.push(sens);
        
        
        		console.log(openedGraph);

        		var iddiv = "#graph_"+sens;

        
        var td = d3.select(iddiv).append("td")
				.attr("id", "frame_"+sens)
				.attr("colspan", "2")
//				.attr("onclick","removeTd("+sens+")")
				.html("<iframe src='https://maps.luftdaten.info/grafana/d-solo/000000004/single-sensor-view?orgId=1&panelId=1&var-node="+sens+"' width='290' height='200' frameborder='0'></iframe><br><iframe src='https://maps.luftdaten.info/grafana/d-solo/000000004/single-sensor-view?orgId=1&panelId=2&var-node="+sens+"' width='290' height='200' frameborder='0'></iframe>");
            
            document.querySelectorAll("td.idsens[value='"+sens+"']")[0].innerHTML ="(-) #"+sens;
                        
        }else{
            
            document.querySelectorAll("td.idsens[value='"+sens+"']")[0].innerHTML ="(+) #"+sens;
            removeTd(sens);
            
            
        };


    
    
//    
//    
//	idselec1 = sens;
//
//	if (idselec1 != idselec0){
//		idselec0 = sens;
//
//		if (!openedGraph.includes(sens)){openedGraph.push(sens);};
//
//		console.log(openedGraph);
//
//		var iddiv = "#graph_"+sens;
//
//		var test = d3.select(iddiv).select("#frame_"+sens).empty();
//
//		console.log(test);
//		console.log(sens);
//        
//        console.log(test);
//
//
//		if (test ==true) {
//
//			console.log(sens+" OK");
//
////			REVOIR LES GRAPH DANS TABLEAU
//
//			var td = d3.select(iddiv).append("td")
//				.attr("id", "frame_"+sens)
//				.attr("colspan", "2")
////				.attr("onclick","removeTd("+sens+")")
//				.html("<iframe src='https://maps.luftdaten.info/grafana/d-solo/000000004/single-sensor-view?orgId=1&panelId=1&var-node="+sens+"' width='290' height='200' frameborder='0'></iframe><br><iframe src='https://maps.luftdaten.info/grafana/d-solo/000000004/single-sensor-view?orgId=1&panelId=2&var-node="+sens+"' width='290' height='200' frameborder='0'></iframe>");
//            
//            document.querySelectorAll("td.idsens[value='"+sens+"']")[0].innerHTML ="(-) #"+sens;
//                        
//		}else{
//            document.querySelectorAll("td.idsens[value='"+sens+"']")[0].innerHTML ="(+) #"+sens;
//            removeTd(sens);
//        };
//	};
//    
//    
//    
//    
    
      
    
};

function removeTd(id){
	d3.select("#frame_"+id).remove();
	removeInArray(openedGraph,id);
};

function officialaqius(data){
	var P1 = aqius(data.PM10,'P1');
	var P2 = aqius(data.PM25,'P2');

	if (P1>=P2){P1orP2 ='P1';oriAQI = "PM10";return P1};
	if (P1<P2){P1orP2 ='P2';oriAQI = "PM2.5";return P2};
};

function removeInArray(array) {
	var what, a = arguments, L = a.length, ax;
	while (L > 1 && array.length) {
		what = a[--L];
		while ((ax= array.indexOf(what)) !== -1) {
			array.splice(ax, 1);
		}
	}

	console.log(array);

	return array;
};
