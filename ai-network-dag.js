const crypto = require('crypto');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const axios = require('axios')
const dht = require('./dht')
const path = require('path')
const fs = require('fs')
const { runInstruction } = require('./worker/instructions')
// Load gRPC protobuf definitions
const PROTO_PATH = './ai_network_dag.proto';  // Ensure this is the correct path
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// yargs를 사용하여 명령줄 인자 파싱
const argv = yargs(hideBin(process.argv))
  .option('address', {
    alias: 'a',
    describe: 'Server address for internal binding',
    default: 'localhost:50051',
    type: 'string'
  })
  .option('peers', {
    alias: 'p',
    describe: 'Peer addresses (comma separated)',
    default: 'localhost:50052',
    type: 'string'
  })
  .argv;

// Use the 'ain' package name as defined in your .proto file
const ainProto = grpc.loadPackageDefinition(packageDefinition).ain;

// Subscriptions 저장을 위한 객체
const subscriptions = {};

class AINetworkMerkleDAGService {
    constructor() {
        this.dag = {};
    }

    generateCid(content) {
        const sha256 = crypto.createHash('sha256');
        if (content.message) {
            sha256.update(content.message);
        } 
        if (content.data) {
            sha256.update(content.data);
        }   
        if (content.children && content.children.length > 0) {
            content.children.forEach(cid => sha256.update(cid));
        }
        return sha256.digest('hex');
    }

    add(call, callback) {
        const content = call.request;
        if (!content.cid) {
            content.cid = this.generateCid(content);
        }
        this.add_content(content)
        callback(null, { cid: content.cid });
    }

    add_content(content) {
        this.dag[content.cid] = content;
        dht.put(content.cid, argv.address)
        this.saveContentToStorageAndClearMemory(content);
    }

    get(call, callback) {
        console.log("get:" + call.request.cid)
        const content = this.dag[call.request.cid];
        if (content) {
            if (content.data === null) {
                // Read the data from storage
                this.readDataFromStorage(content.cid, (err, result) => {
                    if (err) {
                        callback({
                            code: grpc.status.INTERNAL,
                            details: "Error reading data from storage"
                        });
                    } else {
                        // Update the node's content with the data and file name
                        content.data = result.data;
                        content.fileName = result.fileName; // Add file name to content
                        callback(null, content);
                    }
                });
            } else {
                callback(null, content);
            }
        } else {
            dht.get(call.request.cid, (err, response) => {
                if (response.found) {
                    console.log(response.found)
                    // Create a gRPC client
                    const client = new ainProto.AINetworkMerkleDAG(response.value, grpc.credentials.createInsecure());
                    // Test Get method using the CID from Add response
                    client.get({ cid: call.request.cid }, (err, response) => {
                        console.log(response)
                        if (response) {
                            this.add_content(response)
                        }
                        callback(err, response)
                    });
                } else {
                    callback({
                        code: grpc.status.NOT_FOUND,
                        details: "Content not found"
                    });
                }
            })
        }
    }

    saveContentToStorageAndClearMemory(content) {
        const storagePath = './storage-' + argv.address; // Define the directory for storage
        const filePath = path.join(storagePath, content.cid); // Create a file path

        // Ensure the storage directory exists
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }
        
        // Write content data to a file
        fs.writeFile(filePath, content.data, (err) => {
            if (err) {
                console.log(err);
                throw err;
            }
            console.log(`Content saved to ${filePath}`);
        
            // Save the original file name alongside the data
            const metaFilePath = `${filePath}.meta`;
            fs.writeFile(metaFilePath, `${content.fileName || 'unknown'}\n`, (metaErr) => {
                if (metaErr) {
                    console.log(metaErr);
                    throw metaErr;
                }
                console.log(`Metadata saved to ${metaFilePath}`);
            });
        
            // Clear the data field from the content
            content.data = null;
        });
    }

    // Method to read data from storage
    readDataFromStorage(cid, callback) {
        const storagePath = './storage-' + argv.address;
        const filePath = path.join(storagePath, cid);
        const metaFilePath = `${filePath}.meta`; // Metadata file for the filename
    
        // Read metadata to retrieve the file name
        fs.readFile(metaFilePath, 'utf8', (metaErr, metaData) => {
            if (metaErr) {
                callback(new Error(`Metadata file not found for CID: ${cid}`), null);
            } else {
                const fileNameMatch = metaData.match(/fileName: (.+)/);
                const fileName = fileNameMatch ? fileNameMatch[1] : 'unknown';
    
                // Read the actual data file
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, { fileName, data });
                    }
                });
            }
        });
    }
    
    publish(call, callback) {
        const topic = call.request.topic;
        const publication = call.request;
        console.log(call.request);
        runInstruction(call.request.instruction);
        // Send message to all subscribers of the topic
        if (subscriptions[topic]) {
            for (const [node_pk, subscriber] of Object.entries(subscriptions[topic])) {
                console.log(`Calling subscriber ${node_pk}`);
                subscriber.write(publication); // Send the publication to the subscriber
            }
        }
        callback(null, { success: true });
    }
    
    subscribe(call) {
        const topic = call.request.topic;
        const node_pk = call.request.node_pk;
        if (!subscriptions[topic]) {
            subscriptions[topic] = {};
        }
        subscriptions[topic][node_pk] = call;

        console.log(`Node ${node_pk} subscribed to topic ${topic}`);
    
        // Handle the stream closure
        call.on("end", () => {
            // Remove the subscriber when the stream ends
            subscriptions[topic] = subscriptions[topic].filter(
                (subscriber) => subscriber.call !== call
            );
            console.log(`Node ${node_pk} unsubscribed from topic ${topic}`);
        });
    }
}

// Set up gRPC server
const server = new grpc.Server();
server.addService(ainProto.AINetworkMerkleDAG.service, new AINetworkMerkleDAGService());
dht.addService(server)
const peers = argv.peers.split(',');
peers.forEach(peer => dht.addPeer(peer.trim()));
server.bindAsync(argv.address, grpc.ServerCredentials.createInsecure(), () => {
    server.start();
});

console.log(`gRPC server running on ${argv.address}`);
