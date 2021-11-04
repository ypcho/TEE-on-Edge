FROM node

WORKDIR /workdir

RUN npm install redis redis-parser jsrsasign
COPY auth.js command.js redis-format.js ias.js \
	config.json \
	sp_cert_ca.crt sp_cert.crt sp_cert_key.pem Intel_SGX_Attestation_RootCA.pem \
	./

ENTRYPOINT [ "node" ]
CMD [ "auth.js" ]
