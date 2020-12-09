#ifdef DEBUG
	#undef DEBUG
	#define DEBUG(fmt, ...) (printf(fmt, ##__VA_ARGS__))
#else
	#define DEBUG
#endif

#include <stdio.h>
#include <dlfcn.h>

//based on the following reference from intel
//reference: https://software.intel.com/content/www/us/en/develop/articles/properly-detecting-intel-software-guard-extensions-in-your-applications.html

void check_sgx(){
	void * sgx_urts = dlopen("/home/gylee/infotracking/sgxsdk/lib64/libsgx_urts.so", RTLD_NOW);

	DEBUG("libsgx_urts.so loaded at %p\n", sgx_urts);

	dlclose(sgx_urts);
}

int main(){
	printf("This is a program to test the behavior of Intel SGX\n");
	printf("including the correct functionality of SDK and PSW\n");

	check_sgx();
}
