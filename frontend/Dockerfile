### Stage 1: Build

FROM node:10-alpine as node
COPY package.json package-lock.json ./

# Storing node modules on a separate layer will prevent unnecessary npm
# installs at each build.
RUN npm ci && mkdir /ng-app && mv ./node_modules ./ng-app
WORKDIR /ng-app
COPY . .

# Build the angular app in production mode and store the artifacts in dist
# folder.
RUN npm run ng build -- --configuration=docker --prod

### Stage 2: Setup
FROM nginx:stable-alpine
RUN apk add --no-cache bash curl

ENV API_ADDR http://escape-backend:8080
# Hack around env replacement
ENV DOLLAR $

COPY --from=node /ng-app/dist/ /var/www
COPY ./frontend.tmpl /etc/nginx/conf.d/frontend.tmpl

CMD /bin/bash -c "envsubst < /etc/nginx/conf.d/frontend.tmpl > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"
