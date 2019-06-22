module.exports = {
// table headings
	"(Sensor)": {
		"de": "Sensor",
	},
	"PM10 &micro;g/m&sup3;": {},
	"PM2.5 &micro;g/m&sup3;": {},
	"AQI US": {},
	"Temperature °C": {
		"de": "Temperatur °C",
	},
	"Humidity %": {
		"de": "Feuchtigkeit %",
	},
	"Pressure hPa": {
		"de": "Luftdruck hPa",
	},

// select options
	" Temperature": {
		"de": " Temperatur",
	},
	" rel. Humidity": {
		"de": " rel. Luftfeuchte",
	},
	" Pressure": {
		"de": " Luftdruck",
	},

// sidebar
	"Hide explanation": {
		"de": "Erklärung ausblenden",
	},
	"Show explanation": {
		"de": "Erklärung einblenden",
	},
	"(close)": {
		"de": "(schließen)",
	},

// last update
	"Last update": {
		"de": "Letztes Update",
	},

// explanation
	"<p>The hexagons represent the median of the current values of the sensors which are contained in the area, according to the option selected (PM10, PM2.5, temperature, relative humidity, pressure, AQI). You can refer to the scale on the left side of the map.</p> \
<p>By clicking on a hexagon, you can display a list of all the corresponding sensors as a table. The first column lists the sensor-IDs. In the first line, you can see the amount of sensor in the area and the median value.</p> \
<p>By clicking on the plus symbol next to a sensor ID, you can display two graphics: the individual measurements for the last 24 hours and the 24 hours floating mean for the last seven days. For technical reasons, the first of the 8 days displayed on the graphic has to stay empty.\
The values are refreshed every 5 minutes in order to fit with the measurement frequency of the Airrohr sensors.</p> \
<p>The Air Quality Index (AQI) is calculated according to the recommandations of the United States Environmental Protection Agency. Further information is available on the official page.(<a href='https://www.airnow.gov/index.cfm?action=aqibasics.aqi'>Link</a>). Hover over the AQI scale to display the levels of health concern.</p>": {
		"de": "<p>Die Kacheln zeigen aktuell den Durchschnitt der PM10-Werte aller in der Zelle befindlichen Sensoren. Diese werden nach der Skala unten links entsprechend eingefärbt.</p> \
<p>Die Zahlen in der ersten Spalte enthält die Sensor-IDs. Befinden sich mehrere Sensoren in der Kachel, so wird der Durchschnittswerte aller in der Zelle enthaltenen Sensoren berechnet.</p> \
<p><b>Achtung</b>: Wir zeigen auf der Karte die Werte der <b>letzten 5 Minuten</b> an. Die von den jeweiligen Landesbehörden veröffentlichen Werte werden als ein 24-Stunden-Mittelwert angegeben. Dadurch können die Werte deutlich vom 24-Stunden-Mittelwert abweichen.</p> \
<p>Ein Klick auf das Plus vor der Sensor-ID blendet zwei Grafiken ein. Die erste Grafik zeigt den '24 h floating average' (den gleitenden 24-Stunden-Mittelwert) der letzten 7 Tage an. \
Die zweite Grafik 'Last 24 hours' zeigt den Tagesverlauf für die letzten 24 Stunden.</p>",
	},

// AQI descriptions
	"Good<div class='tooltip-div'>Air quality is considered satisfactory, and air pollution poses little or no risk.</div>": {
		"de": "Gut<div class='tooltip-div'>Die Qualität der Luft ist zufriedenstellend. Die Luftverschmutzung stellt ein geringes oder kein Risiko dar.</div>",
	},
	"Moderate<div class='tooltip-div'>Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.</div>": {
		"de": "Mäßig<div class='tooltip-div'>Die Luftqualität ist insgesamt akzeptabel. Bei manchen Schadstoffen bestehen jedoch für einen sehr kleinen Personenkreis, der außergewöhnlich empfindlich auf Luftverschmutzung reagiert, eventuell Gesundheitsbedenken.</div>",
	},
	"Unhealthy for Sensitive Groups<div class='tooltip-div'>Members of sensitive groups may experience health effects. The general public is not likely to be affected.</div>": {
		"de": "Ungesund für empfindliche Personen<div class='tooltip-div'>Bei empfindlichen Personengruppen können gesundheitliche Auswirkungen auftreten. Die allgemeine Öffentlichkeit ist höchstwahrscheinlich nicht betroffen.</div>",
	},
	"Unhealthy<div class='tooltip-div'>Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.</div>": {
		"de": "Ungesund<div class='tooltip-div'>Erste gesundheitliche Auswirkungen können sich bei allen Personengruppen einstellen. Bei empfindlichen Personengruppen können ernstere gesundheitliche Auswirkungen auftreten.</div>",
	},
	"Very Unhealthy<div class='tooltip-div'>Health alert: everyone may experience more serious health effects.</div>": {
		"de": "Sehr ungesund<div class='tooltip-div'>Gesundheitswarnung aufgrund einer Notfallsituation. Die gesamte Bevölkerung ist voraussichtlich betroffen.</div>",
	},
	"Hazardous<div class='tooltip-div'>Health warnings of emergency conditions. The entire population is more likely to be affected.</div>": {
		"de": "Gefährlich<div class='tooltip-div'>Gesundheitsalarm: Jeder könnte ernstere Auswirkungen auf die Gesundheit verspüren</div>",
	},

// Betterplace
	"Donate for Luftdaten.info (Hardware, Software) now on Betterplace.org": {
		"de": "Jetzt spenden für 'Luftdaten.info' (Hardware, Software) auf betterplace.org!",
		"nl": "Doneer voor 'Luftdaten.info' op betterplace.org",
	},
	"Donate for<br/>Luftdaten.info<br/>now on<br/><span>Betterplace.org</span>": {
		"de": "Jetzt für<br/>Luftdaten.info<br/>spenden auf<br/><span>Betterplace.org</span>",
		"nl": "Doneer vor<br/>Luftdaten.info<br/>op<br/><span>Betterplace.org</span>",
	},
}
