import * as d3 from "d3";
import * as d3Hexbin from "d3-hexbin";

const hexbin = d3Hexbin.hexbin();


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
}
