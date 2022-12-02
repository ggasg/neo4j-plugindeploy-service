const express = require('express');
const app = express();
const { Storage } = require('@google-cloud/storage');   
const { spawnSync, spawn } = require('child_process');

const fs = require('fs');
const appConfig = JSON.parse(fs.readFileSync('assets/config.json', 'utf-8'));

// const serverName = 'gg-neo-single';
// const computeZone = 'us-east1-b'
// const destPluginFolder = '/var/lib/neo4j/plugins';
const destLocal = process.cwd();

app.use(express.json());

async function downloadFromGcs(bucketName, fileName) {
  console.log(`Download from Storage Bucket: ${bucketName}`);
  const storage = new Storage({keyFilename: 'assets/key.json'});

  await storage.bucket(bucketName).file(fileName).download({destination: destLocal + '/' + fileName});
  console.log(`gs://${bucketName}/${fileName} downloaded to ${destLocal}.`);
}

function sendToComputeInstance(fileName) {
  console.log('gcloud compute scp');
  const sp = spawnSync('gcloud', ['compute', 'scp', fileName, 
  `neo4j@${appConfig.dbServerName}:${appConfig.destPluginFolder}`, 
  `--zone=${appConfig.computeZone}`]);
  if (sp.status && sp.status !== 0) {
    console.error(sp.stderr.toString());
    if (sp.error) {
      throw new Error(sp.error);
    }
    throw new Error('Cannot process request');            
  }
  else {
    console.log('gcloud compute scp --- Done: ', sp.status);
    console.log(sp.stdout.toString());
  }
}

function restartNeo4jDBService() {
  return new Promise((resolve, reject) => {
    console.log('gcloud compute ssh');
    const sp = spawn('gcloud', ['compute', 'ssh',
    `neo4j@${appConfig.dbServerName}`, `--zone=${appConfig.computeZone}`, "--command=sudo systemctl restart neo4j"]);

    sp.stderr.on('data', (err) => {
      console.warn(`Error from Neo4j Restart: ${err}`);
      reject(err); 
    });

    sp.on('error', (err) => {
      console.warn(`Error from Neo4j Restart: ${err}`);
      reject(err); 
    });

    sp.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      if (code === 0) {
        resolve(code);
      }
      else {
        reject();
      }
    });
  });
}

function performCleanup(fileName) {
  fs.unlink(`${destLocal}/${fileName}`, (err) => {
    if (err) {
      console.warn(err);
    }
  });
}

app.post('/', (req, res) => {
  // Perform minimal validation on request body
  if (!req.body) {
    const errorMessage = 'no message received';
    res.status(400).send(`Bad request: ${errorMessage}`);
    return;
  }
  if (!req.header('ce-subject')) {
    const errorMessage = 'Missing required header: ce-subject';
    res.status(400).send(`Bad request: ${errorMessage}`);
    return;
  }

  let fileName = req.body.name;
  let bucketName = req.body.bucket;
  runDeployment(bucketName, fileName)
  .then(() => restartNeo4jDBService())
  .then(() => {
    performCleanup(fileName);
    res.send('Process Done');
    })
  .catch((reason) => {
    res.status(500).send(`Service Error: ${reason.message}`);
  });
});

async function runDeployment(bucketName, fileName) {
  console.log('Begin');
  await downloadFromGcs(bucketName, fileName);
  sendToComputeInstance(fileName);
  console.log('End');
}
    
// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});