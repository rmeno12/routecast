"use strict";

// Initialize and add the map
function initMap() {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 6,
        center: { lat: 41.85, lng: -87.65 },
    });
    directionsRenderer.setMap(map);

    let button = document.getElementById("submit");
    button.addEventListener("click", () => {
        let start = document.getElementById("start").value;
        let end = document.getElementById("end").value;
        directionsService
            .route({
                origin: start,
                destination: end,
                travelMode: google.maps.TravelMode.DRIVING,
            })
            .then((response) => {
                directionsRenderer.setDirections(response);
                const steps = response.routes[0].legs[0].steps;
                let points = selectPoints(steps);

                points.forEach(async function (point) {
                    let weather = (await getWeather(point));
                    let icon = "https://openweathermap.org/img/wn/" + weather.weather[0].icon + ".png";
                    let content =
                        '<div id="weatherinfo">' +
                        '<h2>' + weather.weather[0].description + '</h2>' +
                        '<h3>in about ' + point.dtime + ' hours </h3>' +
                        '<p>' + (weather.pop * 100) + '% chance of precipitation</p>' +
                        '<p>' + weather.temp + '\u00B0' + 'F</p>' +
                        '</div>';

                    const info = new google.maps.InfoWindow({
                        content: content
                    });
                    const marker = new google.maps.Marker({
                        position: point,
                        icon: icon,
                        map,
                    });
                    marker.addListener("click", () => {
                        info.open({
                            anchor: marker,
                            map,
                            shouldFocus: true
                        });
                    });
                    map.addListener("drag", () => {
                        info.close();
                    });
                });
            }).catch((e) => window.alert("Something broke: " + e));
    })
}

function selectPoints(steps) {
    let out = [];
    const interval = 60 * 60; // take weather measurement every 60 mins
    const now = new Date();

    let leftover = 0;
    let numPoints = 0;
    let elapsed = 0;
    steps.forEach(function (step) {
        let div = Math.floor((leftover + step.duration.value) / interval);
        let mod = (leftover + step.duration.value) % interval;
        leftover = mod;
        // console.log("getting " + div + " points");
        for (let i = 0; i < div; i++) {
            // console.log("path len " + step.path.length);
            let frac = (i * interval + leftover) / step.duration.value;
            let idx = Math.floor(frac * step.path.length);
            let point = step.path[idx];
            let time = roundHour(date.addSeconds(now, elapsed + i * interval + leftover));
            let dtime = getDtime(time);
            out.push({ lat: point.lat(), lng: point.lng(), dtime: dtime });
        }
        numPoints += div;
        elapsed += step.duration.value;
    });

    return out;
}

function createWeatherReq(loc) {
    return "https://api.openweathermap.org/data/2.5/onecall?lat=" + loc.lat + "&lon=" + loc.lng + "&exclude=minutely,daily,alerts&appid=52037be8c16a9c969a9aa7e8722d164b&units=imperial";
}

function roundHour(inp) {
    inp.setHours(inp.getHours() + Math.round(inp.getMinutes() / 60));
    inp.setMinutes(0, 0, 0);
    return inp;
}

function getDtime(time) {
    let diff = time - new Date();
    return Math.floor(diff / (60 * 60 * 1000));
}

async function getWeather(point) {
    let r = await fetch(createWeatherReq(point));

    let info = await r.json();
    // console.log(info);
    let weather;
    if (point.dtime > 0) {
        weather = info.hourly[point.dtime - 1];
    } else {
        weather = info.current;
    }
    return weather;
}
