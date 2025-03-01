# AINetwork DAG Client

JavaScript client for interacting with the AINetwork MerkleDAG gRPC service.

## Installation

```bash
npm install ai-network-dag-client
```

## Features

- Simple API for AINetwork MerkleDAG service
- Promise-based methods
- Event-based subscription handling
- Built-in file handling utilities

## Usage Examples

### Basic Setup

```javascript
const AINetworkDAGClient = require('ai-network-dag-client');
const grpc = require('@grpc/grpc-js');

// Connect to an insecure server (for development)
const client = new AINetworkDAGClient('localhost:50051');

// OR connect to a secure server
const secureClient = new AINetworkDAGClient(
  'secure-server:50052',
  grpc.credentials.createSsl()
);
```

### Adding Content

```javascript
// Add simple content
async function addContent() {
  try {
    const response = await client.add({
      message: 'Hello, AINetwork DAG!',
      data: Buffer.from('Some data'),
      children: [] // optional child CIDs
    });
    
    console.log('Added content with CID:', response.cid);
  } catch (error) {
    console.error('Error adding content:', error);
  }
}

// Add content from a file
async function addFile() {
  try {
    const response = await client.addFile(
      './data.json',
      'My JSON data'
    );
    
    console.log('Added file with CID:', response.cid);
  } catch (error) {
    console.error('Error adding file:', error);
  }
}
```

### Getting Content

```javascript
async function getContent(cid) {
  try {
    const content = await client.get(cid);
    
    console.log('Retrieved content:', {
      cid: content.cid,
      message: content.message,
      dataLength: content.data ? content.data.length : 0,
      children: content.children
    });
    
    // If the content contains text data
    if (content.data) {
      const textData = Buffer.from(content.data).toString('utf8');
      console.log('Content data as text:', textData);
    }
  } catch (error) {
    console.error('Error getting content:', error);
  }
}
```

### Publishing to a Topic

```javascript
async function publishToTopic() {
  try {
    const response = await client.publish(
      'my-topic',
      'Hello, subscribers!'
    );
    
    console.log('Publish successful:', response.success);
  } catch (error) {
    console.error('Error publishing:', error);
  }
}
```

### Subscribing to a Topic

```javascript
function subscribeToTopic() {
  // Your node public key
  const nodePk = 'your-node-public-key';
  
  // Subscribe to a topic
  const subscriptionId = client.subscribe('my-topic', nodePk);
  
  // Handle incoming publications
  client.on('publication', (data) => {
    console.log(`Received publication on ${data.topic}:`, data.instruction);
  });
  
  // Handle errors
  client.on('error', (data) => {
    console.error(`Subscription error (${data.subscriptionId}):`, data.error);
  });
  
  // Handle subscription end
  client.on('end', (data) => {
    console.log(`Subscription ended: ${data.subscriptionId}`);
  });
  
  // Later, when you want to unsubscribe
  setTimeout(() => {
    const success = client.unsubscribe(subscriptionId);
    console.log('Unsubscribed:', success);
  }, 60000); // Unsubscribe after 1 minute
}
```

### Cleanup

```javascript
// When you're done with the client
function cleanup() {
  client.close();
  console.log('Client closed');
}
```

## API Reference

### `AINetworkDAGClient`

The main client class for interacting with the AINetwork MerkleDAG service.

#### Constructor

```javascript
new AINetworkDAGClient(serverAddress, credentials)
```

- `serverAddress`: The gRPC server address (e.g., "localhost:50051")
- `credentials`: Optional custom gRPC credentials. Defaults to insecure credentials.

#### Methods

- `add(content)`: Add content to the MerkleDAG.
  - `content.message`: Message or filename (string)
  - `content.data`: Binary data (Buffer or Uint8Array)
  - `content.children`: Array of child CIDs (string[])
  - Returns: Promise with `{cid: string}`

- `get(cid)`: Get content from the MerkleDAG by CID.
  - `cid`: Content identifier (string)
  - Returns: Promise with content object

- `publish(topic, instruction)`: Publish to a topic.
  - `topic`: Topic name (string)
  - `instruction`: Message to publish (string)
  - Returns: Promise with `{success: boolean}`

- `subscribe(topic, nodePk)`: Subscribe to a topic.
  - `topic`: Topic name (string)
  - `nodePk`: Node public key (string)
  - Returns: Subscription ID (string)

- `unsubscribe(subscriptionId)`: Unsubscribe from a topic.
  - `subscriptionId`: ID returned from subscribe() (string)
  - Returns: Success status (boolean)

- `addFile(filePath, message, children)`: Add content from a file.
  - `filePath`: Path to file (string)
  - `message`: Optional description (string)
  - `children`: Optional array of child CIDs (string[])
  - Returns: Promise with `{cid: string}`

- `close()`: Close the client and all active subscriptions.

#### Events

- `'publication'`: Emitted when a publication is received on a subscribed topic.
  - `{subscriptionId, topic, instruction}`

- `'error'`: Emitted when a subscription error occurs.
  - `{subscriptionId, error}`

- `'end'`: Emitted when a subscription ends.
  - `{subscriptionId}`

## License

MIT