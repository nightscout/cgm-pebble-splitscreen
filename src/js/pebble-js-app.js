var TIME_15_MINS = 15 * 60 * 1000,
    TIME_30_MINS = TIME_15_MINS * 2;

var lastAlert = 0;

// Defined to create the array which contains mg/dL values as well as mmol values (and text)
var unit_index = 2;  // set it out of range
var unit_index_mgdl = 0;
var unit_index_mmol = 1;

// arrays for each BG unit
// Kate - you'll need to comment on what each of the 9 levels represents.  I just moved them into a 2D array for indexing in the if/then/else below. - ML
var BG_levels = [[55, 3.0], [60, 3.3], [70, 4.0], [120, 6.6], [100,5.5], [120, 6.6], [180,10.0], [250,14.0], [300, 16.0]];
var unit_text = ["mg/dL", "mmol"];

				
// adding configuration screen for the units, secret key, web URL and Pebble name
Pebble.addEventListener("showConfiguration", function(e) {
                          console.log("Showing Configuration", JSON.stringify(e));
                          Pebble.openURL('http://cgminthecloud.github.io/cgm-pebble-splitscreen/config_split_1.html');
                        });

Pebble.addEventListener("webviewclosed", function(e) {
                          var opts = JSON.parse(decodeURIComponent(e.response));
                          console.log("CLOSE CONFIG OPTIONS = " + JSON.stringify(opts));
                          // store configuration in local storage
                          localStorage.setItem('splitCGMPebble', JSON.stringify(opts));   
                          
                          // set the index used for the unit BG array.
                          if (opts.units == "mgdl") {
                            unit_index = unit_index_mgdl;
//                            console.log("Unit Set - mg/dL - unit_index = " + unit_index);
                          }
                          else {
                            unit_index = unit_index_mmol;
//                            console.log("Unit Set - mmol - unit_index = " + unit_index);
                          }
                      
                        });

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
    
    var opts = [ ].slice.call(arguments).pop( );
    opts = JSON.parse(localStorage.getItem('splitCGMPebble'));

    // set the index used for the unit BG array.
    if (opts.units == "mgdl") {
      unit_index = unit_index_mgdl;
    }
    else {
      unit_index = unit_index_mmol;
    }
  
    req.open('GET', opts.endpoint1, true); //edit name below in message
    var req2 = new XMLHttpRequest();
    req2.open('GET', opts.endpoint2, true); // edit name below in message 

    req.onload = function(e) {
//        console.log(req.readyState);
        if (req.readyState == 4) {
//            console.log(req.status);
            if (req.status == 200) {
//                console.log("status: " + req.status);
                response = JSON.parse(req.responseText);
                console.log ("Response: " + JSON.stringify(response));

              // load response 2 early to do the full side by side comparison and loads
              req2.onload = function(o) {
                    var response2 = JSON.parse(req2.responseText);
                    console.log ("Response2: " + JSON.stringify(response2));
              
                    // top level variables
                    var alertValue = 0;
                    var sinceLastAlert = Date.now() - lastAlert;

                    // variables for response 1
                    var currentBG = response.bgs[0].sgv;
                    var currentDelta = response.bgs[0].bgdelta;
                    var currentTrend = DIRECTIONS(response.bgs[0].direction);
                    var battery = response.bgs[0].battery;

                    // variables for response 2
                    var currentBG2 = response2.bgs[0].sgv;
                    var currentDelta2 = response2.bgs[0].bgdelta;
                    var currentTrend2 = DIRECTIONS(response2.bgs[0].direction);
                    var battery2 = response2.bgs[0].battery;
 
                // add the + in front of the delta if it's above 0.
                if (currentDelta >= 0)
                    currentDelta = "+" + currentDelta;

                if (currentDelta2 >= 0)
                  currentDelta2 = "+" + currentDelta2;

                // prime alerts with response 1 and then override if higher with response 2
                if (currentBG < BG_levels[0][unit_index])
                    alertValue = 2;
                else if (currentBG < BG_levels[1][unit_index] && currentDelta < 0)
                    alertValue = 2;
                else if (currentBG < BG_levels[2][unit_index] && sinceLastAlert > TIME_15_MINS)
                    alertValue = 2;
                else if (currentBG < BG_levels[3][unit_index] && currentTrend == 7) //DBL_DOWN
                    alertValue = 2;
                else if (currentBG == BG_levels[4][unit_index] && currentTrend !== 0) //PERFECT SCORE
                    alertValue = 1;
                else if (currentBG > BG_levels[5][unit_index] && currentTrend == 1) //DBL_UP
                    alertValue = 3;
                else if (currentBG > BG_levels[6][unit_index] && sinceLastAlert > TIME_30_MINS && currentDelta > 0)
                    alertValue = 3;
                else if (currentBG > BG_levels[7][unit_index] && sinceLastAlert > TIME_30_MINS)
                    alertValue = 3;
                else if (currentBG > BG_levels[8][unit_index] && sinceLastAlert > TIME_15_MINS)
                    alertValue = 3;
                else
                    alertValue = 0;

                // over ride with 2 if higher
                if (currentBG2 < BG_levels[0][unit_index] && alertValue < 2)
                    alertValue = 2;
                else if (currentBG2 < BG_levels[1][unit_index] && currentDelta2 < 0 && alertValue < 2)
                    alertValue = 2;
                else if (currentBG2 < BG_levels[2][unit_index] && sinceLastAlert > TIME_15_MINS && alertValue < 2)
                    alertValue = 2;
                else if (currentBG2 < BG_levels[3][unit_index] && currentTrend2 == 7 && alertValue < 2) //DBL_DOWN
                    alertValue = 2;
                else if (currentBG2 == BG_levels[4][unit_index] && currentTrend2 !== 0 && alertValue < 1) //PERFECT SCORE
                    alertValue = 1;
                else if (currentBG2 > BG_levels[5][unit_index] && currentTrend2 == 1 && alertValue < 3) //DBL_UP
                    alertValue = 3;
                else if (currentBG2 > BG_levels[6][unit_index] && sinceLastAlert > TIME_30_MINS && currentDelta2 > 0 && alertValue < 3)
                    alertValue = 3;
                else if (currentBG2 > BG_levels[7][unit_index] && sinceLastAlert > TIME_30_MINS && alertValue < 3)
                    alertValue = 3;
                else if (currentBG2 > BG_levels[8][unit_index] && sinceLastAlert > TIME_15_MINS && alertValue < 3)
                    alertValue = 3;

                if (alertValue > 0) {
                    lastAlert = Date.now();
                }
                  if (battery == undefined || battery == null)
                      battery = "";
                  else battery = battery + "%";
  
                    if (battery2 == undefined || battery2 == null)
                        battery2 = "";
                    else battery2 = battery2 + "%";
                    
                    var message = {
                        alert: alertValue,
                        bg: currentBG,
                        readtime: formatDate(new Date(response.bgs[0].datetime)),
                        icon: currentTrend,
                        delta: battery + " " + opts.name1 + " " + currentDelta,
                        icon2: currentTrend2,
                        bg2: currentBG2,
                        readtime2: formatDate(new Date(response2.bgs[0].datetime)),
                        delta2: battery2 + " " + opts.name2 + " " + currentDelta2
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

      // check for configuration data
      var message;
      //get options from configuration window
  
      var opts = [ ].slice.call(arguments).pop( );
      opts = JSON.parse(localStorage.getItem('splitCGMPebble'));
  
  	  // check if endpoint exists
      if (!opts.endpoint1) {
          // endpoint doesn't exist, return no endpoint to watch
  		// " " (space) shows these are init values, not bad or null values
          message = {
            endpoint1: " ",
            name1: " ",
            endpoint2: " ",
            units: " ",
            name2: " ",
          };
          
          console.log("NO ENDPOINT JS message", JSON.stringify(message));
          Pebble.sendAppMessage(JSON.stringify(message));
          return;   
      }
	  
    });

Pebble.addEventListener("appmessage",
    function(e) {
        console.log("Received message: " + JSON.stringify(e.payload));
        fetchCgmData(e.payload.readtime, e.payload.bg);
    });
