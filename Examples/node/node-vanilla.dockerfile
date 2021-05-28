FROM node:bionic

COPY helloworld.js /

ENTRYPOINT [ "node" ]
CMD [ "helloworld.js" ]
