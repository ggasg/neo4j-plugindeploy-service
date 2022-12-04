#!/bin/bash
# https://til.simonwillison.net/cloudrun/using-build-args-with-cloud-run

if [[ -z "$SERVICE_ACCOUNT" ]]; then
    echo "Must provide SERVICE_ACCOUNT environment variable" 1>&2
    return 1
fi

#NAME="neo4j-gg-plugin-app"
#PROJECT=$(gcloud config get-value project)
IMAGE="gcr.io/$PROJECT/$NAME"

# Need YAML so we can set --build-arg
echo "
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', '$IMAGE', '.', '--build-arg', 'SERVICE_ACCOUNT=$SERVICE_ACCOUNT', '--build-arg', 'PROJECT_ID=$PROJECT']
- name: 'gcr.io/cloud-builders/docker'
  args: ['push', '$IMAGE']
" > ./cloudbuild.yml

gcloud builds submit --config ./cloudbuild.yml

rm ./cloudbuild.yml

gcloud run deploy $NAME --image $IMAGE --region=$REGION