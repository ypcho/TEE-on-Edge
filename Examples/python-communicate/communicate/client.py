#!/usr/bin/env python3

import socket

sock = socket.socket()
sock.connect(("127.0.0.1", 11111))

sock.send(b"Sample message from simple client")

msg = sock.recv(0x100)
print("client:", msg.decode())

sock.close()
