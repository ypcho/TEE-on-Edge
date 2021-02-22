mkfile_path := $(patsubst %/, %, $(dir $(abspath $(lastword $(MAKEFILE_LIST)))))

.DEFAULT_GOAL := all

.PHONY: clean-image clean-container
clean-image: clean-python-communicate-server clean-python-communicate-client clean-python-communicate
	rm -rf signkey

clean-python-communicate: clean-python-communicate-server clean-python-communicate-client do-clean-python-communicate

clean-python-communicate-server: do-clean-python-communicate-server

clean-python-communicate-client: do-clean-python-communicate-client

#generic rule
do-clean-%:
	-docker image rm -f $$(docker image ls -f reference=gsc-$(patsubst do-clean-%,%,$@) -q) 2>/dev/null
	-docker image rm -f $$(docker image ls -f reference=gsc-$(patsubst do-clean-%,%,$@)-unsigned -q) 2>/dev/null
	-docker image rm -f $$(docker image ls -f reference=$(patsubst do-clean-%,%,$@) -q) #2>/dev/null

#generic rule
clean-container:
	docker container rm -f $$(docker container ls -q -f ancestor=python-communicate)

.PHONY: run-simple
run-simple:
	python3 communicate/server.py & \
	python3 communicate/client.py

TESTBRIDGE_SUBNET := 172.31.0.0/16
TESTBRIDGE_SERVER := 172.31.0.254

.PHONY: init-docker finish-docker run-docker
init-docker:
	docker network create --driver=bridge --subnet=$(TESTBRIDGE_SUBNET) testbridge

finish-docker:
	docker network rm testbridge

run-docker:
	docker run --net=testbridge --ip=$(TESTBRIDGE_SERVER) python-communicate-server & \
	docker run --net=testbridge --env SERVERIP=$(TESTBRIDGE_SERVER) python-communicate-client

#generic rule
.PHONY: build-image-% build-gsc-unsigned-image-% build-gsc-image-%
getbasename = $(patsubst build-image-%,%,$@)
build-image-%: %.dockerfile
	docker build -t $(getbasename) -f $(getbasename).dockerfile .

getunsignedname = $(patsubst build-gsc-unsigned-image-%,%,$@)
build-gsc-unsigned-image-%: build-image-%
	cd gsc; ./gsc build $(GSCBUILDFLAGS) $(GSCFLAGS) $(getunsignedname) $(mkfile_path)/$(getunsignedname).manifest

getgscbasename = $(patsubst build-gsc-image-%,%,$@)
build-gsc-image-%: build-gsc-unsigned-image-%
	mkdir -p signkey; openssl genrsa -3 -out signkey/$(getgscbasename)-key.pem 3072
	cd gsc; ./gsc sign-image $(getgscbasename) $(mkfile_path)/signkey/$(getgscbasename)-key.pem $(GSCFLAGS)

#end of generic rule

GSCFLAGS := $(GSCFLAGS) -c $(mkfile_path)/config.yaml
GSCBUILDFLAGS := 

.PHONY: gsc-python-communicate
gsc-python-communicate: GSCBUILDFLAGS += --insecure-args
gsc-python-communicate: build-gsc-image-python-communicate

.PHONY: gsc-python-communicate-server
gsc-python-communicate-server: build-image-python-communicate build-gsc-image-python-communicate-server

.PHONY: gsc-python-communicate-client
gsc-python-communicate-client: build-image-python-communicate build-gsc-image-python-communicate-client

.PHONY: all
all: gsc-python-communicate gsc-python-communicate-server gsc-python-communicate-client
