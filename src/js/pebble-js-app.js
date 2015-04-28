var TIME_15_MINS = 15 * 60 * 1000,
    TIME_30_MINS = TIME_15_MINS * 2;

var lastAlert = 0;

function DIRECTIONS(direction) {
    switch (direction) {

        case "NONE":
            return 0;
            
        case "DoubleUp":
            return 1;
            
        case "SingleUp":
            return 2;
            
        case "FortyFiveUp":
            return 3;
            
        case "Flat":
            return 4;
            
        case "FortyFiveDown":
            return 5;
            
        case "SingleDown":
            return 6;
            
        case "DoubleDown":
            return 7;
            
        case 'NOT COMPUTABLE':
            return 8;
            
        case 'RATE OUT OF RANGE':
            return 9;
          
    }
}

function fetchCgmData(lastReadTime, lastBG) {

    var response;
    var req = new XMLHttpRequest();
  req.open('GET', "TOP HALF DATA ENDPOINT ", true); //edit name below in message
    var req2 = new XMLHttpRequest();
  req2.open('GET', "BOTTOM HALF DATA ENDPOINT", true); // edit name below in message 

    req.onload = function(e) {
      //  console.log(req.readyState);
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
                    currentTrend = DIRECTIONS(bgs[0].direction);
              console.log("Current Delta:"+ currentDelta);

                  //  delta = "Change: " + currentDelta + "mg/dL";
                var battery = bgs[0].battery;
                if (battery === undefined || battery === null)
                    battery = "";
                else battery = battery + "%";

                if (parseInt(currentDelta) >= 0)
                    currentDelta = "+" + currentDelta;
              var currentConvBG = currentBG;
                var  specialValue = false;
               var responsecals = response.cals;
              //RAW BG
             var currentCalcRaw = 0,
                    //currentCalcRaw = 100000,
                    formatCalcRaw = " ",
                    currentRawFilt = bgs[0].filtered,
                    formatRawFilt = " ",
                    currentRawUnfilt = bgs[0].unfiltered,
                    formatRawUnfilt = " ",
                    currentNoise = bgs[0].noise,
                    currentIntercept = "undefined",
                    currentSlope = "undefined",
                    currentScale = "undefined",
                    currentRatio = 0;
              
              if (responsecals && responsecals.length > 0) {
                      currentIntercept = responsecals[0].intercept;
                      currentSlope = responsecals[0].slope;
                      currentScale = responsecals[0].scale;
                    }
              
              if (currentBG < 30) { specialValue = true; }
                 // assign calculated raw value if we can
                    if ( (typeof currentIntercept != "undefined") && (currentIntercept != "null") ){
                        if (specialValue) {
                          // don't use ratio adjustment
                          currentCalcRaw = (currentScale * (currentRawUnfilt - currentIntercept) / currentSlope);
                          //console.log("Special Value Calculated Raw: " + currentCalcRaw);
                        } 
                        else {
                          currentRatio = (currentScale * (currentRawFilt - currentIntercept) / currentSlope / currentConvBG);
                          currentCalcRaw = (currentScale * (currentRawUnfilt - currentIntercept) / currentSlope / currentRatio);
                          //console.log("Current Ratio: " + currentRatio);
                          //console.log("Normal BG Calculated Raw: " + currentCalcRaw);
                        }          
                    } // if currentIntercept                

                    // assign raw sensor values if they exist
                    if ( (typeof currentRawUnfilt != "undefined") && (currentRawUnfilt != "null") ) {
                     
                        formatRawFilt = ((Math.round(currentRawFilt / 1000)).toFixed(0));
                        formatRawUnfilt = ((Math.round(currentRawUnfilt / 1000)).toFixed(0));
                        formatCalcRaw = ((Math.round(currentCalcRaw)).toFixed(0));
                        //console.log("Format Unfiltered: " + formatRawUnfilt);
                      
                     
                    } // if currentRawUnfilt


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
                  if(req2.readyState==4 && req2.status==200){
                  
                    var response2 = JSON.parse(req2.responseText);
                    var battery2 = response2.bgs[0].battery;
                    if (battery2 === undefined || battery2 === null)
                        battery2 = "";
                    else battery2 = battery2 + "%";

                    if (parseInt(response2.bgs[0].bgdelta) >= 0)
                        response2.bgs[0].bgdelta = "+" + response2.bgs[0].bgdelta;
                    var currentBG2= response2.bgs[0].sgv;
                      var currentConvBG2 = currentBG2;
                var  specialValue2 = false;
                   var responsecals2 = response2.cals;
                    
                    
                      //RAW BG
             var currentCalcRaw2 = 0,
                  //  currentCalcRaw2 = 100000,
                   formatCalcRaw2 = " ",
                    currentRawFilt2 = response2.bgs[0].filtered,
                    formatRawFilt2 = " ",
                    currentRawUnfilt2 = response2.bgs[0].unfiltered,
                    formatRawUnfilt2 = " ",
                    currentNoise2 = response2.bgs[0].noise,
                    currentIntercept2 = "undefined",
                    currentSlope2 = "undefined",
                    currentScale2 = "undefined",
                    currentRatio2 = 0;
                                        if (responsecals2 && responsecals2.length > 0) {
                      currentIntercept2 = responsecals2[0].intercept;
                      currentSlope2 = responsecals2[0].slope;
                      currentScale2 = responsecals2[0].scale;
                    }
              if (currentBG2 < 30) { specialValue2 = true; }
                 // assign calculated raw value if we can
                    if ( (typeof currentIntercept2 != "undefined") && (currentIntercept2 != "null") ){
                        if (specialValue2) {
                          // don't use ratio adjustment
                          currentCalcRaw2 = (currentScale2 * (currentRawUnfilt2 - currentIntercept2) / currentSlope2);
                          //console.log("Special Value Calculated Raw: " + currentCalcRaw2);
                        } 
                        else {
                          currentRatio2 = (currentScale2 * (currentRawFilt2 - currentIntercept2) / currentSlope2 / currentConvBG2);
                          currentCalcRaw2 = (currentScale2 * (currentRawUnfilt2 - currentIntercept2) / currentSlope2 / currentRatio2);
                          //console.log("Current Ratio: " + currentRatio);
                          //console.log("Normal BG Calculated Raw: " + currentCalcRaw);
                        }          
                    } // if currentIntercept                

                    // assign raw sensor values if they exist
                    if ( (typeof currentRawUnfilt2 != "undefined") && (currentRawUnfilt2 != "null") ) {
                     
                        formatRawFilt2 = ((Math.round(currentRawFilt2 / 1000)).toFixed(0));
                        formatRawUnfilt2 = ((Math.round(currentRawUnfilt2 / 1000)).toFixed(0));
                        formatCalcRaw2 = ((Math.round(currentCalcRaw2)).toFixed(0));
                        //console.log("Format Unfiltered: " + formatRawUnfilt2);
                      
                     
                    } // if currentRawUnfilt

                    var message = {
                        alert: alertValue,
                        bg: currentBG,
                        readtime: formatDate(new Date(bgs[0].datetime)),
                        icon: currentTrend,
                      delta: formatCalcRaw + " "+battery+" " + currentDelta,
                        icon2: DIRECTIONS(response2.bgs[0].direction),
                        bg2: response2.bgs[0].sgv,
                        readtime2: formatDate(new Date(response2.bgs[0].datetime)),
                        delta2: formatCalcRaw2 + " "+battery2+" " + response2.bgs[0].bgdelta

                    };

                    console.log("message: " + JSON.stringify(message));
                    Pebble.sendAppMessage(message);



                }
              
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
