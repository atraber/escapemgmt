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
RUN npm run ng build -- --env=docker --prod

### Stage 2: Setup
FROM nginx:stable-alpine
RUN apk add --no-cache curl

COPY --from=node /ng-app/dist/ /var/www
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
