mkfile_path := $(patsubst %/, %, $(dir $(abspath $(lastword $(MAKEFILE_LIST)))))

GSCFLAGS :=$(GSCFLAGS) -c $(mkfile_path)/config.yaml
GSCBUILDFLAGS := 

include $(mkfile_path)/../../scripts/buildgsc.Makefile

.DEFAULT_GOAL := all

.PHONY: clean \
	clean-image clean-container \
	clean-redis-%
clean:
	rm -f docker-entrypoint.sh redis-debian.dockerfile redis-ubuntu.dockerfile

clean-image: clean-redis-server-example
	rm -rf signkey

getcleanbaseimage = $(patsubst clean-%,%,$@)
clean-redis-%: clean-image-redis-%
	docker image rm -f $(getcleanbaseimage)

clean-container:
	docker container rm -f $$(docker container ls -q -f ancestor=redis)

.PHONY: base-image-%
getbasename = $(patsubst base-image-%,%,$@)
base-image-%: %.dockerfile
	docker build -t $(getbasename) -f $(getbasename).dockerfile .

GITHUBRAW_URL := https://raw.githubusercontent.com/docker-library/redis/master

docker-entrypoint.sh:
	wget $(GITHUBRAW_URL)/6.2/docker-entrypoint.sh -O $@
	chmod a+x $@

redis-debian.dockerfile:
	wget $(GITHUBRAW_URL)/6.2/Dockerfile -O $@

redis-ubuntu.dockerfile: redis-debian.dockerfile
	sed -r -e 's/^FROM debian:.*/FROM ubuntu:18.04/' redis-debian.dockerfile > redis-ubuntu.dockerfile
	
base-image-redis-ubuntu: docker-entrypoint.sh redis-ubuntu.dockerfile
	docker build -t redis-ubuntu -f redis-ubuntu.dockerfile .

base-image-redis-server-example: redis-server-example.dockerfile #base-image-redis-ubuntu
	docker build -t $(getbasename) -f $(getbasename).dockerfile .

.PHONY: gsc-redis-server-example
gsc-redis-server-example: base-image-redis-server-example build-gsc-image-redis-server-example

.PHONY: all
all: gsc-redis-server-example
