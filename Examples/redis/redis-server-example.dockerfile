FROM redis

CMD [ "redis-server", "--save", "", "--protected-mode", "no" ]
