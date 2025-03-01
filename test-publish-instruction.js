const { spawn } = require("child_process");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

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

const instruction = JSON.stringify({ command: "train", container_id: "mnist-train", worker_pk: "pksample", data: "cf6a6e9921cd35b4ee39e74df3fedaaa40fab250029b1e1092da70e1c38b57e8" });
runInstruction(instruction);
