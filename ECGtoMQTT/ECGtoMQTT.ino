#include "arduino_secrets.h"
#include "LED.hpp"
#include "MQTTClient.hpp"

// // WiFiNINA
#include <WiFiNINA.h>

// // wolfMQTT with TLS
#include <wolfMQTT.h>

static void serialsetup(){
  Serial.begin(9600);

  while(!Serial) ;
}

static LED_OUT builtinled(LED_BUILTIN);

// START WIFI
//////please enter your sensitive data in the Secret tab/arduino_secrets.h
static void wifisetup() {
  // check for the WiFi module:
  while (WiFi.status() == WL_NO_MODULE) {
    // don't continue
    Serial.println("No WiFi Module Found");
    delay(5000);
  }

  String fv = WiFi.firmwareVersion();

  if (fv < WIFI_FIRMWARE_LATEST_VERSION) {
    Serial.println("Please upgrade the firmware");
    while (true);
  }

  Serial.println("trying WiFi connection...");
  while (wifi_connect(1000) != WL_CONNECTED);

  Serial.println("WiFi successfully connected");
}
// END WIFI

static MQTTClient mqttclient;

static int readECG(){
  const int DIGITAL_PIN_LO_PLUS = 10;
  const int DIGITAL_PIN_LO_MINUS = 11;
  const int ANALOG_PIN_ECG = A0;

  if(digitalRead(DIGITAL_PIN_LO_PLUS) == HIGH)
    return -2;
  else if(digitalRead(DIGITAL_PIN_LO_MINUS) == HIGH)
    return -1;
  else return analogRead(ANALOG_PIN_ECG);

  return -3;
}

void setup() {
  // put your setup code here, to run once:
  serialsetup();
  wifisetup();
  mqttclient.init(MQTT_HOST, MQTT_PORT, MQTT_USER, MQTT_PW, "hello");

  int ret;
  do{
    Serial.println("trying connection...");
    ret = mqttclient.startconnection();

    // if(ret != MQTT_CODE_SUCCESS){
    //   constexpr int interval = 600;

    //   builtinled.represent_on(interval);
    //   builtinled.represent_off(interval);
    // }

  } while(ret != MQTT_CODE_SUCCESS);
}

void loop() {
  // put your main code here, to run repeatedly:

  // constexpr int interval = 20;
  // static bool led_on = false;
  // if(!led_on){
  //   builtinled.represent_on(interval);
  //   led_on = true;
  // } else{
  //   builtinled.represent_off(interval);
  // }

  static unsigned long msgcount = 0;
  static unsigned int last_error = 0;

  {
    constexpr unsigned long log_interval = 1 * 1000;
    static unsigned long last_log = millis();
    static unsigned long last_msgcount = msgcount;
    if(millis() - last_log > log_interval){
      unsigned long now = millis();
      Serial.print("[");
      Serial.print(get_connection_timestamp());
      Serial.print(", ");
      Serial.print(get_connection_elapsed());
      Serial.print("] ");

      Serial.print("sent ");
      Serial.print(msgcount - last_msgcount);
      Serial.print(" messages");

      Serial.print(" ");
      Serial.print(last_error);
      Serial.println(" errors");

      last_log = now;
      last_msgcount = msgcount;
      last_error = 0;
    }
  }

  byte msg[0x80];
  sprintf((char *)msg, "*3\r\n:%lu\r\n:%lu\r\n:%d\r\n", get_connection_timestamp(), get_connection_elapsed(), readECG());
  word16 len = (word16)strlen((char *)msg);

  int ret;

  ret = mqttclient.send(msg, len);
  switch(ret){
    case MQTT_CODE_SUCCESS: msgcount++; break;
    default: last_error++; break;
  }

}
