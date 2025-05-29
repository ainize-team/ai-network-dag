# Publishing the AINetwork DAG Client

This document outlines the steps to publish the AINetwork DAG Client to npm.

## Preparation

1. Make sure you have an npm account and are logged in:
   ```bash
   npm login
   ```

2. Ensure all files are in the correct structure:
   ```
   /
   ├── ai_network_dag.proto
   ├── client/
   │   ├── ai_network_dag_client.js
   │   ├── ai_network_dag_client.d.js
   │   ├── index.js
   │   ├── package.json
   │   └── README.md
   ├── LICENSE
   └── README.md (optional, can be symbolic link to client/README.md)
   ```

3. Review the package.json to ensure all dependencies and metadata are correct.

## Publishing

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Run npm publish:
   ```bash
   npm publish
   ```

   If this is the first time publishing this package, you might need to specify public access:
   ```bash
   npm publish --access public
   ```

## Updating

When you need to update the package:

1. Update the version in client/package.json:
   ```json
   "version": "1.0.1",
   ```

2. Navigate to the client directory:
   ```bash
   cd client
   ```

3. Publish the updated version:
   ```bash
   npm publish
   ```

## Testing the Published Package

After publishing, you can test the package by installing it in a new project:

1. Create a new directory and initialize a new npm project:
   ```bash
   mkdir test-ain-client
   cd test-ain-client
   npm init -y
   ```

2. Install your published package:
   ```bash
   npm install ai-network-dag-client
   ```

3. Create a test file (test.js):
   ```javascript
   const AINetworkDAGClient = require('ai-network-dag-client');
   
   // Test the client
   const client = new AINetworkDAGClient('localhost:50051');
   console.log('Client created successfully');
   
   // You can add more tests here
   ```

4. Run the test file:
   ```bash
   node test.js
   ```