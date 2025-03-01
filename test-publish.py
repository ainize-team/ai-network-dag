import json
from AINetworkDagSdk import AINetworkDagSdk

def publish_message():
    # Instantiate the client
    client = AINetworkDagSdk("localhost:50051")

    # Function to publish a message
    def publish(topic, message):
        try:
            client.publish(topic, json.dumps(message))
            # print(f"Publish response: {response}")
        except Exception as e:
            print(f"Error publishing message: {e}")

    try:
        # Publish a test message
        test_topic = "topic"
        test_message = {"key": "value"}
        publish(test_topic, test_message)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    publish_message()
