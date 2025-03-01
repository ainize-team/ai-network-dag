const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');
const path = require('path');

// Load gRPC protobuf definitions
const PROTO_PATH = './ai_network_dag.proto'; // Update with your actual proto file path
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const ainProto = grpc.loadPackageDefinition(packageDefinition).ain;

// Create a gRPC client
// const client = new ainProto.AINetworkMerkleDAG('localhost:50053', grpc.credentials.createInsecure());
const client = new ainProto.AINetworkMerkleDAG('3.35.132.55:50051', grpc.credentials.createInsecure());

// Root CID provided
const rootCid = '39aa72310d1fac0324b1c9a481eb879115fe6aec7bd34b542ad9a7f023802cb1';

// Function to retrieve the root node and its chunks
async function retrieveFile(rootCid) {
    console.log(`Starting retrieval process for root CID: ${rootCid}`);
    console.time('Total Retrieval Time'); // Start total time measurement

    // Fetch the root node
    const rootNode = await new Promise((resolve, reject) => {
        client.get({ cid: rootCid }, (error, response) => {
            if (error) {
                console.error('Error retrieving root node:', error);
                reject(error);
            } else {
                console.log('Retrieved Root Node:', response);
                resolve(response);
            }
        });
    });

    const { children, message } = rootNode;
    const chunks = Array(children.length).fill(null); // Initialize array to store chunks in order

    console.log(`Retrieving ${children.length} chunks linked to root node...`);
    console.time('Chunks Retrieval Time'); // Start chunks retrieval time

    // Fetch all chunks in parallel
    await Promise.all(
        children.map((childCid, index) =>
            new Promise((resolve, reject) => {
                client.get({ cid: childCid }, (chunkError, chunkResponse) => {
                    if (chunkError) {
                        console.error(`Error retrieving chunk ${index + 1}:`, chunkError);
                        reject(chunkError);
                    } else {
                        console.log(`Retrieved chunk ${index + 1}`);
                        chunks[index] = Buffer.from(chunkResponse.data); // Store chunk in the correct order
                        resolve();
                    }
                });
            })
        )
    );

    console.timeEnd('Chunks Retrieval Time'); // End chunks retrieval time

    // Reconstruct the file
    console.time('File Reconstruction Time'); // Start reconstruction time
    const reconstructedData = Buffer.concat(chunks); // Concatenate chunks in order
    const outputFilePath = path.join(__dirname, `reconstructed_${message}`);
    fs.writeFileSync(outputFilePath, reconstructedData);
    console.timeEnd('File Reconstruction Time'); // End reconstruction time

    console.log(`Reconstructed file saved as: ${outputFilePath}`);
    console.timeEnd('Total Retrieval Time'); // End total time measurement
}

// Run the retrieval process
(async () => {
    try {
        console.time('Script Execution Time'); // Start script execution time
        await retrieveFile(rootCid);
        console.timeEnd('Script Execution Time'); // End script execution time
    } catch (error) {
        console.error('Error during retrieval process:', error);
    }
})();
