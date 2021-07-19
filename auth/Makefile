mkfile_path := $(patsubst %/, %, $(dir $(abspath $(lastword $(MAKEFILE_LIST)))))

GSCFLAGS :=$(GSCFLAGS) -c $(mkfile_path)/config.yaml
GSCBUILDFLAGS := 

signkey := $(abspath sp_signer_key.pem)

include $(mkfile_path)/../scripts/buildgsc.Makefile

.DEFAULT_GOAL := all

.PHONY: clean \
	clean-image clean-container \
	clean-auth
clean:
	rm -f docker-entrypoint.sh redis-debian.dockerfile redis-ubuntu.dockerfile

clean-image: clean-auth

getcleanbaseimage = $(patsubst clean-%,%,$@)
clean-auth: clean-image-auth
	docker image rm -f $(getcleanbaseimage)

clean-container:
	docker container rm -f $$(docker container ls -q -f ancestor=redis)

.PHONY: base-image-%
getbasename = $(patsubst base-image-%,%,$@)
base-image-auth: check auth.dockerfile
	docker build -t $(getbasename) -f $(getbasename).dockerfile .

.PHONY: gsc-auth
gsc-auth: base-image-auth build-gsc-image-auth

.PHONY: all
all: gsc-auth

.PHONY: check
check: sp_cert.crt sp_cert_key.pem config.json Intel_SGX_Attestation_RootCA.pem
	@echo OK
