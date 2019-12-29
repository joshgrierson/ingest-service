FROM redis:5.0.7-alpine AS redis-instance

EXPOSE 6379

CMD ["redis-server", "--appendonly yes"]