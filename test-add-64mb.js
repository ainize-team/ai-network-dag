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
// const client = new ainProto.AINetworkMerkleDAG('localhost:50051', grpc.credentials.createInsecure());
const client = new ainProto.AINetworkMerkleDAG('3.38.151.243:50051', grpc.credentials.createInsecure());
// File to upload
const filePath = path.join(__dirname, '64mb_test_file.txt');

// Read the file
if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
}

const fileData = fs.readFileSync(filePath);

// Chunk size (optional, adjust if needed)
const chunkSize = 4 * 1024 * 1023; // 4MB (slightly less)

// Function to upload file in chunks
async function uploadFile(fileData, chunkSize, filename) {
    const chunks = [];
    for (let i = 0; i < fileData.length; i += chunkSize) {
        chunks.push(fileData.slice(i, i + chunkSize));
    }

    console.log(`Uploading file '${filename}' in ${chunks.length} chunks...`);

    // Add each chunk
    const chunkCids = [];
    for (const [index, chunk] of chunks.entries()) {
        const contentToAdd = {
            data: chunk, // Each chunk as data
        };

        await new Promise((resolve, reject) => {
            client.add(contentToAdd, (error, response) => {
                if (error) {
                    console.error(`Error adding chunk ${index + 1}:`, error);
                    reject(error);
                } else {
                    console.log(`Chunk ${index + 1} uploaded. CID:`, response.cid);
                    chunkCids.push(response.cid);
                    resolve(response);
                }
            });
        });
    }

    // Add root node with chunk CIDs as children
    const rootContent = {
        cid: '', // CID is computed by the server
        message: filename, // Use filename as root message
        children: chunkCids // Link all chunk CIDs as children
    };

    const rootCid = await new Promise((resolve, reject) => {
        client.add(rootContent, (error, response) => {
            if (error) {
                console.error('Error adding root node:', error);
                reject(error);
            } else {
                console.log('Root node uploaded. CID:', response.cid);
                resolve(response.cid);
            }
        });
    });

    console.log('File upload complete. Root CID:', rootCid);
    return rootCid;
}

// Function to retrieve the root node and its chunks
function retrieveFile(rootCid) {
    client.get({ cid: rootCid }, (error, response) => {
        if (error) {
            console.error('Error retrieving root node:', error);
        } else {
            console.log('Retrieved Root Node:', response);

            // Retrieve all chunks linked to the root node
            const { children } = response;
            const chunks = [];
            console.log(`Retrieving ${children.length} chunks linked to root node...`);

            children.forEach((childCid, index) => {
                client.get({ cid: childCid }, (chunkError, chunkResponse) => {
                    if (chunkError) {
                        console.error(`Error retrieving chunk ${index + 1}:`, chunkError);
                    } else {
                        console.log(`Retrieved chunk ${index + 1}:`, chunkResponse);
                        chunks.push(chunkResponse.data); // Collect chunk data

                        // If all chunks are retrieved, reconstruct the file
                        if (chunks.length === children.length) {
                            const reconstructedData = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
                            const outputFilePath = path.join(__dirname, `reconstructed_${response.message}`);
                            fs.writeFileSync(outputFilePath, reconstructedData);
                            console.log(`Reconstructed file saved as: ${outputFilePath}`);
                        }
                    }
                });
            });
        }
    });
}

// Run the upload and retrieval process
(async () => {
    try {
        const filename = path.basename(filePath); // Extract filename for root message

        console.log(`Starting upload process for file: ${filename}`);
        console.time('Upload Time'); // Start timing
        
        const rootCid = await uploadFile(fileData, chunkSize, filename);
        
        console.timeEnd('Upload Time'); // End timing and log the elapsed time
        console.log(`Upload process completed for file: ${filename}`);
        console.log(`Root CID: ${rootCid}`);
        // Retrieve the root node and its chunks
        // retrieveFile(rootCid);
    } catch (error) {
        console.error('Error during process:', error);
    }
})();
