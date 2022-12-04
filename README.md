# neo4j-plugindeploy-service
Nodejs Web App that receives a Storage Event payload with information about the Jar artifact that was uploaded to GCS (and relayed by this Function), and then proceeds to download the .jar from GCS and deploy it to the Neo4j DB Server. Finally, the Neo4j DB Service is restarted. The entire deployment pipeline is described in this article.
## Prerequisites
For this Service to operate, a Compute instance must be created and configured to run with a specific Service Account. Then, Neo4j must be installed and configured to run as a Service as described here.  Additionally, this Service Account must have privileges to perform O/S login on the compute instance and create Authentication Tokens as stated in the aforementioned article.
A local Docker installation is also required.
## Running the Service Locally
After cloning the repo, edit assets/appConfig.json with the following:
```json
{
    "projectName": "<PROJECT_ID>",
    "dbServerName": "<NEO4J_SERVER_NAME>",
    "computeZone": "<ZONE_NAME>",
    "destPluginFolder": "/var/lib/neo4j/plugins",
    "serviceAccountName": "<SERVICE_ACCOUNT_EMAIL>"
}
```
Where
- PROJECT_ID is your GCP Project ID
- NEO4J_SERVER_NAME is the name of the Compute Engine Instance running the Neo4j database Service.
- ZONE_NAME is the Compute Zone where the NEO4J_SERVER_NAME is hosted
- SERVICE_ACCOUNT_EMAIL is the e-mail of the Service account created for running this deployment pipeline.

Next, the application can be started with:
```bash
npm install
npm run startAppLocal
```

Or with a standard npm start if you wish to bypass nodemon.

This application is a Web Service based on Express prepared to run on a environment specified by a Dockerfile. Although it can be tested on its own, it is recommended to perform a more complete test in a container:
```bash
docker build --no-cache --build-arg SERVICE_ACCOUNT=<SERVICE_ACCOUNT_EMAIL> \
--build-arg PROJECT_ID=<PROJECT_ID> -t <IMAGE_TAG> . 
docker run -dp 3000:3000 <IMAGE_TAG>
```
Where
- SERVICE_ACCOUNT is the e-mail of the Service Account created for executing the deployment pipeline.
- PROJECT_ID is your GCP Project ID
- IMAGE_TAG is the Docker Image tag of your preference.

__NOTE:__ write down the first two parameters, as they are key input parameters to the image build process that will be used in the deployment to GCP step.

This will perform all the necessary installation and configuration steps, and start the application on port 3000.

The same payload used to test the function can be used to test this service, but you must make sure a header coming from GCS (ce-subject) is also present:
```bash
curl --location --request POST 'http://localhost:3000' \
--header 'ce-subject: localTest' \
--header 'Content-Type: application/json' \
--data-raw '{
  "bucket": "gg-neo-plugin-deploy",
  "contentType": "text/plain",
  "crc32c": "rTVTeQ==",
  "etag": "CNHZkbuF/ugCEAE=",
  "metageneration": "1",
  "name": "plugin.jar",
  "selfLink": "https://www.googleapis.com/storage/v1/b/sample-bucket/o/folder/Test.cs",
  "size": "352",
  "storageClass": "MULTI_REGIONAL",
  "timeCreated": "2020-04-23T07:38:57.230Z",
  "timeStorageClassUpdated": "2020-04-23T07:38:57.230Z",
  "updated": "2020-04-23T07:38:57.230Z"
}'
```
## Deploying and Testing on GCP
For a successful end to end execution of the pipeline, this Web Application can be deployed to Cloud Run or Kubernetes Engine. But for simplicity (and also lower costs), all steps are performed with Cloud Run.

Because the Dockerfile depends on some environment variables to properly configure the gcp CLI, the process of deploying to Cloud Run is more involved. But this logic is encapsulated in a shell script for you (taken almost directly from [this post](https://til.simonwillison.net/cloudrun/using-build-args-with-cloud-run)) so all you need to do is run the node module that prepares and runs the script:

```bash
npm run deployToCloudRun
```
This will ask you if you'd like to update the environment variables used in the build process. If you're deploying for the first time, you must answer __Y__ and every time you do so, the entire process may take a few more minutes compared to answering __N__
You should be able monitor the build process in the Cloud Build logs within the GCP Console or via CLI.

To test this Service on GCP you can either send a direct request to it (you'll need to authenticate) or trigger the deployment pipeline by moving a file to the Storage Bucket:

```bash
cp ~/<YOUR_JAR_FILE>.jar gs://<BUCKET_NAME>
```

