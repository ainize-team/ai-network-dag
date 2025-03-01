

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync('dht.proto');
const dhtProto = grpc.loadPackageDefinition(packageDefinition).dht;

request_id = 'test_id'
key = 'a'
peerAddress = 'localhost:50051'
peerId = 'peer1'
const peerClient = new dhtProto.DHTService(peerAddress, grpc.credentials.createInsecure());


console.log(request_id, key)
peerClient.get({key: 'key', id: ' test_id'}, (error, response) => {
    if (!error) {
        console.log(response)
        // callback(null, response);
    } else {
        console.error(`Error getting value from peer ${peerId}:`, error);
        // callback(null, { value: '', found: false });
    }
});