import json
import time
import threading
from AINetworkDagSdk import AINetworkDagSdk

def main():
    # Instantiate the client
    client = AINetworkDagSdk("localhost:50051")

    # Callback function to handle incoming messages
    def on_message_callback(message):
        print(f"Received message: {message}")

    # Function to subscribe to a topic in a separate thread
    def subscribe_to_topic():
        try:
            client.subscribe("topic", "worker", on_message_callback=on_message_callback)
        except Exception as e:
            print(f"Error in subscription: {e}")

    # Function to publish a message
    def publish_message(topic, message):
        try:
            client.publish(topic, json.dumps(message))
            print(f"Published message to {topic}: {message}")
        except Exception as e:
            print(f"Error publishing message: {e}")

    try:
        # Start subscription in a separate thread
        subscription_thread = threading.Thread(target=subscribe_to_topic, daemon=True)
        subscription_thread.start()

        # Wait for the subscription to initialize
        time.sleep(1)

        # Publish a test message
        test_topic = "topic"
        test_message = {"key": "value"}
        publish_message(test_topic, test_message)

        # Keep the main thread alive to allow message handling
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
