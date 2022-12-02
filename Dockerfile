# Use the official lightweight Node.js 14 image.
# https://hub.docker.com/_/node
FROM node:16-bullseye-slim

ARG SERVICE_ACCOUNT=
ENV SERVICE_ACCOUNT ${SERVICE_ACCOUNT}
ARG PROJECT_ID=
ENV PROJECT_ID ${PROJECT_ID}

# Get prerequisites and the cloud CLI
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y python3
RUN apt-get install -y openssh-server
RUN service ssh start
RUN curl -sSL https://sdk.cloud.google.com | bash

ENV PATH $PATH:/root/google-cloud-sdk/bin

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
RUN npm install --production

# Copy local code to the container image.
COPY . ./

# Set up the gcloud CLI
RUN gcloud auth activate-service-account ${SERVICE_ACCOUNT} --key-file=./assets/key.json
RUN gcloud config set account ${SERVICE_ACCOUNT}
RUN gcloud config set project ${PROJECT_ID}

EXPOSE 3000

# Run the web service on container startup.
CMD [ "npm", "start" ]