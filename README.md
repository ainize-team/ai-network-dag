## README: How to Run the AI Network Merkle DAG Service Locally

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

- Node.js (v14.x or later)
- npm (v6.x or later)

### Setup Instructions

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Running the Server**

   To start the server, use the following command:

   ```bash
   node ai-network-dag.js --address <your-server-address> --peers <comma-separated-peer-addresses>
   ```

   Example:

   ```bash
   node ai-network-dag.js --address localhost:50051 --peers localhost:50052
   ```

### Command-Line Options

- `--address` (`-a`): Server address for internal binding. Default: `localhost:50051`
- `--peers` (`-p`): Comma-separated peer addresses. Default: `localhost:50052`

### Directory for Storing Data

The server will store data in a directory named `storage-<address>`. Ensure the directory exists or the server has permission to create it.

### Example Usage

1. **Start the server**

   ```bash
   node ai-network-dag.js --address localhost:50051 --peers localhost:50052
   ```

2. **Interact with the gRPC Server**

   You can use gRPC clients (such as [BloomRPC](https://github.com/uw-labs/bloomrpc)) to interact with the server using the methods defined in `ai_network_dag.proto`.

### Methods Provided by the Server

- **add**: Adds content to the Merkle DAG.
- **get**: Retrieves content from the Merkle DAG by CID.
- **publish**: Publishes a message to a topic.
- **subscribe**: Subscribes to a topic.

### Example gRPC Client

Here is an example of how to interact with the gRPC server using a gRPC client in Node.js:

```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = './ai_network_dag.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const ainProto = grpc.loadPackageDefinition(packageDefinition).ain;

const client = new ainProto.AINetworkMerkleDAG('localhost:50051', grpc.credentials.createInsecure());

// Example: Add content
client.add({ type: 'DATA', data: 'Example data' }, (err, response) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Added content with CID:', response.cid);
  }
});

// Example: Get content
client.get({ cid: 'your-cid-here' }, (err, response) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Content retrieved:', response);
  }
});
```