
.PHONY: run-simple
run-simple:
	python3 communicate/server.py & python3 communicate/client.py

.PHONY: python-communicate
python-communicate: Dockerfile.base
	docker build -t $@ -f $< .
