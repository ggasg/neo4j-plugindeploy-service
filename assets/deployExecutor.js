const fs = require('fs');
const { spawnSync } = require('child_process');

const appConfig = JSON.parse(fs.readFileSync('assets/config.json', 'utf-8'));

function deployCloudRun() {
    console.log('Executing local shell script...');
    let region = appConfig.computeZone.slice(0, -2);
    const sp = spawnSync('source', ['./assets/deploy.sh'], {cwd: process.cwd(),
        env: {
            PATH: process.env.PATH,
            SERVICE_ACCOUNT: appConfig.serviceAccountName,
            NAME: appConfig.appName,
            PROJECT: appConfig.projectName,
            REGION: region,
        }
    });
    if (sp.status && sp.status !== 0) {
        console.error(sp.stderr.toString());
        if (sp.error) {
          throw new Error(sp.error);
        }
        throw new Error('Cannot run shell script');            
      }
      else {
        console.log('Cloud Run Deploy --- Done: ', sp.status);
        console.log(sp.stdout.toString());
      }
}

deployCloudRun();