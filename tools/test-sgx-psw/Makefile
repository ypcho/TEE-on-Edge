
LDFLAGS += -ldl


default: test-sgx-psw

test-sgx-psw: test-sgx-psw.c
	$(CC) $(CPPFLAGS) $(CFLAGS) -o $@ $^ $(LDFLAGS)

clean:
	rm -f test-sgx-psw
