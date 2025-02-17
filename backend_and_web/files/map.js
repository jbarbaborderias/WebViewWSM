var map;
var lat=0;
var lon=0;

/**
 * Add or replace a parameter (with value) in the given URL.
 * By Adil Malik, https://stackoverflow.com/questions/1090948/change-url-parameters/10997390#10997390
 * @param String url the URL
 * @param String param the parameter
 * @param String paramVal the value of the parameter
 * @return String the changed URL
 */
function updateURLParameter(url, param, paramVal) {
	var theAnchor = null;
	var newAdditionalURL = "";
	var tempArray = url.split("?");
	var baseURL = tempArray[0];
	var additionalURL = tempArray[1];
	var temp = "";

	if (additionalURL) {
		var tmpAnchor = additionalURL.split("#");
		var theParams = tmpAnchor[0];
		theAnchor = tmpAnchor[1];
		if(theAnchor) {
			additionalURL = theParams;
		}

		tempArray = additionalURL.split("&");

		for (i=0; i<tempArray.length; i++) {
			if(tempArray[i].split('=')[0] != param) {
				newAdditionalURL += temp + tempArray[i];
				temp = "&";
			}
		}        
	} else {
		var tmpAnchor = baseURL.split("#");
		var theParams = tmpAnchor[0];
		theAnchor  = tmpAnchor[1];

		if(theParams) {
			baseURL = theParams;
		}
	}

	if(theAnchor) {
		paramVal += "#" + theAnchor;
	}

	var rows_txt = temp + "" + param + "=" + paramVal;
	return baseURL + "?" + newAdditionalURL + rows_txt;
}

/**
 * Add or replace the language parameter of the URL and reload the page.
 * @param String id of the language
 */
function changeLanguage(pLang) {
	window.location.href = updateURLParameter(window.location.href, 'lang', pLang);
}

/**
 * Get all parameters out of the URL.
 * @return Array List of URL parameters key-value indexed
 */
function getUrlParameters() {
	var vars = [], hash;
	var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	for(var i=0; i<hashes.length; i++) {
		hash = hashes[i].split('=');
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	}
	return vars;
}

/**
 * Callback for successful geolocation.
 * @var position Geolocated position
 */
//function foundLocation(position) {
//	if (typeof map != "undefined") {
//		var lat = position.coords.latitude;
//		var lon = position.coords.longitude;
//		map.setView(new L.LatLng(lat, lon), 11);
//	}
//}

function foundLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(savePosition);
  } else { 
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function savePosition(position) {
	lat = position.coords.latitude;
  lon = position.coords.longitude;
  console.log(lat+" "+lon);
	map.setView(new L.LatLng(lat, lon), 11);
}


/**
 * Example function to replace leaflet-openweathermap's builtin marker by a wind rose symbol.
 * Some helper functions and an event listener are needed, too. See below.
 */
function myWindroseMarker(data) {
	var content = '<canvas id="id_' + data.id + '" width="50" height="50"></canvas>';
	var icon = L.divIcon({html: content, iconSize: [50,50], className: 'owm-div-windrose'});
	return L.marker([data.coord.Lat, data.coord.Lon], {icon: icon, clickable: false});
}



/**
 * Helper function for replacing leaflet-openweathermap's builtin marker by a wind rose symbol.
 * This function draws the canvas of one marker symbol once it is available in the DOM.
 */
function myWindroseDrawCanvas(data, owm) {

	var canvas = document.getElementById('id_' + data.id);
	canvas.title = data.name;
	var angle = 0;
	var speed = 0;
	var gust = 0;
	if (typeof data.wind != 'undefined') {
		if (typeof data.wind.speed != 'undefined') {
			canvas.title += ', ' + data.wind.speed + ' m/s';
			canvas.title += ', ' + owm._windMsToBft(data.wind.speed) + ' BFT';
			speed = data.wind.speed;
		}
		if (typeof data.wind.deg != 'undefined') {
			//canvas.title += ', ' + data.wind.deg + '°';
			canvas.title += ', ' + owm._directions[(data.wind.deg/22.5).toFixed(0)];
			angle = data.wind.deg;
		}
		if (typeof data.wind.gust != 'undefined') {
			gust = data.wind.gust;
		}
	}
	if (canvas.getContext && speed > 0) {
		var red = 0;
		var green = 0;
		if (speed <= 10) {
			green = 10*speed+155;
			red = 255*speed/10.0;
		} else {
			red = 255;
			green = 255-(255*(Math.min(speed, 21)-10)/11.0);
		}
		var ctx = canvas.getContext('2d');
		ctx.translate(25, 25);
		ctx.rotate(angle*Math.PI/180);
		ctx.fillStyle = 'rgb(' + Math.floor(red) + ',' + Math.floor(green) + ',' + 0 + ')';
		ctx.beginPath();
		ctx.moveTo(-15, -25);
		ctx.lineTo(0, -10);
		ctx.lineTo(15, -25);
		ctx.lineTo(0, 25);
		ctx.fill();

		// draw inner arrow for gust
		if (gust > 0 && gust != speed) {
			if (gust <= 10) {
				green = 10*gust+155;
				red = 255*gust/10.0;
			} else {
				red = 255;
				green = 255-(255*(Math.min(gust, 21)-10)/11.0);
			}
			canvas.title += ', gust ' + data.wind.gust + ' m/s';
			canvas.title += ', ' + owm._windMsToBft(data.wind.gust) + ' BFT';
			ctx.fillStyle = 'rgb(' + Math.floor(red) + ',' + Math.floor(green) + ',' + 0 + ')';
			ctx.beginPath();
			ctx.moveTo(-15, -25);
			ctx.lineTo(0, -10);
			//ctx.lineTo(15, -25);
			ctx.lineTo(0, 25);
			ctx.fill();
		}
	} else {
		canvas.innerHTML = '<div>'
				+ (typeof data.wind != 'undefined' && typeof data.wind.deg != 'undefined' ? data.wind.deg + '°' : '')
				+ '</div>';
	}
}

/**
 * Helper function for replacing leaflet-openweathermap's builtin marker by a wind rose symbol.
 * This function is called event-driven when the layer and its markers are added. Now we can draw all marker symbols.
 * The this-context has to be the windrose layer.
 */
function windroseAdded(e) {
	for (var i in this._markers) {
		var m = this._markers[i];
		var cv = document.getElementById('id_' + m.options.owmId);
		for (var j in this._cache._cachedData.list) {
			var station = this._cache._cachedData.list[j];
			if (station.id == m.options.owmId) {
				myWindroseDrawCanvas(station, this);
			}
		}
	}
}

/**
 * Example function to replace leaflet-openweathermap's builtin marker.
 */
function myOwmMarker(data) {
	// just a Leaflet default marker
	return L.marker([data.coord.Lat, data.coord.Lon]);
}

/**
 * Example function to replace leaflet-openweathermap's builtin popup.
 */
function myOwmPopup(data) {
	// just a Leaflet default popup
	return L.popup().setContent(typeof data.name != 'undefined' ? data.name : data.id);
}

/**
 * Toggle scroll wheel behaviour.
 */
function toggleWheel(localLang) {
	if (map.scrollWheelZoom._enabled) {
		map.scrollWheelZoom.disable();
		document.getElementById('wheelimg').src = 'files/ScrollWheelDisabled20.png';
		document.getElementById('wheeltxt').innerHTML = getI18n('scrollwheel', localLang) + ' ' + getI18n('off', localLang);
	} else {
		map.scrollWheelZoom.enable();
		document.getElementById('wheelimg').src = 'files/ScrollWheel20.png';
		document.getElementById('wheeltxt').innerHTML = getI18n('scrollwheel', localLang) + ' ' + getI18n('on', localLang);
	}
}

function loadCrowd(map){
	// TODO: Load Crowd only in a radius?
	var markers = new L.markerClusterGroup();
	var fireIcon = new L.icon({ iconUrl: 'files/fire.png', iconAnchor: [15,15]  });
	var fogIcon = new L.icon({ iconUrl: 'files/fog.png',   iconAnchor:   [15,15] });
	var sosIcon = new L.icon({ iconUrl: 'files/sos.png',   iconAnchor: [15,15] });


	$.ajaxSetup( { "async": true, "cache": false } );  // remove line for (slow) async behaviour
	$.getJSON("/api/Getcrowd.php" + "?limit=0", function(pois) {
		for (var i in pois) {
			console.log(pois[i]);
			if(pois[i].type=='fog'){
				var marker =  L.marker([pois[i].lat,pois[i].lon],{icon:fogIcon});
			} else if(pois[i].type=='sos'){
				var marker =  L.marker([pois[i].lat,pois[i].lon],{icon:sosIcon});
			} else{
				var marker =  L.marker([pois[i].lat,pois[i].lon],{icon:fireIcon});
			}
			marker.bindPopup(pois[i].type);
			markers.addLayer(marker)
		}
		map.addLayer(markers);
	});
}

function getMyDate(){
		var today = new Date();
		var date = today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+today.getDate();
		today.setDate(today.getDate()-1);
		var before = today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+today.getDate();
		return before+'/'+date;
}

/**
 * Initialize the map.
 */
function initMap() {

	var rango = getMyDate();
	var standard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors</a>'
		});

	var terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-background/{z}/{x}/{y}{r}.{ext}', {
			attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			subdomains: 'abcd',
			minZoom: 0,
			maxZoom: 18,
			ext: 'png'
			});

	var viirs = L.tileLayer.wms('https://ies-ows.jrc.ec.europa.eu/gwis?',{
		layers:'viirs.hs',
    format:'image/png',
    transparent: true,
    version: '1.1.1',
    time: rango,
    service: 'WMS'});

	var modis = L.tileLayer.wms('https://ies-ows.jrc.ec.europa.eu/gwis?',{
		layers:'modis.hs',
    format:'image/png',
    transparent: true,
    version: '1.1.1',
    time: rango,
    service: 'WMS'});
	var forest = L.tileLayer('https://s3-eu-west-1.amazonaws.com/vito-lcv/2015/rgb1/{z}/{x}/{y}.png',{
			noWrap:!1,
			maxZoom:20,
			maxNativeZoom:10,
			tms:!0,
			});
	if (forest.options.legendImagePath ==null) {
		forest.options.legendImagePath = 'https://openweathermap.org/img/a/PN.png'
	}

	var humanitarian = L.tileLayer('https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
		maxZoom: 17,
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors</a> <a href="https://www.hotosm.org/" target="_blank">Tiles courtesy of Humanitarian OpenStreetMap Team</a>'
		});

	var esri = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.jpg", {
		maxZoom: 19, attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	});

	// Get your own free OWM API key at https://www.openweathermap.org/appid - please do not re-use mine!
	// You don't need an API key for this to work at the moment, but this will change eventually.
	var OWM_API_KEY = '35f811dd5f393339388aa0ad9664cb05';

	var clouds = L.OWM.clouds({opacity: 0.8, legendImagePath: 'files/NT2.png', appId: OWM_API_KEY});
	var cloudscls = L.OWM.cloudsClassic({opacity: 0.5, appId: OWM_API_KEY});
	var precipitation = L.OWM.precipitation( {opacity: 0.5, appId: OWM_API_KEY} );
	var precipitationcls = L.OWM.precipitationClassic({opacity: 0.5, appId: OWM_API_KEY});
	var rain = L.OWM.rain({opacity: 0.5, appId: OWM_API_KEY});
	var raincls = L.OWM.rainClassic({opacity: 0.5, appId: OWM_API_KEY});
	var snow = L.OWM.snow({opacity: 0.5, appId: OWM_API_KEY});
	var pressure = L.OWM.pressure({opacity: 0.4, appId: OWM_API_KEY});
	var pressurecntr = L.OWM.pressureContour({opacity: 0.5, appId: OWM_API_KEY});
	var temp = L.OWM.temperature({opacity: 0.5, appId: OWM_API_KEY});
	var wind = L.OWM.wind({opacity: 0.5, appId: OWM_API_KEY});

	var localLang = getLocalLanguage();

	var city = L.OWM.current({intervall: 15, imageLoadingUrl: 'leaflet/owmloading.gif', lang: localLang, minZoom: 5,
			appId: OWM_API_KEY});
	var windrose = L.OWM.current({intervall: 15, imageLoadingUrl: 'leaflet/owmloading.gif', lang: localLang, minZoom: 4,
			appId: OWM_API_KEY, markerFunction: myWindroseMarker, popup: false, clusterSize: 50,
   			imageLoadingBgUrl: 'https://openweathermap.org/img/w0/iwind.png' });
	windrose.on('owmlayeradd', windroseAdded, windrose); // Add an event listener to get informed when windrose layer is ready

	var useGeolocation = true;
	var zoom = 6;
	//var lat = 51.58;
	//var lon = 10.1;
	var urlParams = getUrlParameters();
	if (typeof urlParams.zoom != "undefined" && typeof urlParams.lat != "undefined" && typeof urlParams.lon != "undefined") {
		zoom = urlParams.zoom;
		lat = urlParams.lat;
		lon = urlParams.lon;
		useGeolocation = false;
	}

	map = L.map('map', {
		center: new L.LatLng(lat, lon), zoom: zoom,
		layers: [standard]
	});
	map.attributionControl.setPrefix("");

	map.addControl(L.languageSelector({
		languages: new Array(
			L.langObject('en', 'English', 'mapicons/en.png')
		,	L.langObject('de', 'Deutsch', 'mapicons/de.png')
		,	L.langObject('fr', 'Français', 'mapicons/fr.png')
		,	L.langObject('it', 'Italiano', 'mapicons/it.png')
		,	L.langObject('es', 'Español', 'mapicons/es.png')
		,	L.langObject('ca', 'Català', 'mapicons/catalonia.png')
		,	L.langObject('ru', 'Русский', 'mapicons/ru.png')
		,	L.langObject('nl', 'Nederlands', 'mapicons/nl.png')
		,	L.langObject('pt_br', 'Português do Brasil', 'mapicons/br.png')
		),
		callback: changeLanguage,
		initialLanguage: localLang,
		hideSelected: false,
		vertical: false
	}));

	var baseMaps = {
		"OSM Standard": standard
		, "OSM Humanitarian": humanitarian
		, "Stamen Design" :  terrain
		, "NDVI" : forest 
	//	, "ESRI Aerial": esri
	};

	var overlayMaps = {};

	overlayMaps[getI18n('viirs', localLang)] = viirs;
	overlayMaps[getI18n('modis', localLang)] = modis;
	overlayMaps[getI18n('clouds', localLang)] = clouds;
	overlayMaps[getI18n('cloudscls', localLang)] = cloudscls;
	overlayMaps[getI18n('precipitation', localLang)] = precipitation;
	overlayMaps[getI18n('precipitationcls', localLang)] = precipitationcls;
	overlayMaps[getI18n('rain', localLang)] = rain;
	overlayMaps[getI18n('raincls', localLang)] = raincls;
	overlayMaps[getI18n('snow', localLang)] = snow;
	overlayMaps[getI18n('temp', localLang)] = temp;
	overlayMaps[getI18n('windspeed', localLang)] = wind;
	overlayMaps[getI18n('pressure', localLang)] = pressure;
	overlayMaps[getI18n('presscont', localLang)] = pressurecntr;
	overlayMaps[getI18n('city', localLang) + " (min Zoom 5)"] = city;
	overlayMaps[getI18n('windrose', localLang)] = windrose;


	var layerControl = L.control.layers(baseMaps, overlayMaps, {collapsed: true}).addTo(map);
	map.addControl(new L.Control.Permalink({layers: layerControl, useAnchor: false, position: 'bottomright'}));

// TODO: Remove all ourCustomControl and draw in a easy way
	var ourCustomControl = L.Control.extend({
		options: {
		position: 'topleft' 
	},
		onAdd: function (map) {
			var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom bloc');
			container.style.backgroundColor = 'white';
			container.style.width = '30px';
			container.style.height = '30px';
			container.onclick = function(){
			map.setView(new L.LatLng(lat, lon), 15);
			}
		return container;
	},
});
	var ourCustomControl2 = L.Control.extend({
		options: {
		position: 'topleft' 
	},
		onAdd: function (map) {
			var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom bfire');
			//container.style.backgroundColor = 'white';
			container.style.background = 'fire.png';
			container.style.width = '30px';
			container.style.height = '30px';
			container.onclick = function(){
				console.log('lat '+lat+'log '+lon);
				map.setView(new L.LatLng(lat, lon), 15);
 				$.ajax({
					url: "/api/Upload.php",
					data: {
            type: "fire",
						lat: lat,
            lon: lon
					},
					success: function(data){
						loadCrowd(map);
					},
					cache: false,
				});
			}
		return container;
	},
});

	var ourCustomControl3 = L.Control.extend({
		options: {
		position: 'topleft' 
	},
		onAdd: function (map) {
			var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom bfog');
			container.style.backgroundColor = 'white';
			container.style.width = '30px';
			container.style.height = '30px';
			container.onclick = function(){
				console.log('lat '+lat+'log '+lon);
				map.setView(new L.LatLng(lat, lon), 15);
 				$.ajax({
					url: "/api/Upload.php",
					data: {
					 	type: "fog",
						lat: lat,
            lon: lon
					},
					success: function(data){
						loadCrowd(map);
					},
					cache: false,
				});
			}
		return container;
	},
});
	var ourCustomControl4 = L.Control.extend({
		options: {
		position: 'topleft' 
	},
		onAdd: function (map) {
			var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom bsos');
			container.style.backgroundColor = 'white';
			container.style.width = '30px';
			container.style.height = '30px';
			container.onclick = function(){
				console.log('lat '+lat+'log '+lon);
				map.setView(new L.LatLng(lat, lon), 15);
 				$.ajax({
					url: "/api/Upload.php",
					data: {
					 	type: "sos",
						lat: lat,
            lon: lon
					},
					success: function(data){
						loadCrowd(map);
					},
					cache: false,
				});
			}
		return container;
	},
});

// Popup to get weather
var popup = L.popup();

function onMapClick(e) {
	$.getJSON({
		url: "https://api.openweathermap.org/data/2.5/weather",
		data: {
			lon: e.latlng.lng,
			lat: e.latlng.lat,
			units: "metric",
			appid: "35f811dd5f393339388aa0ad9664cb05"
		},
		success: function(data){
			popup
				.setLatLng(e.latlng)
				//.setContent("You clicked the map at " + e.latlng.toString())
				.setContent("<b>Current Weather</b>"+
										"<br/><b>Location: </b>"+data.name+
						        "<br/><b>Temperature: </b>"+data.main.temp+
										"<br/><b>Humidity: </b>"+data.main.humidity+
										"<br/><b>Windspeed: </b>"+data.wind.speed+
										"<br/><b>Windirection: </b>"+data.wind.deg
						)
				.openOn(map);
		},
		cache: false,
	})
}
function onMapClick2(e) {
	$.getJSON({
		url: "https://api.openweathermap.org/data/2.5/forecast",
		data: {
			lon: e.latlng.lng,
			lat: e.latlng.lat,
			units: "metric",
			appid: "35f811dd5f393339388aa0ad9664cb05"
		},
		success: function(data){
			popup
				.setLatLng(e.latlng)
				//.setContent("You clicked the map at " + e.latlng.toString())
				.setContent("<b>Forecast</b>"+
						        "<br/><b>Location: </b>"+data.city.name+
										"<br/><b>Population: </b>"+data.city.population+
										"<br/><b>When: "+data.list[0].dt_txt+"</b>"+
										"<br/><b>Temperature: </b>"+data.list[0].main.temp+
										"<br/><b>Humidity: </b>"+data.list[0].main.humidity+
										"<br/><b>Windspeed: </b>"+data.list[0].wind.speed+
										"<br/><b>Windirection: </b>"+data.list[0].wind.deg+
					"<br/><b>When: "+data.list[1].dt_txt+"</b>"+
										"<br/><b>Temperature: </b>"+data.list[1].main.temp+
										"<br/><b>Humidity: </b>"+data.list[1].main.humidity+
										"<br/><b>Windspeed: </b>"+data.list[1].wind.speed+
										"<br/><b>Windirection: </b>"+data.list[1].wind.deg+
					"<br/><b>When: "+data.list[2].dt_txt+"</b>"+
										"<br/><b>Temperature: </b>"+data.list[2].main.temp+
										"<br/><b>Humidity: </b>"+data.list[2].main.humidity+
										"<br/><b>Windspeed: </b>"+data.list[2].wind.speed+
										"<br/><b>Windirection: </b>"+data.list[2].wind.deg+
					"<br/><b>When: "+data.list[3].dt_txt+"</b>"+
										"<br/><b>Temperature: </b>"+data.list[3].main.temp+
										"<br/><b>Humidity: </b>"+data.list[3].main.humidity+
										"<br/><b>Windspeed: </b>"+data.list[3].wind.speed+
										"<br/><b>Windirection: </b>"+data.list[3].wind.deg
						)
				.openOn(map);
		},
		cache: false,
	})
}

map.on('click', onMapClick);
map.on('contextmenu', onMapClick2)
map.addControl(new ourCustomControl());
map.addControl(new ourCustomControl2());
map.addControl(new ourCustomControl3());
map.addControl(new ourCustomControl4());

loadCrowd(map);

	// patch layerControl to add some titles
	var patch = L.DomUtil.create('div', 'owm-layercontrol-header');
	patch.innerHTML = getI18n('layers', localLang); // 'TileLayers';
	layerControl._form.children[2].parentNode.insertBefore(patch, layerControl._form.children[2]);
	patch = L.DomUtil.create('div', 'leaflet-control-layers-separator');
	layerControl._form.children[3].children[0].parentNode.insertBefore(patch, layerControl._form.children[3].children[layerControl._form.children[3].children.length-2]);
	patch = L.DomUtil.create('div', 'owm-layercontrol-header');
	patch.innerHTML = getI18n('current', localLang); // 'Current Weather';
	layerControl._form.children[3].children[0].parentNode.insertBefore(patch, layerControl._form.children[3].children[layerControl._form.children[3].children.length-2]);
	patch = L.DomUtil.create('div', 'owm-layercontrol-header');
	patch.innerHTML = getI18n('maps', localLang); // 'Maps';
	layerControl._form.children[0].parentNode.insertBefore(patch, layerControl._form.children[0]);

	patch = L.DomUtil.create('div', 'leaflet-control-layers-separator');
	layerControl._form.children[0].parentNode.insertBefore(patch, null);
	patch = L.DomUtil.create('div', 'owm-layercontrol-header');
	patch.innerHTML = getI18n('prefs', localLang); // 'Preferences';
	layerControl._form.children[0].parentNode.insertBefore(patch, null);
	patch = L.DomUtil.create('div', '');
	patch.innerHTML = '<div id="wheeldiv" onClick="toggleWheel(\'' + localLang + '\')"><img id="wheelimg" src="files/ScrollWheel20.png" align="middle" > <span id="wheeltxt">' + getI18n('scrollwheel', localLang) + ' ' + getI18n('on', localLang) + '</span></div>';
	layerControl._form.children[0].parentNode.insertBefore(patch, null);

	if (useGeolocation && typeof navigator.geolocation != "undefined") {
		navigator.geolocation.getCurrentPosition(foundLocation);
	}
}
