mkfile_path := $(patsubst %/, %, $(dir $(abspath $(lastword $(MAKEFILE_LIST)))))

GSCFLAGS :=$(GSCFLAGS) -c $(mkfile_path)/config.yaml
GSCBUILDFLAGS := 

signkey := $(abspath ../sp_signer_key.pem)

include $(mkfile_path)/../../scripts/buildgsc.Makefile

.DEFAULT_GOAL := all

.PHONY: clean \
	clean-image clean-container \
	clean-redis-%
clean:
	rm -f docker-entrypoint.sh redis-debian.dockerfile redis-ubuntu.dockerfile

clean-image: clean-redis-keyserver

getcleanbaseimage = $(patsubst clean-%,%,$@)
clean-redis-%: clean-image-redis-%
	docker image rm -f $(getcleanbaseimage)

clean-container:
	docker container rm -f $$(docker container ls -q -f ancestor=redis)

.PHONY: base-image-%
getbasename = $(patsubst base-image-%,%,$@)
base-image-redis-keyserver: redis-keyserver.dockerfile
	docker build -t $(getbasename) -f $(getbasename).dockerfile .

.PHONY: gsc-redis-keyserver
gsc-redis-keyserver: base-image-redis-keyserver build-gsc-image-redis-keyserver

.PHONY: all
all: gsc-redis-keyserver
