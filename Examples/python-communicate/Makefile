
.PHONY: clean
clean:
	-docker image rm -f python-communicate
	-docker image rm $$(docker images -f dangling=true -q)

.PHONY: run-simple
run-simple:
	python3 communicate/server.py & \
	python3 communicate/client.py

.PHONY: run-docker
run-docker:
	docker run --net=host python-communicate python3 /communicate/server.py & \
	docker run --net=host python-communicate python3 /communicate/client.py

.PHONY: python-communicate
python-communicate: Dockerfile.base
	docker build -t $@ -f $< .
