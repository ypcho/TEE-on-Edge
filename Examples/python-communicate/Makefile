mkfile_path := $(patsubst %/, %, $(dir $(abspath $(lastword $(MAKEFILE_LIST)))))

GSCFLAGS := $(GSCFLAGS) -c $(mkfile_path)/config.yaml
GSCBUILDFLAGS := 

include $(mkfile_path)/../../scripts/buildgsc.Makefile

.DEFAULT_GOAL := all

.PHONY: clean-image clean-container \
	clean-python-communicate \
	clean-python-communicate-server \
	clean-python-communicate-client
clean-image: clean-python-communicate-server clean-python-communicate-client clean-python-communicate
	rm -rf signkey

getcleanbaseimage = $(patsubst clean-%,%,$@)
clean-python-communicate: clean-python-communicate-server clean-python-communicate-client clean-image-python-communicate
	docker image rm -f $(getcleanbaseimage)

clean-python-communicate-server: clean-image-python-communicate-server
	docker image rm -f $(getcleanbaseimage)

clean-python-communicate-client: clean-image-python-communicate-client
	docker image rm -f $(getcleanbaseimage)

clean-container:
	docker container rm -f $$(docker container ls -q -f ancestor=python-communicate)

.PHONY: run-simple
run-simple:
	python3 communicate/server.py & \
	python3 communicate/client.py

TESTBRIDGE_SUBNET := 10.98.0.0/16
TESTBRIDGE_SERVER := 10.98.0.254

.PHONY: init-docker finish-docker run-docker run-gsc-docker
init-docker:
	docker network create --driver=bridge --subnet=$(TESTBRIDGE_SUBNET) testbridge

finish-docker:
	docker network rm testbridge

RUNDOCKERFLAGS :=
run-docker:
	docker run $(RUNDOCKERFLAGS) --net=testbridge --ip=$(TESTBRIDGE_SERVER) python-communicate-server & \
	docker run $(RUNDOCKERFLAGS) --net=testbridge --env SERVERIP=$(TESTBRIDGE_SERVER) python-communicate-client

run-gsc-docker: RUNDOCKERFLAGS += --device=/dev/sgx --volume=/var/run/aesmd/aesm.socket:/var/run/aesmd/aesm.socket
run-gsc-docker:
	docker run $(RUNDOCKERFLAGS) --net=testbridge --ip=$(TESTBRIDGE_SERVER) gsc-python-communicate-server & \
	docker run $(RUNDOCKERFLAGS) --net=testbridge --env SERVERIP=$(TESTBRIDGE_SERVER) gsc-python-communicate-client

.PHONY: base-image-%
getbasename = $(patsubst base-image-%,%,$@)
base-image-%: %.dockerfile
	docker build -t $(getbasename) -f $(getbasename).dockerfile .

.PHONY: gsc-python-communicate
gsc-python-communicate: GSCBUILDFLAGS += --insecure-args
gsc-python-communicate: base-image-python-communicate build-gsc-image-python-communicate

.PHONY: gsc-python-communicate-server
gsc-python-communicate-server: base-image-python-communicate build-gsc-image-python-communicate-server

.PHONY: gsc-python-communicate-client
gsc-python-communicate-client: base-image-python-communicate build-gsc-image-python-communicate-client

.PHONY: all
all: gsc-python-communicate gsc-python-communicate-server gsc-python-communicate-client
