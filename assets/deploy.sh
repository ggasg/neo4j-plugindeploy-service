#!/bin/bash
# https://til.simonwillison.net/cloudrun/using-build-args-with-cloud-run

IMAGE="gcr.io/$PROJECT/$NAME"

if [[ $1 -eq 0 ]]; then
    gcloud run deploy $NAME --image $IMAGE --region=$REGION
fi

if [[ $1 -eq 1 ]]; then
  # Need YAML so we can set --build-arg
  echo "
  steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', '$IMAGE', '.', '--build-arg', 'SERVICE_ACCOUNT=$SERVICE_ACCOUNT', '--build-arg', 'PROJECT_ID=$PROJECT']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '$IMAGE']
  " > ./assets/cloudbuild.yml

  gcloud builds submit --config ./assets/cloudbuild.yml

  rm ./assets/cloudbuild.yml

  gcloud run deploy $NAME --image $IMAGE --region=$REGION
fi
