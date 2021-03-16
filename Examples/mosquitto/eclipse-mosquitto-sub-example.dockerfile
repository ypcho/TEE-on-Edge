FROM eclipse-mosquitto-ubuntu

ENV XDG_CONFIG_HOME /configs

COPY eclipse-mosquitto-ubuntu-build/mosquitto_common.conf /configs/mosquitto_sub
CMD [ "mosquitto_sub", "-t", "mqtt/test" ]
