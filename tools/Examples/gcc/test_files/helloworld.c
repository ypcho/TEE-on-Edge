#include <stdio.h>

int main(int argc, char* argv[]) {
  int a=3;

  for(i=0;i<10;i++){
    printf("Hello world (%s): %d!\n", argv[0],a);
  }
  return 0;
}
