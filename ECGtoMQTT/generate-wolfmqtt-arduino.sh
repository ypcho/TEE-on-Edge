#!/bin/sh

WOLFMQTT_URL="https://github.com/wolfSSL/wolfMQTT.git"
WOLFMQTT_DIR=wolfMQTT-repo
WOLFMQTT_ARDUINO_DIR=wolfMQTT
WOLFMQTT_ARDUINO_ZIP=wolfMQTT.zip
WOLFMQTT_PATCH=wolfMQTT.patch

set -e

if [ -n "$1" ]; then
	WOLFMQTT_ARDUINO_OPTIONS=$(realpath $1)
fi

rm -rf ${WOLFMQTT_DIR}
rm -rf ${WOLFMQTT_ARDUINO_DIR}
rm -f ${WOLFMQTT_ARDUINO_ZIP}

mkdir ${WOLFMQTT_ARDUINO_DIR}

git clone ${WOLFMQTT_URL} ${WOLFMQTT_DIR}

cd ${WOLFMQTT_DIR}

cd wolfmqtt
if [ -z "${WOLFMQTT_ARDUINO_OPTIONS}" ]; then
	WOLFMQTT_ARDUINO_OPTIONS=$(realpath options.h.in)
fi
cp ${WOLFMQTT_ARDUINO_OPTIONS} options.h
cd ..

cd IDE/ARDUINO
./wolfmqtt-arduino.sh
mv wolfMQTT ../../../${WOLFMQTT_ARDUINO_DIR}/src
cd ../../

cd ../

cd ${WOLFMQTT_ARDUINO_DIR}
patch -p1 <../${WOLFMQTT_PATCH}
cd ..

rm -rf ${WOLFMQTT_DIR}

echo "
name=wolfMQTT
version=1.9.0
author=wolfSSL
maintainer=wolfSSL <support@wolfssl.com>
sentence=wolfMQTT Implementation by wolfSSL
paragraph=This is an implementation of the MQTT Client written in C for embedded use, which supports SSL/TLS via the wolfSSL library. This library was built from the ground up to be multi-platform, space conscious and extensible. Integrates with wolfSSL to provide TLS support.
category=Data Processing
url=https://github.com/wolfSSL/wolfMQTT
architectures=*
includes=wolfMQTT.h
" > ${WOLFMQTT_ARDUINO_DIR}/library.properties

#zip -r ${WOLFMQTT_ARDUINO_ZIP} ${WOLFMQTT_ARDUINO_DIR}
