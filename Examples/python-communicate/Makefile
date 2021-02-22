mkfile_path := $(patsubst %/, %, $(dir $(abspath $(lastword $(MAKEFILE_LIST)))))

.PHONY: clean-image clean-container
clean-image:
	docker image rm -f $$(docker image ls -f dangling=true -q) \
				$$(docker image ls -f reference=python-communicate-server -q) \
				$$(docker image ls -f reference=python-communicate-client -q) \
				$$(docker image ls -f reference=python-communicate -q)
	rm -rf signkey

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

.PHONY: all-image
all-image: python-communicate python-communicate-server python-communicate-client

.PHONY: python-communicate
python-communicate: Dockerfile.base
	docker build -t $@ -f $< .

.PHONY: python-communicate-server
python-communicate-server: Dockerfile.server python-communicate
	docker build -t $@ -f $< .

.PHONY: python-communicate-client
python-communicate-client: Dockerfile.client python-communicate
	docker build -t $@ -f $< .

GSCFLAGS := -c $(mkfile_path)/config.yaml

.PHONY: gsc-python-communicate-unsigned
gsc-python-communicate-unsigned: python-communicate
	cd gsc; ./gsc build --insecure-args $< $(mkfile_path)/python-communicate.manifest $(GSCFLAGS)

.PHONY: gsc-python-communicate
gsc-python-communicate: gsc-python-communicate-unsigned
	openssl genrsa -3 -out signkey/$@-key.pem 3072
	cd gsc; ./gsc sign-image python-communicate $(mkfile_path)/signkey/$@-key.pem $(GSCFLAGS)
