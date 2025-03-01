// Basic test to verify the client can be imported
test('Client can be imported', () => {
    const AINetworkDAGClient = require('../ai_network_dag_client');
    expect(AINetworkDAGClient).toBeDefined();
  });