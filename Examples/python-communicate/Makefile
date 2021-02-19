
.PHONY: clean
clean:
	-docker image rm -f python-communicate
	-docker image rm $$(docker images -f dangling=true -q)

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
	docker run --net=testbridge --ip=$(TESTBRIDGE_SERVER) python-communicate python3 /communicate/server.py & \
	docker run --net=testbridge --env SERVERIP=$(TESTBRIDGE_SERVER) python-communicate python3 /communicate/client.py

.PHONY: python-communicate
python-communicate: Dockerfile.base
	docker build -t $@ -f $< .
