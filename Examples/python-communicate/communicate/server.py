#!/usr/bin/env python3

import socket

iplisten = "0.0.0.0"
port = 11111

sock = socket.socket()
sock.bind((iplisten, port))

sock.listen(1)

print(f"server listening to {iplisten}:{port}", flush=True)

while True:
	conn, addr = sock.accept()

	conn.send(b"Response from simple server")

	data = conn.recv(0x100)
	print("server:", data.decode(), flush=True)

	conn.close()
