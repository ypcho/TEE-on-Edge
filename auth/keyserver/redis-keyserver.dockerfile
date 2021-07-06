FROM redis

WORKDIR /workdir

COPY redis-keyserver.conf redis-keyserver.acl sp_cert_rsa.crt sp_rsa_priv.pem ./

ENTRYPOINT []
CMD [ "redis-server" , "redis-keyserver.conf" ]
