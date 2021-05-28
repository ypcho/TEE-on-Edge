mkfile_path := $(patsubst %/, %, $(dir $(abspath $(lastword $(MAKEFILE_LIST)))))

GSCFLAGS :=$(GSCFLAGS) -c $(mkfile_path)/config.yaml
GSCBUILDFLAGS := 

include $(mkfile_path)/../../scripts/buildgsc.Makefile

.DEFAULT_GOAL := all

.PHONY: base-image-node-bionic base-image-node-vanilla

NODE_MAJORVERSION := 16
GITHUBRAW_URL := https://raw.githubusercontent.com/nodejs/docker-node/main/$(NODE_MAJORVERSION)

docker-entrypoint.sh:
	wget $(GITHUBRAW_URL)/buster/docker-entrypoint.sh -O $@
	chmod a+x $@

node-buster.dockerfile:
	wget $(GITHUBRAW_URL)/buster/Dockerfile -O $@

node-bionic.dockerfile: node-buster.dockerfile
	sed -r -e 's/buster/bionic/' $< > $@

base-image-node-bionic: node-bionic.dockerfile docker-entrypoint.sh
	docker build -t node:bionic -f $< .

base-image-node-vanilla: node-vanilla.dockerfile base-image-node-bionic
	docker build -t node-vanilla -f node-vanilla.dockerfile .

.PHONY: gsc-node-vanilla
gsc-node-vanilla: base-image-node-vanilla build-gsc-image-node-vanilla

.PHONY: all
all: gsc-node-vanilla
