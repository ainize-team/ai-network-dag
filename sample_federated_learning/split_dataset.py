import numpy as np
import tensorflow as tf

# Load the MNIST dataset
(x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()

# Combine train and test data for splitting
data = {
    "x": np.concatenate([x_train, x_test], axis=0),
    "y": np.concatenate([y_train, y_test], axis=0)
}

# Define the number of splits
num_splits = 5

# Split the data
split_x = np.array_split(data["x"], num_splits)
split_y = np.array_split(data["y"], num_splits)

# Save each split to a separate file
for i in range(num_splits):
    filename = f"mnist_split_{i + 1}.npz"
    np.savez(filename, x=split_x[i], y=split_y[i])
    print(f"Saved split {i + 1} to {filename}")
