FROM redis

WORKDIR /workdir

COPY redis-keyserver.conf redis-keyserver.acl sp_cert.crt sp_cert_key.pem /workdir/
RUN mkdir -p /workdir/database

ENTRYPOINT []
CMD [ "redis-server" , "/workdir/redis-keyserver.conf" ]
