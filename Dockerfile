# Install
FROM node:lts-slim as install-stage
WORKDIR /app
COPY package.json /app/
RUN npm install

# Build
FROM node:lts-slim as build-stage
WORKDIR /app
COPY --from=install-stage /app /app
COPY src /app/src
COPY tsconfig.json /app/tsconfig.json
RUN npm run build:main

# Bundle
FROM node:lts-slim
LABEL "maintainer"="Travelperk <engineering@travelperk.com>"
LABEL "com.github.actions.name"="Label requires reviews"
LABEL "com.github.actions.description"="Require a number of reviews for a certain label"
COPY --from=build-stage /app /app
ENTRYPOINT ["node", "/app/build/entrypoint.js"]
