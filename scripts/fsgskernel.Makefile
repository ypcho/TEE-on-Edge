## provide FETCH_KERNEL parameter as the ubuntu kernel version (ex) 5.4.80-generic
## this makefile will recognize the directory of linux source as linux-$(FETCH_KERNEL_VER) defined as SRC_DIR

OS_DESCRIPTION := $(shell lsb_release -si)
OS_CODENAME := $(shell lsb_release -sc)

FETCH_KERNEL ?= $(shell uname -r)
FETCH_KERNEL_VER ?= $(firstword $(subst -, , $(FETCH_KERNEL)))
SRC_DIR := linux-$(FETCH_KERNEL_VER)

LINUX_PKG := linux-image-$(FETCH_KERNEL)

all: fsgs_kernel

.PHONY: fetch_kernel
fetch_kernel:
	apt source $(LINUX_PKG)

.PHONY: fsgs_kernel
fsgs_kernel: graphene-sgx-driver
	cd $(SRC_DIR); \
	git init; \
	git add *; \
	git commit -m "$(OS_DESCRIPTION) $(OS_CODENAME) vanilla kernel source $(FETCH_KERNEL)"
	\
	cd $(SRC_DIR); git am ../graphene-sgx-driver/fsgsbase_patches/*.patch
	\
	cp /boot/config-$(FETCH_KERNEL) $(SRC_DIR)/.config
	cd $(SRC_DIR); yes '' | make oldconfig ; make --jobs=$(shell getconf _NPROCESSORS_ONLN) deb-pkg LOCALVERSION=-custom

graphene-sgx-driver:
	git clone https://github.com/oscarlab/graphene-sgx-driver graphene-sgx-driver/

.PHONY: clean
clean:
	rm -rf linux*
	rm -rf graphene-sgx-driver
