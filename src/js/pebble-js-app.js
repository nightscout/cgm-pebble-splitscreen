var TIME_15_MINS = 15 * 60 * 1000,
    TIME_30_MINS = TIME_15_MINS * 2;

var lastAlert = 0;

function DIRECTIONS(direction) {
    switch (direction) {

        case "NONE":
            return 0;
            break;
        case "DoubleUp":
            return 1;
            break;
        case "SingleUp":
            return 2;
            break;
        case "FortyFiveUp":
            return 3;
            break;
        case "Flat":
            return 4;
            break;
        case "FortyFiveDown":
            return 5;
            break;
        case "SingleDown":
            return 6;
            break;
        case "DoubleDown":
            return 7;
            break;
        case 'NOT COMPUTABLE':
            return 8;
            break;
        case 'RATE OUT OF RANGE':
            return 9;
            break;
    }
};

function fetchCgmData(lastReadTime, lastBG) {

    var response;
    var req = new XMLHttpRequest();
    req.open('GET', "http://104.131.134.170/pebble", true);
    var req2 = new XMLHttpRequest();
    req2.open('GET', "http://104.131.134.170:8080/pebble", true);

    req.onload = function(e) {
        console.log(req.readyState);
        if (req.readyState == 4) {
            console.log(req.status);
            if (req.status == 200) {
                console.log("status: " + req.status);
                response = JSON.parse(req.responseText);

                var now = Date.now(),
                    sinceLastAlert = now - lastAlert,
                    alertValue = 0,
                    bgs = response.bgs,
                    currentBG = bgs[0].sgv,
                    currentDelta = bgs[0].bgdelta,
                    currentTrend = DIRECTIONS(bgs[0].direction),

                    delta = "Change: " + currentDelta + "mg/dL";
                var battery = bgs[0].battery;
                if (battery == undefined || battery == null)
                    battery = "";
                else battery = battery + "%";

                if (parseInt(currentDelta) >= 0)
                    currentDelta = "+" + currentDelta;


                if (currentBG < 55)
                    alertValue = 2;
                else if (currentBG < 60 && currentDelta < 0)
                    alertValue = 2;
                else if (currentBG < 70 && sinceLastAlert > TIME_15_MINS)
                    alertValue = 2;
                else if (currentBG < 120 && currentTrend == 7) //DBL_DOWN
                    alertValue = 2;
                else if (currentBG == 100 && currentTrend !== 0) //PERFECT SCORE
                    alertValue = 1;
                else if (currentBG > 120 && currentTrend == 1) //DBL_UP
                    alertValue = 3;
                else if (currentBG > 200 && sinceLastAlert > TIME_30_MINS && currentDelta > 0)
                    alertValue = 3;
                else if (currentBG > 250 && sinceLastAlert > TIME_30_MINS)
                    alertValue = 3;
                else if (currentBG > 300 && sinceLastAlert > TIME_15_MINS)
                    alertValue = 3;

                if (alertValue > 0) {
                    lastAlert = now;
                }


                req2.onload = function(o) {
                    var response2 = JSON.parse(req2.responseText);
                    var battery2 = response2.bgs[0].battery;
                    if (battery2 == undefined || battery2 == null)
                        battery2 = "";
                    else battery2 = battery2 + "%";

                    if (parseInt(response2.bgs[0].bgdelta) >= 0)
                        response2.bgs[0].bgdelta = "+" + response2.bgs[0].bgdelta;

                    var message = {
                        alert: alertValue,
                        bg: currentBG,
                        readtime: formatDate(new Date(bgs[0].datetime)),
                        icon: currentTrend,
                        delta: battery + " Parker " + currentDelta,
                        icon2: DIRECTIONS(response2.bgs[0].direction),
                        bg2: response2.bgs[0].sgv,
                        readtime2: formatDate(new Date(response2.bgs[0].datetime)),
                        delta2: battery2 + " Madison " + response2.bgs[0].bgdelta

                    };

                    console.log("message: " + JSON.stringify(message));
                    Pebble.sendAppMessage(message);



                };

                req2.send(null);


            }
        }
    };
    req.send(null);

}

function timeAgo(offset) {
    var
        span = [],
        MINUTE = 60,
        HOUR = 3600,
        DAY = 86400,
        WEEK = 604800;

    if (offset <= MINUTE) span = ['now', ''];
    else if (offset < (MINUTE * 60)) span = [Math.round(Math.abs(offset / MINUTE)), 'min'];
    else if (offset < (HOUR * 24)) span = [Math.round(Math.abs(offset / HOUR)), 'hr'];
    else if (offset < (DAY * 7)) span = [Math.round(Math.abs(offset / DAY)), 'day'];
    else if (offset < (WEEK * 52)) span = [Math.round(Math.abs(offset / WEEK)), 'week'];
    else span = ['a long time', ''];

    if (span[1])
        return span.join(' ') + ' ago';
    else
        return span[0];

}


function formatDate(date) {

    var secsSinceLast = (Date.now() - date) / 1000;
    var formatted = timeAgo(secsSinceLast);
    return formatted;
}

Pebble.addEventListener("ready",
    function(e) {
        console.log("connect: " + e.ready);
        //fetchCgmData(0, 0);
    });

Pebble.addEventListener("appmessage",
    function(e) {
        console.log("Received message: " + JSON.stringify(e.payload));
        fetchCgmData(e.payload.readtime, e.payload.bg);
    });