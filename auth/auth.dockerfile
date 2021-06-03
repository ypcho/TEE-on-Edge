FROM node:bionic

WORKDIR /workdir

RUN npm install express
COPY auth.js key.pem cert.pem ./

ENTRYPOINT [ "node" ]
CMD [ "auth.js" ]
