FROM eclipse-mosquitto-ubuntu

CMD [ "mosquitto", "-c", "/mosquitto-no-auth.conf" ]
