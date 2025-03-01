require('dotenv').config(); // Load environment variables from a .env file
const Ain = require('@ainblockchain/ain-js').default;

// Initialize Ain.js
const ain = new Ain('https://testnet-api.ainetwork.ai', 'wss://testnet-event.ainetwork.ai', 0);
const privateKey = process.env.PRIVATE_KEY; // Replace with your private key or set in your environment
const appName = 'ain_training_10';

// Function to update status to the Ain blockchain
async function update_root_to_ain_blockchain(rootCid, memoryId) {
  console.log("privateKey", privateKey);
  try {
    // Set the private key for authentication
    ain.wallet.addAndSetDefaultAccount(privateKey);

    const appPath = `/apps/${appName}`;
    console.log(`App Path: ${appPath}`);
    
    const userMessagePath = `${appPath}/${memoryId}`;
    console.log(`User Message Path: ${userMessagePath}`);
    console.log(`rootCid: ${rootCid}`);
    
    // Update the blockchain with the provided message
    const result = await ain.db.ref(`${userMessagePath}`).setValue({
      value: rootCid,
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

// Function to update status to the Ain blockchain
async function get_root_from_ain_blockchain(memoryId) {
  console.log("privateKey", privateKey);
  try {
    // Set the private key for authentication
    ain.wallet.addAndSetDefaultAccount(privateKey);

    const appPath = `/apps/${appName}`;
    console.log(`App Path: ${appPath}`);
    
    const userMessagePath = `${appPath}/${memoryId}`;
    console.log(`User Message Path: ${userMessagePath}`);
    
    // Verify the update by fetching the value back
    const result = await ain.db.ref(userMessagePath).getValue();
    console.log(`result: ${result}`)
    return JSON.stringify(result, null, 2);
  } catch (error) {
    console.error('Error updating Ain blockchain:', error.message);
    throw error;
  }
}

// Export the function
module.exports = {
  update_root_to_ain_blockchain,
  get_root_from_ain_blockchain
};

// update_root_to_ain_blockchain("test_cid", "test_memory_id");
get_root_from_ain_blockchain("test_memory_id");