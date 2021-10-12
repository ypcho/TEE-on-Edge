#include "MQTTClient.hpp"
#include "arduino_secrets.h"

#ifdef LOG_ENABLE
#include <Arduino.h>
#endif

static unsigned long connection_epoch;
static unsigned long connection_localtime;

unsigned long get_connection_timestamp(){
	if(!connection_epoch) connection_epoch = WiFi.getTime();
	return connection_epoch;
}
unsigned long get_connection_elapsed(){
	return millis() - connection_localtime;
}

int wifi_connect(unsigned int timeout_ms){
	unsigned long start = millis();
	
	int status = WiFi.status();
	
	if(status == WL_CONNECTED){
		return WL_CONNECTED;
	}
	
	do {
		status = WiFi.begin(SECRET_SSID, SECRET_PASS);
	} while(status != WL_CONNECTED && millis() - start < timeout_ms);
	
	connection_epoch = WiFi.getTime();
	connection_localtime = millis();
	
	return status;
}

static int net_connect(void * context, const char * host, word16 port, int timeout_ms){
  if(!context || !host || timeout_ms < 0){
    return MQTT_CODE_ERROR_BAD_ARG;
  }
  
  unsigned long start = millis();
  unsigned int timeout_ms_u = (unsigned int)timeout_ms;

  constexpr word16 default_port = 8883;
  if(port == 0) port = default_port;
  
  WiFiClient * W = (WiFiClient *)context;
  bool ret;
  
  do{
	
	ret = W->connectSSL(host, port);
	
	if(ret){
		return MQTT_CODE_SUCCESS;
	}
	
	{
		unsigned long elapsed = millis() - start;
		
		wifi_connect(timeout_ms_u > elapsed ? timeout_ms_u - elapsed : 0);
	}
	
  } while(millis() - start < timeout_ms_u);
  
  return MQTT_CODE_ERROR_NETWORK;
}

static int net_read(void * context, byte * buf, int buf_len, int timeout_ms){
  if(!context || !buf || buf_len <= 0 || timeout_ms < 0){
    return MQTT_CODE_ERROR_BAD_ARG;
  }

  unsigned long threshold = millis() + timeout_ms;

  WiFiClient * W = (WiFiClient *)context;
  
  if(!W->connected()){
#ifdef LOG_ENABLE
    Serial.print("net_read: request ");
    Serial.print(buf_len);
    Serial.println(" connection lost");
    Serial.print("connection status: ");
    Serial.println(W->status());
#endif

    return MQTT_CODE_ERROR_NETWORK;
  }

  int cnt = 0;

  do {
    int ret = W->read(&buf[cnt], buf_len - cnt);
	
    cnt += ret;
  } while(millis() <= threshold && W->connected() && cnt < buf_len);

#ifdef LOG_ENABLE
  if(LOG_VERBOSE || cnt < buf_len){
    Serial.print("net_read: request ");
    Serial.print(buf_len);
    Serial.print(" recv ");
    Serial.print(cnt);

    if(millis() > threshold){
      Serial.print(" timeout");
    }
    if(!W->connected()){
      Serial.print(" connection lost");
    }
    Serial.print('\n');

    Serial.print("connection status: ");
    Serial.println(W->status());
  }
#endif

  return cnt;
}

static int net_write(void * context, const byte * buf, int buf_len, int timeout_ms){
  if(!context || !buf || buf_len <= 0 || timeout_ms < 0){
    return MQTT_CODE_ERROR_BAD_ARG;
  }

  unsigned long threshold = millis() + timeout_ms;

  WiFiClient * W = (WiFiClient *)context;

  if(!W->connected()){
#ifdef LOG_ENABLE
    Serial.print("net_read: request ");
    Serial.print(buf_len);
    Serial.println(" connection lost");
    Serial.print("connection status: ");
    Serial.println(W->status());
#endif

    return MQTT_CODE_ERROR_NETWORK;
  }

  int cnt = 0;

  do {
    int ret = W->write(&buf[cnt], buf_len - cnt);
	
    cnt += ret;
  } while(millis() <= threshold && W->connected() && cnt < buf_len);

#ifdef LOG_ENABLE
  if(LOG_VERBOSE || cnt < buf_len){
    Serial.print("net_write: request ");
    Serial.print(buf_len);
    Serial.print(" sent ");
    Serial.print(cnt);

    if(millis() > threshold){
      Serial.print(" timeout");
    }
    if(!W->connected()){
      Serial.print(" connection lost");
    }
    Serial.print('\n');

    Serial.print("connection status: ");
    Serial.println(W->status());
  }
#endif

  return cnt;
}

static int net_disconnect(void * context){
  WiFiClient * W = (WiFiClient *)context;

  W->stop();

  return MQTT_CODE_SUCCESS;
}

MqttNetWiFi::MqttNetWiFi(WiFiClient & W){
	this->connect = net_connect;
	this->read = net_read;
	this->write = net_write;
	this->disconnect = net_disconnect;
	this->context = &W;
}

// static int mqttclient_message_cb(MqttClient *client, MqttMessage *msg,
//                                  byte msg_new, byte msg_done){
//   constexpr unsigned int PRINT_BUFFER_SIZE = 0x200;
//   byte buf[PRINT_BUFFER_SIZE + 1];
//   word32 len;

//   (void)client; /* Supress un-used argument */

//   if (msg_new) {
//     /* Determine min size to dump */
//     len = msg->topic_name_len;
//     if (len > PRINT_BUFFER_SIZE) {
//       len = PRINT_BUFFER_SIZE;
//     }
//     memcpy(buf, msg->topic_name, len);
//     buf[len] = '\0'; /* Make sure its null terminated */

//     /* Print incoming message */
//     Serial.print("MQTT Message: Topic ");
//     Serial.println((char*)buf);
//     Serial.print("Qos ");
//     Serial.println(msg->qos);
//     Serial.print("Len ");
//     Serial.println(msg->total_len);
//   }

//   /* Print message payload */
//   len = msg->buffer_len;
//   if (len > PRINT_BUFFER_SIZE) {
//     len = PRINT_BUFFER_SIZE;
//   }
//   memcpy(buf, msg->buffer, len);
//   buf[len] = '\0'; /* Make sure its null terminated */
//   Serial.print("Payload: ");
//   Serial.println((char*)buf);

//   if (msg_done) {
//     Serial.println("MQTT Message: Done");
//   }

//   /* Return negative to terminate publish processing */
//   return MQTT_CODE_SUCCESS;
// }

MqttConnectDefault::MqttConnectDefault(){
	memset(this, 0, sizeof(*this));
	
	this->keep_alive_sec = KEEP_ALIVE_SEC;
	this->clean_session = CLEAN_SESSION;
	this->client_id = DEVICE_NAME;
	
	// subscribe feature disabled
	this->enable_lwt = 0;
	
	this->username = nullptr;
	this->password = nullptr;
}

void MqttConnectDefault::setusername(const char * username){
	this->username = username;
}

void MqttConnectDefault::setpassword(const char * password){
	this->password = password;
}

MqttPublishDefault::MqttPublishDefault(){
	memset(this, 0, sizeof(*this));
	this->retain = 0;
	this->qos = MQTT_QOS_0;
	this->duplicate = 0;
	this->topic_name = nullptr;
	this->packet_id = 0;
	this->buffer = nullptr;
	this->total_len = 0;
}

void MqttPublishDefault::settopic(const char * topic){
	this->topic_name = topic;
}

void MqttPublishDefault::setpacket_id(word16 packet_id){
	this->packet_id = packet_id;
}

void MqttPublishDefault::setmessage(byte * msg, word16 msg_len){
	this->buffer = msg;
	this->total_len = msg_len;
}


MQTTClient::MQTTClient() : mqttnetclient(wificlient), host(nullptr), port(0) {
	
}

int MQTTClient::init(const char * host, word16 port, const char * username, const char * password, const char * topic){
	
	this->network_established = false;
	
	setserver(host, port);
	setacl(username, password);
	settopic(topic);
	
	return _init();
}

void MQTTClient::setserver(const char * host, word16 port){
	this->host = host;
	this->port = port;
}

void MQTTClient::setacl(const char * username, const char * password){
	this->username = username;
	this->password = password;
}

void MQTTClient::settopic(const char * topic){
	this->topic = topic;
}

int MQTTClient::_init(){
	int ret;

	ret = MqttClient_Init(&mqttclient, &mqttnetclient, nullptr, 
						tx_buf, sizeof(tx_buf), rx_buf, sizeof(rx_buf), CMD_TIMEOUT_MS);

	network_established = false;
	
#ifdef LOG_ENABLE
	if(LOG_VERBOSE || ret != MQTT_CODE_SUCCESS){
		Serial.print("MQTT Init: ");
		Serial.print(MqttClient_ReturnCodeToString(ret));
		Serial.print(" ");
		Serial.println(ret);
	}
#endif

	return ret;
}

int MQTTClient::_netconnect(){
	int ret;

	ret = MqttClient_NetConnect(&mqttclient, this->host, this->port, CON_TIMEOUT_MS, 
						0 /* NO TLS, TLS handled by chip */, nullptr /* NO TLS Cert Check Callback */);

	if(ret == MQTT_CODE_ERROR_NETWORK) network_established = false;
	if(ret == MQTT_CODE_SUCCESS) network_established = true;

#ifdef LOG_ENABLE
	if(LOG_VERBOSE || ret != MQTT_CODE_SUCCESS){
	Serial.print("MQTT Socket Connect: ");
	Serial.print(MqttClient_ReturnCodeToString(ret));
	Serial.print(" ");
	Serial.println(ret);
	}
#endif

	return ret;
}

int MQTTClient::_connect(){
	int ret;
	
	MqttConnectDefault connect;
	connect.setusername(username);
	connect.setpassword(password);

	ret = MqttClient_Connect(&mqttclient, &connect);

	if(ret == MQTT_CODE_ERROR_NETWORK) network_established = false;
	
#ifdef LOG_ENABLE
	if(LOG_VERBOSE || ret != MQTT_CODE_SUCCESS){
	  Serial.print("MQTT Connect: ");
	  Serial.print(MqttClient_ReturnCodeToString(ret));
	  Serial.print(" ");
	  Serial.println(ret);
	}
#endif

	return ret;
}

int MQTTClient::_send(byte * msg, word16 len){
	int ret;
	
	MqttPublishDefault publish;
	publish.settopic(topic);
	publish.setpacket_id(packet_id);
	publish.setmessage(msg, len);
	
	ret = MqttClient_Publish(&mqttclient, &publish);
	
	constexpr word16 PACKET_ID_MAX = 0xffff;
	
	packet_id = (packet_id == PACKET_ID_MAX ? 1 : packet_id+1);

	if(ret == MQTT_CODE_ERROR_NETWORK) network_established = false;

#ifdef LOG_ENABLE
	if(LOG_VERBOSE || ret != MQTT_CODE_SUCCESS){
		Serial.print("MQTT Publish: Topic ");
		Serial.print(publish.topic_name);
		Serial.print(", ");
		Serial.print(MqttClient_ReturnCodeToString(ret));
		Serial.print(", ");
		Serial.println(ret);
	}
#endif
	
	return ret;
}

int MQTTClient::_disconnect(){
	int ret;
	
	ret = MqttClient_Disconnect(&mqttclient);

	if(ret == MQTT_CODE_ERROR_NETWORK) network_established = false;
	
#ifdef LOG_ENABLE
	if(LOG_VERBOSE || ret != MQTT_CODE_SUCCESS){
		Serial.print("MQTT Disconnect: ");
		Serial.print(MqttClient_ReturnCodeToString(ret));
		Serial.print(" ");
		Serial.println(ret);
	}
#endif
	
	return ret;
}

int MQTTClient::_netdisconnect(){
	int ret;
	
	ret = MqttClient_NetDisconnect(&mqttclient);

	if(ret == MQTT_CODE_ERROR_NETWORK) network_established = false;

#ifdef LOG_ENABLE
	if(LOG_VERBOSE || ret != MQTT_CODE_SUCCESS){
		Serial.print("MQTT Socket Disconnect: ");
		Serial.print(MqttClient_ReturnCodeToString(ret));
		Serial.print(" ");
		Serial.println(ret);
	}
#endif
	
	return ret;
}

int MQTTClient::startconnection(){
	if(network_established) return MQTT_CODE_SUCCESS;
	
	int ret;

	ret = _netconnect();
	
	if(ret == MQTT_CODE_SUCCESS){
		ret = _connect();
	}
	
	return ret;
}

int MQTTClient::disconnect(){
	int ret;
	
	if(network_established) ret = _disconnect();
	
	ret = _netdisconnect();
	
	return ret;
}

int MQTTClient::recovernetwork(){
	if(network_established) return MQTT_CODE_SUCCESS;
	
	int ret;
	
	ret = _init();
	
	if(ret != MQTT_CODE_SUCCESS) return ret;
	
	ret = startconnection();
	
	return ret;
}

int MQTTClient::send(byte * msg, word16 len){
	int ret;
	
	if(!network_established){
		ret = recovernetwork();
  }
	
	if(network_established){
		ret = _send(msg, len);
	} else{
		ret = MQTT_CODE_ERROR_NETWORK;
	}
	
	return ret;
}
