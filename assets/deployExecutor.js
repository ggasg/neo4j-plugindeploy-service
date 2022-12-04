const fs = require('fs');
const { spawnSync, spawn } = require('child_process');

const appConfig = JSON.parse(fs.readFileSync('assets/config.json', 'utf-8'));

function deployCloudRun(updateParams) {
    console.log('Begin --- Cloud Run deployment shell script...');
    let region = appConfig.computeZone.slice(0, -2);
    const sp = spawn('source', ['./assets/deploy.sh', `${updateParams}`], {cwd: process.cwd(),
    shell: true,
        env: {
            PATH: process.env.PATH,
            SERVICE_ACCOUNT: appConfig.serviceAccountName,
            NAME: appConfig.appName,
            PROJECT: appConfig.projectName,
            REGION: region,
        }
    });

    sp.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    
    sp.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    
    sp.on('close', (code) => {
      console.log(`Deployment script exited with code ${code}`);
    });

    sp.on('error', (err) => {
      console.error('Failed to run deployment script.', err);
    });
}
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Do you need to update environment variables? (Y/N)\n', ans => {
  switch (ans) {
    case 'Y': 
      console.log('Updating env variables and deploying. This may take a while...');
      deployCloudRun(1);
      break;
    case 'N':
      console.log('Deploying to Cloud run');
      deployCloudRun(0);
      break;
    default:
      console.error('Invalid input. Please retry');
      process.exit(1);
  }
  readline.close();
});

