#!/usr/bin/env python3

import socket

sock = socket.socket()
sock.bind(("0.0.0.0", 11111))

sock.listen(1)

conn, addr = sock.accept()

conn.send(b"Response from simple server")

data = conn.recv(0x100)
print("server:", data.decode())

conn.close()
