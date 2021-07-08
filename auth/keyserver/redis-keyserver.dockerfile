FROM redis

WORKDIR /workdir

COPY redis-keyserver.conf redis-keyserver.acl sp_cert.crt sp_cert_key.pem ./

ENTRYPOINT []
CMD [ "redis-server" , "redis-keyserver.conf" ]
