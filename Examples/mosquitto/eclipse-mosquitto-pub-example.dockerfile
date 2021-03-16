FROM eclipse-mosquitto-ubuntu

ENV XDG_CONFIG_HOME /configs

COPY eclipse-mosquitto-ubuntu-build/mosquitto_common.conf /configs/mosquitto_pub
CMD ["mosquitto_pub", "-t", "mqtt/test", "-m", "Hello MQTT"]
