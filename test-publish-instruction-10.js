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

const client = new AINetworkMerkleDAGService("101.202.37.19:50051", grpc.credentials.createInsecure());

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

const instruction1 = JSON.stringify({ command: "train", container_id: "mnist-train", worker_pk: "workerpk1", data: "cid1" });
const instruction2 = JSON.stringify({ command: "train", container_id: "mnist-train", worker_pk: "workerpk2", data: "cid2" });
const instruction3 = JSON.stringify({ command: "train", container_id: "mnist-train", worker_pk: "workerpk3", data: "cid3" });
const instruction4 = JSON.stringify({ command: "train", container_id: "mnist-train", worker_pk: "workerpk4", data: "cid4" });
const instruction5 = JSON.stringify({ command: "train", container_id: "mnist-train", worker_pk: "workerpk5", data: "cid5" });
const instruction6 = JSON.stringify({ command: "train", container_id: "mnist-train", worker_pk: "workerpk6", data: "cid6" });
const instruction7 = JSON.stringify({ command: "train", container_id: "mnist-train", worker_pk: "workerpk7", data: "cid7" });
const instruction8 = JSON.stringify({ command: "train", container_id: "mnist-train", worker_pk: "workerpk8", data: "cid8" });
const instruction9 = JSON.stringify({ command: "train", container_id: "mnist-train", worker_pk: "workerpk9", data: "cid9" });
const instruction10 = JSON.stringify({ command: "train", container_id: "mnist-train", worker_pk: "workerpk10", data: "cid10" });
runInstruction(instruction1);
runInstruction(instruction2);
runInstruction(instruction3);
runInstruction(instruction4);
runInstruction(instruction5);
runInstruction(instruction6);
runInstruction(instruction7);
runInstruction(instruction8);
runInstruction(instruction9);
runInstruction(instruction10);
