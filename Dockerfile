FROM redis:5.0.7-alpine AS redis-instance

EXPOSE 6379

VOLUME /.redis:/data

CMD ["redis-server", "--appendonly yes", "--requirepass 4dnzP2gPYPVzWweTqyNIdEK7EIOhofMCwcFHa7kvUYs="]