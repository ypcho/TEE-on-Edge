
.DEFAULT_GOAL: run
.PHONY: run stop
run: intel-sgx-plugin
	kubectl apply -f intel-sgx-plugin.yaml

stop:
	kubectl delete -f intel-sgx-plugin.yaml

.PHONY: intel-sgx-plugin intel-sgx-initcontainer
intel-sgx-plugin:
	cd intel-device-plugins-for-kubernetes ; make $@

intel-sgx-initcontainer:
	cd intel-device-plugins-for-kubernetes ; make $@
