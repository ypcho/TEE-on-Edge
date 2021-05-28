gsc_path := $(abspath $(patsubst %/, %, $(dir $(abspath $(lastword $(MAKEFILE_LIST)))))/../graphene/Tools/gsc)

#build rule
.PHONY: build-gsc-unsigned-image-% build-gsc-image-%
getunsignedname = $(patsubst build-gsc-unsigned-image-%,%,$@)
build-gsc-unsigned-image-%: %.manifest
	cd $(gsc_path); ./gsc build $(GSCBUILDFLAGS) $(GSCFLAGS) $(getunsignedname) $(mkfile_path)/$<

getgscbasename = $(patsubst build-gsc-image-%,%,$@)
build-gsc-image-%: build-gsc-unsigned-image-%
	mkdir -p signkey; openssl genrsa -3 -out signkey/$(getgscbasename)-key.pem 3072
	cd $(gsc_path); ./gsc sign-image $(getgscbasename) $(mkfile_path)/signkey/$(getgscbasename)-key.pem $(GSCFLAGS)

#clean rule
.PHONY: clean-image-%
getcleanimagename = $(patsubst clean-image-%,%,$@)
clean-image-%:
	-docker image rm -f $$(docker image ls -f reference=gsc-$(getcleanimagename) -q) 2>/dev/null
	-docker image rm -f $$(docker image ls -f reference=gsc-$(getcleanimagename)-unsigned -q) 2>/dev/null
