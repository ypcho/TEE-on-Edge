#ifndef _ARDUINO_SECRETS_H_
#define _ARDUINO_SECRETS_H_

// WiFi Information
#define SECRET_SSID "" // your network SSID (name)
#define SECRET_PASS "" // your network password (use for WPA, or use as key for WEP)

// MQTT Server Information
#define MQTT_HOST ""   // MQTT Server Address
#define MQTT_PORT 0    // MQTT Server Port
#define MQTT_USER ""   // ACL username
#define MQTT_PW ""     // ACL password

// MQTT Connection Parameters
#define CMD_TIMEOUT_MS 30000
#define CON_TIMEOUT_MS 5000
#define KEEP_ALIVE_SEC 60
#define CLEAN_SESSION 1

#define DEVICE_NAME "" // MQTT Client ID

//#define LOG_ENABLE   //Enable for logging error
//#define LOG_VERBOSE  // Enable for logging info

#ifdef LOG_VERBOSE
	#undef LOG_VERBOSE
	#define LOG_VERBOSE 1
	
	#ifndef LOG_ENABLE
		#define LOG_ENABLE
	#endif
#else
	#undef LOG_VERBOSE
	#define LOG_VERBOSE 0
#endif

#endif
