import { spawn } from 'node:child_process';

const nodeName = process.env.K8S_NODE_NAME ?? 'desktop-control-plane';

const images = [
  {
    image: 'smart-job-tracker-backend:local',
  },
  {
    image: 'smart-job-tracker-frontend:local',
  },
];

const streamImageIntoKubernetesNode = (image) =>
  new Promise((resolvePromise, rejectPromise) => {
    const saveProcess = spawn('docker', ['save', image], {
      stdio: ['ignore', 'pipe', 'inherit'],
    });

    const importProcess = spawn(
      'docker',
      ['exec', '-i', nodeName, 'ctr', '-n', 'k8s.io', 'images', 'import', '-'],
      {
        stdio: ['pipe', 'inherit', 'inherit'],
      },
    );

    let saveExitCode;
    let importExitCode;

    const finish = () => {
      if (saveExitCode === undefined || importExitCode === undefined) return;

      if (saveExitCode !== 0) {
        rejectPromise(new Error(`docker save failed for ${image}`));
        return;
      }

      if (importExitCode !== 0) {
        rejectPromise(new Error(`containerd import failed for ${image}`));
        return;
      }

      resolvePromise();
    };

    saveProcess.stdout.pipe(importProcess.stdin);

    saveProcess.on('error', rejectPromise);
    importProcess.on('error', rejectPromise);

    saveProcess.on('close', (exitCode) => {
      saveExitCode = exitCode;
      finish();
    });

    importProcess.on('close', (exitCode) => {
      importExitCode = exitCode;
      finish();
    });
  });

for (const { image } of images) {
  console.log(`Importing ${image} into ${nodeName}`);
  await streamImageIntoKubernetesNode(image);
}

console.log('Local Kubernetes images loaded.');
