const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

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
const client = new ainProto.AINetworkMerkleDAG('localhost:50051', grpc.credentials.createInsecure());

// Publish 요청
function testPublish() {
    const topic = 'topic';
    const cid = 'testCid';

    client.publish({ topic, cid }, (error, response) => {
        if (!error) {
            console.log('Publish response:', response);
        } else {
            console.error('Publish error:', error);
        }
    });
}

// Subscribe 요청
function testSubscribe() {
    const topic = 'topic';
    const worker = 'testWorker';

    const stream = client.subscribe({ topic, worker });

    stream.on('data', (response) => {
        console.log('Received message:', response);
    });

    stream.on('error', (error) => {
        console.error('Subscribe error:', error);
    });

    stream.on('end', () => {
        console.log('Subscription ended');
    });
}

// Run both functions
testSubscribe();
setTimeout(testPublish, 1000); // Wait 1 second before publishing
