
.DEFAULT_GOAL: run
.PHONY: run stop
run: intel-sgx-plugin
	kubectl apply -f intel-sgx-plugin.yaml

stop:
	kubectl delete -f intel-sgx-plugin.yaml

.PHONY: set-docker-env
set-docker-env:
	eval $(minikube docker-env)

.PHONY: intel-sgx-plugin intel-sgx-initcontainer
intel-sgx-plugin: set-docker-env
	cd intel-device-plugins-for-kubernetes ; make $@

intel-sgx-initcontainer: set-docker-env
	cd intel-device-plugins-for-kubernetes ; make $@
