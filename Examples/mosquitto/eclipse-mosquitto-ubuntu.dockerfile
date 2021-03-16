FROM ubuntu:18.04

LABEL description="Eclipse Mosquitto MQTT Broker in Ubuntu"

RUN env DEBIAN_FRONTEND=noninteractive apt-get update \
	&& env DEBIAN_FRONTEND=noninteractive apt-get install -y \
		software-properties-common

RUN env DEBIAN_FRONTEND=noninteractive apt-add-repository -y ppa:mosquitto-dev/mosquitto-ppa \
	&& env DEBIAN_FRONTEND=noninteractive apt purge -y software-properties-common \
	&& env DEBIAN_FRONTEND=noninteractive apt autoremove -y

RUN env DEBIAN_FRONTEND=noninteractive apt-get install -y \
		mosquitto \
		mosquitto-clients

# Set up the entry point script and default command
COPY eclipse-mosquitto-ubuntu-build/mosquitto-no-auth.conf /
EXPOSE 1883
CMD ["/usr/sbin/mosquitto"]
