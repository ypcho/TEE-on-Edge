FROM redis

ENTRYPOINT []
CMD [ "redis-server", "--save", "", "--protected-mode", "no" ]
