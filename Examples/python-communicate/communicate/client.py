#!/usr/bin/env python3

import socket
import os
import time

if "SERVERIP" in os.environ:
	ip = os.environ["SERVERIP"]
else:
	ip = "127.0.0.1"

port = 11111
repeattime = 10 #[seconds]

while True:
	try:
		sock = socket.socket()
		sock.connect((ip, port))
	except:
		print(f"failed to connect at {ip}", flush=True)
		exit(-1)
	else:
		print(f"successfully connected at {ip}", flush=True)

	sock.send(b"Sample message from simple client")

	msg = sock.recv(0x100)
	print("client:", msg.decode(), flush=True)

	sock.close()
	time.sleep(repeattime)
