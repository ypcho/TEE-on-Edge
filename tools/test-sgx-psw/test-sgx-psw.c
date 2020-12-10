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

void check_sgx(){
	const char * sgx_sdk_dir = getenv("SGX_SDK");
	if(sgx_sdk_dir == NULL){
		sgx_sdk_dir = "/home/gylee/infotracking/sgxsdk";
	}

	const char * sgx_urts_subdir = "/lib64/libsgx_urts.so";

	const size_t sgx_sdk_dir_len = strlen(sgx_sdk_dir);
	const size_t sgx_urts_subdir_len = strlen(sgx_urts_subdir);

	char * sgx_urts_dir = malloc(sgx_sdk_dir_len + sgx_urts_subdir_len + 1);
	strcpy(sgx_urts_dir, sgx_sdk_dir);
	strcpy(&sgx_urts_dir[sgx_sdk_dir_len], sgx_urts_subdir);
	printf("libsgx_urts.so directory %s\n", sgx_urts_dir);

	void * sgx_urts = dlopen(sgx_urts_dir, RTLD_NOW);
	free(sgx_urts_dir);

	DEBUG("libsgx_urts.so loaded at %p\n", sgx_urts);
	
	dlclose(sgx_urts);
}

int main(){
	printf("This is a program to test the behavior of Intel SGX\n");
	printf("including the correct functionality of SDK and PSW\n");

	check_sgx();
}
