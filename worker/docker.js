const { spawn } = require("child_process");

function runContainer(container_id, container_args) {
  console.log(`Running container: ${container_id} with arguments:`, container_args);

  // Prepare the arguments for the Docker command
  const args = [
    "run",
    "--rm",
    "--add-host", "host.docker.internal:host-gateway", // Add host for accessing the host machine
    container_id,
  ];

  // Add container_args dynamically
  for (const [key, value] of Object.entries(container_args)) {
    args.push(`--${key}`, value);
  }
  
  const dockerProcess = spawn("docker", args);

  dockerProcess.stdout.on("data", async (data) => {
    console.log(`Container Output: ${data.toString()}`);
  });

  dockerProcess.stderr.on("data", (data) => {
    console.error(`Container Error: ${data.toString()}`);
  });

  dockerProcess.on("close", (code) => {
    console.log(`Container process exited with code: ${code}`);
  });
}

module.exports = {
  runContainer,
};
