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

char * getlibpath(const char * lib_subdir){
	const char * sgx_sdk_dir = getenv("SGX_SDK");
	if(sgx_sdk_dir == NULL){
		sgx_sdk_dir = "/home/gylee/infotracking/sgxsdk";
	}

	const size_t sgx_sdk_dir_len = strlen(sgx_sdk_dir);
	const size_t lib_subdir_len = strlen(lib_subdir);

	char * lib_dir = malloc(sgx_sdk_dir_len + lib_subdir_len + 1);
	strcpy(lib_dir, sgx_sdk_dir);
	strcpy(&lib_dir[sgx_sdk_dir_len], lib_subdir);

	return lib_dir;
}
	

void check_sgx(){

	char * sgx_urts_dir = getlibpath("/lib64/libsgx_urts.so");
	void * sgx_urts = dlopen(sgx_urts_dir, RTLD_NOW);

	DEBUG("libsgx_urts.so loaded at %p\n", sgx_urts);
	printf("libsgx_urts.so directory %s\n", sgx_urts_dir);
	free(sgx_urts_dir);
	
	dlclose(sgx_urts);
}

int main(){
	printf("This is a program to test the behavior of Intel SGX\n");
	printf("including the correct functionality of SDK and PSW\n");

	check_sgx();
}
