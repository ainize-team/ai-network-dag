const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load gRPC protobuf definitions
const PROTO_PATH = './ai_network_envoy.proto';  // Update with your actual proto file path
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

// Add parent content
const parentContentToAdd = {
    type: "MESSAGE", // Use enum from your protobuf for the content type
    message: 'This is parrent',    // Not used for PARENT type
};

client.add(parentContentToAdd, (error, parentResponse) => {
    if (error) {
        console.error('Error adding parent content:', error);
    } else {
        console.log('Add Parent Content Response:', parentResponse);

        const parentCid = parentResponse.cid;

        // Add child content with parent_cid set to the parent content's CID
        const childContentToAdd = {
            type: "MESSAGE", // Use enum from your protobuf for the content type
            message: 'Hello, World!', // Used if type is MESSAGE
            parent_cid: parentCid // Set parent CID to the CID of the parent content
        };

        client.add(childContentToAdd, (error, childResponse) => {
            if (error) {
                console.error('Error adding child content:', error);
            } else {
                console.log('Add Child Content Response:', childResponse);
                client.getChildren({ parent_cid: parentCid }, (error, response) => {
                    if (error) {
                        console.error('Error getting content by parent CID:', error);
                    } else {
                        console.log('Get By Parent CID Response:', response);
                    }
                });
            }
        });
    }
});
