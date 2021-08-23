
interface PointTime {
    lat: number;
    lng: number;
    dtime: number; // dtime is approx delta time from now in hours
}

// Initialize and add the map
function initMap() {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    const map = new google.maps.Map(
        document.getElementById("map") as HTMLElement,
        {
            zoom: 6,
            center: { lat: 41.85, lng: -87.65 },
        }
    );
    directionsRenderer.setMap(map);

    directionsService
        .route({
            origin: "Chicago",
            destination: "New York City",
            travelMode: google.maps.TravelMode.DRIVING,
        })
        .then((response) => {
            directionsRenderer.setDirections(response);
            const steps = response.routes[0].legs[0].steps;
            let points = selectPoints(steps);
            // path.forEach(point => console.log(point.toString()));
            // let weatherReq = createWeatherReq(path[0]);
            // console.log(weatherReq);
            // fetch(weatherReq).then(async (response) => console.log(await response.json()));
        })
        .catch((e) => window.alert("Something broke: " + e));

}

function selectPoints(steps: google.maps.DirectionsStep[]): PointTime[] {
    let out: PointTime[] = [];
    const interval = 15 * 60; // take weather measurement every 15 mins
    const now = new Date();

    let leftover = 0;
    let numPoints = 0;
    let elapsed = 0;
    steps.forEach(function (step: google.maps.DirectionsStep) {
        let div = Math.floor((leftover + (step.duration as google.maps.Duration).value) / interval);
        let mod = (leftover + (step.duration as google.maps.Duration).value) % interval;
        leftover = mod;
        // console.log("getting " + div + " points");
        for (let i = 0; i < div; i++) {
            // console.log("path len " + step.path.length);
            let frac = (i * interval + leftover) / (step.duration as google.maps.Duration).value;
            let idx = Math.floor(frac * step.path.length);
            let point = step.path[idx];
            let time = roundHour(date.addSeconds(now, elapsed + i * interval + leftover));
            console.log(time);
        }
        numPoints += div;
        elapsed += (step.duration as google.maps.Duration).value;
    });

    return out;
}

function createWeatherReq(loc: google.maps.LatLng) {
    return "https://api.openweathermap.org/data/2.5/onecall?lat=" + loc.lat() + "&lon=" + loc.lng() + "&exclude=minutely,daily,alerts&appid=52037be8c16a9c969a9aa7e8722d164b";
}

function roundHour(date: Date) {
    date.setHours(date.getHours() + Math.round(date.getMinutes() / 60));
    date.setMinutes(0, 0, 0); // Resets also seconds and milliseconds

    return date;
}