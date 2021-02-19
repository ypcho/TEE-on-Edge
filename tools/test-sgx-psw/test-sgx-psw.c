// This source is under development

#define DEBUG

#ifdef DEBUG
	#undef DEBUG
	#define DEBUG(fmt, ...) (printf(fmt, ##__VA_ARGS__))
#else
	#define DEBUG
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dlfcn.h>

//based on the following reference from intel
//reference: https://software.intel.com/content/www/us/en/develop/articles/properly-detecting-intel-software-guard-extensions-in-your-applications.html

void * getlibsdk(const char * lib_subdir){
	const char * sgx_sdk_dir = getenv("SGX_SDK");
	if(sgx_sdk_dir == NULL || strlen(sgx_sdk_dir) == 0){
		printf("SGX_SDK environment variable is not set.\n");
		printf("please set the environment variable and try again.\n");
		return NULL;
	}

	const size_t sgx_sdk_dir_len = strlen(sgx_sdk_dir);
	const size_t lib_subdir_len = strlen(lib_subdir);

	char * lib_dir = malloc(sgx_sdk_dir_len + lib_subdir_len + 1);
	strcpy(lib_dir, sgx_sdk_dir);
	strcpy(&lib_dir[sgx_sdk_dir_len], lib_subdir);
	DEBUG("lib subpath %s translated to full path %s\n", lib_subdir, lib_dir);

	void * lib = dlopen(lib_dir, RTLD_NOW); // TO BE MODIFIED: RTLD_LAZY
	
	free(lib_dir);
	
	return lib;
}

static void * liburts;

void getlibpsw(){
	//libsgx_urts.so

	liburts = dlopen("/usr/lib/libsgx_urts.so", RTLD_NOW);
	if(liburts == NULL){
		liburts = dlopen("/usr/lib64/libsgx_urts.so", RTLD_NOW);
	}
	if(liburts == NULL){
		printf("unable to find libsgx_urts.so\n");
		printf("Did you install SGX PSW?\n");
	}
}
	

void check_sgx(){
	void * sgx_urts = getlibsdk("/lib64/libsgx_urts.so");
	if(sgx_urts == NULL)
		return;

	DEBUG("libsgx_urts.so loaded at %p\n", sgx_urts);
	
	dlclose(sgx_urts);
}

int main(){
	printf("This is a program to test the behavior of Intel SGX\n");
	printf("including the correct functionality of SDK and PSW\n");

	check_sgx();
}
