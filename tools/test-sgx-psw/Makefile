
LDFLAGS += -ldl

default: test-sgx-psw

test-sgx-psw: test-sgx-psw.c
	$(CC) $(CPPFLAGS) $(CFLAGS) -o $@ $^ $(LDFLAGS)

clean:
	rm test-sgx-psw
