#ifndef _MQTTCLIENT_CPP_H_
#define _MQTTCLIENT_CPP_H_

// Backend: wolfMQTT

#include <WiFiNINA.h>
#include <wolfMQTT.h>

unsigned long get_connection_timestamp();
unsigned long get_connection_elapsed();

int wifi_connect(unsigned int timeout_ms);

struct MqttNetWiFi : MqttNet {
  public:

  MqttNetWiFi(WiFiClient & W);
};

struct MqttConnectDefault : MqttConnect{
	public:
	
	MqttConnectDefault();
	void setusername(const char *);
	void setpassword(const char *);
};

struct MqttPublishDefault : MqttPublish{
	public:
	
	MqttPublishDefault();
	
	void settopic(const char *);
	void setpacket_id(word16 packet_id);
	void setmessage(byte * msg, word16 len);
};

class MQTTClient{
	public:
		MQTTClient();
		
		//primitives
		int init(const char * host, word16 port, const char * username, const char * password, const char * topic);
		int startconnection();
		int disconnect();
		int recovernetwork();
		int send(byte * msg, word16 len);
	
	private:
		void setserver(const char * host, word16 port);
		void setacl(const char * username, const char * password);
		void settopic(const char * topic);
		
		//void showmembers(int);
		
		//primitives
		int _init();
		int _netconnect();
		int _connect();
		int _send(byte * msg, word16 len);
		int _disconnect();
		int _netdisconnect();
	
		// client structs
		WiFiClient wificlient;
		MqttNetWiFi mqttnetclient;
		MqttClient mqttclient;
		
		// settings
		const char * host;
		word16 port;
		const char * username;
		const char * password;
		const char * topic;
		word16 packet_id;
		
		// network status
		bool network_established;
		
		// buffers
		static constexpr unsigned int BUF_SIZE = 0x400;
		byte tx_buf[BUF_SIZE];
		byte rx_buf[BUF_SIZE];
};

#endif