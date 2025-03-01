
require('dotenv').config(); // Load environment variables from a .env file
const Ain = require('@ainblockchain/ain-js').default;

// Initialize Ain.js
const ain = new Ain('https://testnet-api.ainetwork.ai', 'wss://testnet-event.ainetwork.ai', 0);
const privateKey = process.env.PRIVATE_KEY; // Replace with your private key or set in your environment
const appName = 'ain_training_10';

// Import the client package
const AINetworkDAGClient = require('ai-network-dag-client');

// Create a new client instance
const client = new AINetworkDAGClient('localhost:50051');

// Test function for adding content with a prompt
async function testAddPrompt() {
  try {
    // Create a sample prompt
    const promptObj = {
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "What is blockchain technology?" }
      ],
      temperature: 0.7,
      max_tokens: 200
    };

    // Convert to JSON string
    const promptStr = JSON.stringify(promptObj);
    
    // Add the content to the DAG
    console.log('Adding prompt to AINetwork DAG...');
    const response = await client.add({
      message: 'Blockchain explanation prompt',
      data: Buffer.from(promptStr),
      children: []
    });
    
    console.log('Successfully added prompt with CID:', response.cid);
    return response.cid;
  } catch (error) {
    console.error('Error adding prompt:', error);
    return null;
  }
}

// Test function for getting content by CID
async function testGetContent(cid) {
  if (!cid) {
    console.log('No CID provided, skipping content retrieval');
    return;
  }

  try {
    console.log(`Retrieving content with CID: ${cid}...`);
    const content = await client.get(cid);
    
    console.log('Content metadata:', {
      cid: content.cid,
      message: content.message,
      dataSize: content.data ? content.data.length : 0,
      children: content.children
    });
    
    // Parse and display the content data if it's JSON
    if (content.data && content.data.length > 0) {
      try {
        const dataString = Buffer.from(content.data).toString('utf8');
        const jsonData = JSON.parse(dataString);
        console.log('Content data (parsed):', jsonData);
      } catch (parseError) {
        console.log('Content data (raw):', Buffer.from(content.data).toString('utf8'));
      }
    }
  } catch (error) {
    console.error('Error retrieving content:', error);
  }
}

// Test function for publishing to a topic
async function testPublish() {
  try {
    const instruction = JSON.stringify({ 
      command: "query", 
      prompt: "What is the capital of Japan?",
      model: "gpt-4"
    });
    
    console.log('Publishing to topic "ai-queries"...');
    const response = await client.publish('ai-queries', instruction);
    console.log('Publish result:', response.success ? 'Success' : 'Failed');
  } catch (error) {
    console.error('Error publishing to topic:', error);
  }
}

// Test function for subscribing to a topic
function testSubscribe() {
  console.log('Subscribing to topic "ai-queries"...');
  
  // You should replace this with your actual node public key
  const subscriptionId = client.subscribe('ai-queries', 'test-node-public-key-123');
  
  if (!subscriptionId) {
    console.error('Failed to create subscription');
    return null;
  }
  
  console.log(`Successfully subscribed with ID: ${subscriptionId}`);
  
  // Set up event handlers
  client.on('publication', (data) => {
    console.log(`\n>>> Received publication on topic "${data.topic}"`);
    
    try {
      const parsed = JSON.parse(data.instruction);
      console.log('Instruction data:', parsed);
    } catch (e) {
      console.log('Raw instruction:', data.instruction);
    }
  });
  
  client.on('error', (data) => {
    if (data.error && data.error.code === 1 && data.error.details === 'Cancelled on client') {
      // Ignore expected cancellation errors
      return;
    }
    console.error('Subscription error:', data.error);
  });
  
  client.on('end', (data) => {
    console.log(`Subscription ended: ${data.subscriptionId}`);
  });
  
  return subscriptionId;
}

// Function to update status to the Ain blockchain
async function update_memory_cid(cid, workerPK) {
  console.log("privateKey", privateKey);
  try {
    // Set the private key for authentication
    ain.wallet.addAndSetDefaultAccount(privateKey);
    const appPath = `/apps/${appName}`;
    const userMessagePath = `${appPath}/memory/${workerPK}`;
    console.log(`User Message Path: ${userMessagePath}`);
    console.log(`cid: ${cid}`);
    
    // Update the blockchain with the provided message
    const result = await ain.db.ref(`${userMessagePath}/${Date.now()}`).setValue({
      value: cid,
      nonce: -1,
    });

    console.log('Blockchain update result:', JSON.stringify(result, null, 2));

    // Verify the update by fetching the value back
    const verification = await ain.db.ref(userMessagePath).getValue();
    console.log('Verification result:', JSON.stringify(verification, null, 2));
    return result;
  } catch (error) {
    console.error('Error updating Ain blockchain:', error.message);
    throw error;
  }
}

// Main test function
async function runTests() {
  try {
    console.log('Starting AINetwork DAG client tests...\n');
    
    // Test adding content
    const cid = await testAddPrompt();
    
    // Test getting content
    await testGetContent(cid);
    
    // Test subscribing to a topic
    const subscriptionId = testSubscribe();
    
    if (subscriptionId) {
      // Test publishing to the topic we're subscribed to
      setTimeout(async () => {
        await testPublish();
      }, 1000);
      
      // Unsubscribe after some time
      console.log('\nWaiting for 10 seconds to receive any publications...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      if (subscriptionId) {
        console.log(`Unsubscribing from subscription ${subscriptionId}...`);
        const unsubscribed = client.unsubscribe(subscriptionId);
        console.log('Unsubscribe result:', unsubscribed ? 'Success' : 'Failed');
      }
    }
    
    // Clean up
    console.log('\nClosing client...');
    client.close();
    console.log('Tests completed.');
    
  } catch (error) {
    console.error('Unexpected error during tests:', error);
  }
}

// Run the tests
console.log('AINetwork DAG Client Test');
console.log('========================\n');
runTests().catch(console.error);