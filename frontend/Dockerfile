FROM nginx:stable-alpine
RUN apk add --no-cache curl

COPY ./dist/ /var/www
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
