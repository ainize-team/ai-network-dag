const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { promisify } = require('util');
const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs');

/**
 * Client for AINetworkMerkleDAG service
 * @class AINetworkDAGClient
 * @extends EventEmitter
 */
class AINetworkDAGClient extends EventEmitter {
  /**
   * Create a new AINetworkDAGClient
   * @param {string} serverAddress - The gRPC server address (e.g., "localhost:50051")
   * @param {Object} [credentials] - Optional custom gRPC credentials
   */
  constructor(serverAddress, credentials) {
    super();
    
    // Default to insecure credentials if none are provided
    const creds = credentials || grpc.credentials.createInsecure();
    
    // Load the protobuf definition
    const PROTO_PATH = path.join(__dirname, 'ai_network_dag.proto');
    const packageDef = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });
    
    const protoDescriptor = grpc.loadPackageDefinition(packageDef);
    const ainService = protoDescriptor.ain.AINetworkMerkleDAG;
    
    if (!ainService) {
      throw new Error('Failed to load AINetworkMerkleDAG service definition');
    }
    
    // Create the client
    this.client = new ainService(serverAddress, creds);
    
    // Store active subscriptions for cleanup
    this.subscriptions = new Map();
    
    // Flag to track if the client is closing
    this._isClosing = false;
  }

  /**
   * Add content to the MerkleDAG
   * @param {Object} content - The content to add
   * @param {string} [content.cid] - Content identifier (optional)
   * @param {string} [content.message] - Message or filename
   * @param {Buffer|Uint8Array} [content.data] - Binary data
   * @param {string[]} [content.children] - Child CIDs
   * @returns {Promise<{cid: string}>} - Content response with CID
   */
  add(content) {
    return promisify(this.client.add.bind(this.client))(content);
  }

  /**
   * Get content from the MerkleDAG by CID
   * @param {string} cid - The content identifier
   * @returns {Promise<Object>} - The content
   */
  get(cid) {
    return promisify(this.client.get.bind(this.client))({ cid });
  }

  /**
   * Publish to a topic
   * @param {string} topic - The topic to publish to
   * @param {string} instruction - The instruction or message to publish
   * @returns {Promise<{success: boolean}>} - Publication response
   */
  publish(topic, instruction) {
    return promisify(this.client.publish.bind(this.client))({ 
      topic, 
      instruction 
    });
  }

  /**
   * Subscribe to a topic
   * @param {string} topic - The topic to subscribe to
   * @param {string} nodePk - The public key of the node (for authorization)
   * @returns {string} - The subscription ID (for unsubscribing)
   */
  subscribe(topic, nodePk) {
    const subscriptionId = `${topic}-${Date.now()}`;
    
    try {
      const subscription = this.client.subscribe({
        topic,
        node_pk: nodePk
      });
      
      subscription.on('data', (publication) => {
        this.emit('publication', {
          subscriptionId,
          topic: publication.topic,
          instruction: publication.instruction
        });
      });
      
      subscription.on('error', (error) => {
        // Don't emit cancelled errors when they are expected (during unsubscribe)
        if (error.code === 1 && error.details === 'Cancelled on client' && 
            this._isClosing) {
          return;
        }
        
        this.emit('error', {
          subscriptionId,
          error
        });
      });
      
      subscription.on('end', () => {
        this.emit('end', { subscriptionId });
        this.subscriptions.delete(subscriptionId);
      });
      
      this.subscriptions.set(subscriptionId, subscription);
      return subscriptionId;
    } catch (error) {
      this.emit('error', {
        subscriptionId,
        error
      });
      return null;
    }
  }

  /**
   * Unsubscribe from a topic
   * @param {string} subscriptionId - The subscription ID returned from subscribe()
   * @returns {boolean} - True if the subscription was cancelled, false otherwise
   */
  unsubscribe(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.cancel();
      this.subscriptions.delete(subscriptionId);
      return true;
    }
    return false;
  }

  /**
   * Add content from a file
   * @param {string} filePath - Path to the file to add
   * @param {string} [message] - Optional message or description
   * @param {string[]} [children] - Optional array of child CIDs
   * @returns {Promise<{cid: string}>} - Content response with CID
   */
  async addFile(filePath, message, children = []) {
    const data = await fs.promises.readFile(filePath);
    return this.add({
      message: message || path.basename(filePath),
      data,
      children
    });
  }

  /**
   * Close the client and all active subscriptions
   */
  close() {
    // Set closing flag to true
    this._isClosing = true;
    
    // Cancel all active subscriptions
    for (const subscription of this.subscriptions.values()) {
      try {
        subscription.cancel();
      } catch (error) {
        // Silently handle any errors during cancellation
      }
    }
    this.subscriptions.clear();
    
    // Close the gRPC client
    if (this.client && typeof this.client.close === 'function') {
      this.client.close();
    }
  }
}

module.exports = AINetworkDAGClient;