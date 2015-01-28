# testdroid-client

testdroid-client is a client library for interacting with the Bitbar testdroid cloud API.

## Installation
```
$ npm install testdroid-client
```

## Usage
### Creating testdroid client instance
```javascript
var Testdroid = require('testdroid-client');

var username = 'joe@example.com';
var password = '123456';
var cloudUrl = 'http://cloudurl/';

var client = new Testdroid(cloudUrl, username, password);
```

### Listing all devices
```javascript
client.getDevices().then(function(devices) {
    console.dir(getDevices);
});
```

### Listing devices matching a particular name
```javascript

var device;
client.getDeviceByName('t2m flame').then(function(deviceInfo) {
    device = deviceInfo;
});
```

### Create device session
```javascript
var session;
client.startDeviceSession(device.id).then(function(sessionInfo) {
    session = sessionInfo;
});
```
### Create a proxy session for ADB
```javascript
var adbProxy;
client.getProxy('adb', session.id).then(function(proxyInfo) {
    adbProxy = proxyInfo;
});
```


