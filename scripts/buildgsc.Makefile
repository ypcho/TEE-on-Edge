
#build rule
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

#clean rule
.PHONY: clean-image-%
getcleanimagename = $(patsubst clean-image-%,%,$@)
clean-image-%:
	-docker image rm -f $$(docker image ls -f reference=gsc-$(getcleanimagename) -q) 2>/dev/null
	-docker image rm -f $$(docker image ls -f reference=gsc-$(getcleanimagename)-unsigned -q) 2>/dev/null
	-docker image rm -f $$(docker image ls -f reference=$(getcleanimagename) -q) #2>/dev/null
