const { spawn } = require("child_process");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const fs = require("fs");

const PROTO_PATH = "./ai_network_dag.proto";

// Load the protobuf definition
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const ainProto = grpc.loadPackageDefinition(packageDefinition).ain;

// Access the correct service definition
const AINetworkMerkleDAGService = ainProto.AINetworkMerkleDAG;

const client = new AINetworkMerkleDAGService("localhost:50051", grpc.credentials.createInsecure());

function runInstruction(instruction) {
  try {
    client.publish({ topic: 'TRAIN_MNIST', instruction: instruction }, (error, response) => {
      if (error) {
        console.error(`Error publishing instruction: ${error.message}`);
        return;
      }
      console.log(`Instruction published successfully: ${JSON.stringify(response)}`);
    });
  } catch (err) {
    console.error(`Invalid instruction format: ${err.message}`);
  }
}

// Read CIDs from file and create instructions
fs.readFile("./sample_federated_learning/cids.txt", "utf8", (err, data) => {
  if (err) {
    console.error(`Error reading CID file: ${err.message}`);
    return;
  }

  const cids = data.split("\n").filter(cid => cid.trim() !== "");

  cids.slice(0, 5).forEach((cid, index) => {
    const instruction = JSON.stringify({
      command: "train",
      container_id: "mnist-train",
      worker_pk: `workerpk${index + 1}`,
      data: cid.trim(),
    });
    const call = client.subscribe({ topic: "TRAIN_MNIST", node_pk: "workerpk${index + 1}"  });
    call.on("data", (response) => {
      console.log("Received message:", response);
    });
    
    runInstruction(instruction);
  });
});
