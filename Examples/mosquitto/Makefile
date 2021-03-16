mkfile_path := $(patsubst %/, %, $(dir $(abspath $(lastword $(MAKEFILE_LIST)))))

GSCFLAGS := $(GSCFLAGS) -c $(mkfile_path)/config.yaml
GSCBUILDFLAGS := 

include $(mkfile_path)/../../scripts/buildgsc.Makefile

.DEFAULT_GOAL := all

.PHONY: clean-image clean-container \
	clean-python-communicate \
	clean-python-communicate-server \
	clean-python-communicate-client
clean-image: clean-eclipse-mosquitto-broker-example clean-eclipse-mosquitto-sub-example clean-eclipse-mosquitto-pub-example
	rm -rf signkey

getcleanbaseimage = $(patsubst clean-%,%,$@)
clean-eclipse-mosquitto-%: clean-image-eclipse-mosquitto-%
	docker image rm -f $(getcleanbaseimage)

clean-container:
	docker container rm -f $$(docker container ls -q -f ancestor=eclipse-mosquitto-ubuntu)

TESTBRIDGE_SUBNET := 10.98.0.0/16
TESTBRIDGE_SERVER := 10.98.0.254

.PHONY: init-docker finish-docker run-docker run-gsc-docker
init-docker:
	docker network create --driver=bridge --subnet=$(TESTBRIDGE_SUBNET) testbridge

finish-docker:
	docker network rm testbridge

BASE_IMAGE := eclipse-mosquitto-ubuntu
RUNDOCKERFLAGS :=
run-docker-server:
	docker run $(RUNDOCKERFLAGS) --net=testbridge --ip=$(TESTBRIDGE_SERVER) $(BASE_IMAGE) mosquitto -c /mosquitto-no-auth.conf &
run-docker-sub:
	docker run $(RUNDOCKERFLAGS) --net=testbridge $(BASE_IMAGE) sh -c "mosquitto_sub -t mqtt/test -h $(TESTBRIDGE_SERVER)" &
run-docker-pub:
	docker run $(RUNDOCKERFLAGS) --net=testbridge $(BASE_IMAGE) sh -c "mosquitto_pub -t mqtt/test -m 'Hello MQTT' -h $(TESTBRIDGE_SERVER)" &

run-gsc-docker-server: RUNDOCKERFLAGS += --device=/dev/sgx --volume=/var/run/aesmd/aesm.socket:/var/run/aesmd/aesm.socket
run-gsc-docker-server:
	docker run $(RUNDOCKERFLAGS) --net=testbridge --ip=$(TESTBRIDGE_SERVER) gsc-eclipse-mosquitto-broker-example &
run-gsc-docker-sub: RUNDOCKERFLAGS += --device=/dev/sgx --volume=/var/run/aesmd/aesm.socket:/var/run/aesmd/aesm.socket
run-gsc-docker-sub:
	docker run $(RUNDOCKERFLAGS) --net=testbridge gsc-eclipse-mosquitto-sub-example &
run-gsc-docker-pub: RUNDOCKERFLAGS += --device=/dev/sgx --volume=/var/run/aesmd/aesm.socket:/var/run/aesmd/aesm.socket
run-gsc-docker-pub:
	docker run $(RUNDOCKERFLAGS) --net=testbridge gsc-eclipse-mosquitto-pub-example &

.PHONY: base-image-%
getbasename = $(patsubst base-image-%,%,$@)
base-image-%: %.dockerfile
	docker build -t $(getbasename) -f $(getbasename).dockerfile .

.PHONY: gsc-eclipse-mosquitto-%
gsc-eclipse-mosquitto-%: base-image-eclipse-mosquitto-ubuntu base-image-eclipse-mosquitto-% build-gsc-image-eclipse-mosquitto-%
	

.PHONY: all
all: gsc-eclipse-mosquitto-broker-example gsc-eclipse-mosquitto-pub-example gsc-eclipse-mosquitto-sub-example

