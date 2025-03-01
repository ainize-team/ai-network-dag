const AINetworkDAGClient = require('./ai_network_dag_client');

// Create a new client instance
const client = new AINetworkDAGClient('localhost:50051');

// Add content example
async function addContentExample() {
  try {
    // Creating a prompt example
    const promptObj = {
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "What is the capital of France?" }
      ],
      temperature: 0.7,
      max_tokens: 150
    };
    const promptStr = JSON.stringify(promptObj);
    
    const response = await client.add({
      message: 'AI prompt',
      data: Buffer.from(promptStr),
      children: []
    });
    
    console.log('Added prompt with CID:', response.cid);
    return response.cid;
  } catch (error) {
    console.error('Error adding prompt:', error);
  }
}

// Get content example
async function getContentExample(cid) {
  try {
    const content = await client.get(cid);
    
    console.log('Retrieved content:', {
      cid: content.cid,
      message: content.message,
      dataLength: content.data ? content.data.length : 0,
      children: content.children
    });
    
    // If the content contains JSON data, parse it
    if (content.data) {
      try {
        const dataString = Buffer.from(content.data).toString('utf8');
        const jsonData = JSON.parse(dataString);
        console.log('Content data as JSON:', jsonData);
      } catch (parseError) {
        console.log('Content data as string:', Buffer.from(content.data).toString('utf8'));
        console.error('Error parsing JSON:', parseError.message);
      }
    }
  } catch (error) {
    console.error('Error getting content:', error);
  }
}

// Publish to topic example
async function publishExample() {
  try {
    // Create instruction with proper JSON formatting
    const instruction = JSON.stringify({ 
      command: "train", 
      container_id: "mnist-train", 
      worker_pk: "pksample", 
      data: "cf6a6e9921cd35b4ee39e74df3fedaaa40fab250029b1e1092da70e1c38b57e8" 
    });
    
    const response = await client.publish('training-topic', instruction);
    console.log('Publish successful:', response.success);
  } catch (error) {
    console.error('Error publishing:', error);
  }
}

// Subscribe to topic example
function subscribeExample() {
  const subscriptionId = client.subscribe('training-topic', 'your-node-public-key');
  
  if (!subscriptionId) {
    console.error('Failed to create subscription');
    return null;
  }
  
  // Handle incoming publications
  client.on('publication', (data) => {
    console.log(`Received publication on ${data.topic}`);
    
    // Try to parse the instruction as JSON
    try {
      const instructionObj = JSON.parse(data.instruction);
      console.log('Parsed instruction:', instructionObj);
    } catch (error) {
      console.log('Raw instruction:', data.instruction);
      console.error('Error parsing instruction as JSON:', error.message);
    }
  });
  
  // Handle errors
  client.on('error', (data) => {
    console.error('Subscription error:', data.error);
  });
  
  // Handle subscription end
  client.on('end', (data) => {
    console.log(`Subscription ended: ${data.subscriptionId}`);
  });
  
  return subscriptionId;
}

// Run the examples
async function runExamples() {
  try {
    console.log('Starting AINetwork DAG Client examples...');
    
    // Add content
    const cid = await addContentExample();
    
    // Get the content we just added
    if (cid) {
      await getContentExample(cid);
    }
    
    // Subscribe to a topic
    const subscriptionId = subscribeExample();
    if (subscriptionId) {
      console.log('Subscribed with ID:', subscriptionId);
      
      // Publish to the topic
      await publishExample();
      
      // Wait a bit before unsubscribing
      console.log('Waiting for 5 seconds before unsubscribing...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Unsubscribe
      const unsubscribed = client.unsubscribe(subscriptionId);
      console.log('Unsubscribed successfully:', unsubscribed);
    }
    
  } catch (error) {
    console.error('Error in examples:', error);
  } finally {
    // Close the client
    client.close();
    console.log('Client closed');
  }
}

// Run the examples
runExamples().catch(console.error);