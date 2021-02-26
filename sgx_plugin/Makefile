


.PHONY: set-docker-env
set-docker-env:
	eval $(minikube docker-env)

.PHONY: intel-sgx-plugin intel-sgx-initcontainer
intel-sgx-plugin: set-docker-env
	cd intel-device-plugins-for-kubernetes ; make $@

intel-sgx-initcontainer: set-docker-env
	cd intel-device-plugins-for-kubernetes ; make $@
