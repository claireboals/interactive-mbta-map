// TODO
// host this on netlify
// figure out all these variables and which to keep
// add stops to map using MBTA API
// add current train locations
// make all of these togglable with buttons

var myLat = 0;
var myLng = 0;
var me = new google.maps.LatLng(myLat, myLng);

var path_coords_a = new Array(17);
var path_coords_b = new Array(6);


var stations = {"stops":[{"name":"Alewife","lat":"42.395428","long":"-71.142483","id":"place-alfcl"},{"name":"Davis","lat":"42.39674","long":"-71.121815","id":"place-davis"},{"name":"Porter Square","lat":"42.3884","long":"-71.11914899999999","id":"place-portr"},{"name":"Harvard Square","lat":"42.373362","long":"-71.118956","id":"place-harsq"},{"name":"Central Square","lat":"42.365486","long":"-71.103802","id":"place-cntsq"},{"name":"Kendall/MIT","lat":"42.36249079","long":"-71.08617653","id":"place-knncl"},{"name":"Charles/MGH","lat":"42.361166","long":"-71.070628","id":"place-chmnl"},{"name":"Park Street","lat":"42.35639457","long":"-71.0624242","id":"place-pktrm"},{"name":"Downtown Crossing","lat":"42.355518","long":"-71.060225","id":"place-dwnxg"},{"name":"South Station","lat":"42.352271","long":"-71.05524200000001","id":"place-sstat"},{"name":"Broadway","lat":"42.342622","long":"-71.056967","id":"place-brdwy"},{"name":"Andrew","lat":"42.330154","long":"-71.057655","id":"place-andrw"},{"name":"JFK/UMass","lat":"42.320685","long":"-71.052391","id":"place-jfk"},{"name":"Savin Hill","lat":"42.31129","long":"-71.053331","id":"place-shmnl"},{"name":"Fields Corner","lat":"42.300093","long":"-71.061667","id":"place-fldcr"},{"name":"Shawmut","lat":"42.29312583","long":"-71.06573796000001","id":"place-smmnl"},{"name":"Ashmont","lat":"42.284652","long":"-71.06448899999999","id":"place-asmnl"},{"name":"North Quincy","lat":"42.275275","long":"-71.029583","id":"place-nqncy"},{"name":"Wollaston","lat":"42.2665139","long":"-71.0203369","id":"place-wlsta"},{"name":"Quincy Center","lat":"42.251809","long":"-71.005409","id":"place-qnctr"},{"name":"Quincy Adams","lat":"42.233391","long":"-71.007153","id":"place-qamnl"},{"name":"Braintree","lat":"42.2078543","long":"-71.0011385","id":"place-brntn"}]};
var routes = {"lines":[{"name":"Red","color":"#cd0000"}, {"name":"Orange","color":"#FFA500"}, 
                    {"name":"Blue","color":"#0080ff"}, {"name":"Green-B","color":"#00843D"},
                    {"name":"Green-C","color":"#00843D"}, {"name":"Green-D","color":"#00843D"},
                    {"name":"Green-E","color":"#00843D"}]};

var myOptions = {
    zoom: 13, // The larger the zoom number, the bigger the zoom
    center: me,
    mapTypeId: google.maps.MapTypeId.ROADMAP
};

var map;
var marker;
var address;
var path;
var infowindow;

var marker_ray;
var stations;

var station_icon = "MBTA_icon.png";

function init() {
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    south = new google.maps.LatLng(stations.stops[9].lat, stations.stops[9].long);
    map.panTo(south);
    renderMap();

}

function renderMap() {

    marker_ray = new Array(stations.stops.length);
    var i;

    infowindow = new google.maps.InfoWindow();

    // adds stops as MBTA icons from stations array above
    for (i = 0; i < stations.stops.length; i++){

        var stop = new google.maps.LatLng(stations.stops[i].lat, stations.stops[i].long);
        marker_ray[i] = new google.maps.Marker({
            position: stop,
            icon: station_icon,
            title: "<h1>" + stations.stops[i].name + "</h1>"
        });
        marker_ray[i].setMap(map);
        
        //windows(stations.stops[i].id, marker_ray[i]); <--- function that doesnt get used
        
    }
    
    // Add all MBTA lines to map as polylines
    for (i = 0; i < routes.lines.length; i++){
        addLine(routes.lines[i].name, routes.lines[i].color);
    }
}

// LINES

// Access MBTA API to find each line's map location
function addLine(name, color) {
    var request = new XMLHttpRequest();
    address = "https://api-v3.mbta.com/shapes?include=stops&filter[route]=" + name;
    request.open("GET", address, true);

    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) 
        {
            theData = request.responseText;
            paths = JSON.parse(theData);

            for (i = 0; i < paths.data.length; i++) {
                var line = paths.data[i].attributes.polyline;
                var decoded = google.maps.geometry.encoding.decodePath(line);
                var train_path = new google.maps.Polyline( {
                    strokeColor: color,
                    path: decoded
                });
                train_path.setMap(map);
            }
        }
    }
    request.send();
}

// this function doesnt get used (???)
function windows(id, marker) {
    var content = '<p>';

    var request = new XMLHttpRequest();
    address = "https://api-v3.mbta.com/predictions?filter[route]=Red&filter[stop]=" + id + "&page[limit]=10&page[offset]=0&sort=departure_time&api_key=6cce7cd3b50f43d28e450bf98d43e4d7";

    request.open("GET", address, true);

    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) 
        {
            var time;
            var direction;
            theData = request.responseText;
            station = JSON.parse(theData);


            for (j = 0; j < station.data.length; j++) {

                current = station.data[j];

                if (current.attributes.direction_id == 1)
                    direction = "Northbound (Alewife)";
                else
                    direction = "Southbound (Ashmont/Braintree)";

                time = current.attributes.departure_time;

                var dir = "Departing";

                if (time == null){
                    time = current.attributes.arrival_time;
                    dir = "Arriving";
                }

                if (time != null)
                    time = time.substr(11, 8);
                else
                    time = "No time available";

                content += '<p>' +dir + ': ' + time + ', ' + direction + '</p>';
            }
            content += '</p>';

            if (content == '<p></p>')
                content = "Not available";

            addInfoWindow(marker, content);
            
        }
    }

    request.send();
}

// this function doesnt get used (???)
function addInfoWindow(marker, message) {
    var infoWindow = new google.maps.InfoWindow({
        content: marker.title + message 
    });

    google.maps.event.addListener(marker, 'click', function () {
        infoWindow.open(map, marker);
    });
}