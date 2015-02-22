# cgm-pebble-splitscreen

[![Join the chat at https://gitter.im/nightscout/cgm-pebble-splitscreen](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/nightscout/cgm-pebble-splitscreen?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
Pebble app to view data from two nightscout servers.

Steps to get it running on your own :

1. Go to cloudpebble.net 

2. Import from github and enter the cgm-pebble-splitscreen url .

3. Edit the pebble-js-app.js file on line :
 
        46: First pebble URL (Should begin with http or https )

        48:Second pebble URL
        
        115: First Name
        
        119: Second Name 

4.Save changes , go to compilation and build the app.

5.Download the pbw file to pebble connected phone and install the file .
