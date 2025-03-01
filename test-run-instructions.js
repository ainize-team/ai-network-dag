const { isTrainInstruction, parseInstruction, TRAIN } = require("./worker/instructions");
const { runContainer } = require("./worker/docker");

async function runIfInstruction(message) {
  if (!isTrainInstruction(message)) {
    console.log("Message is not a valid instruction.");
    return;
  }

  try {
    const { instruction, container_id, data_id } = parseInstruction(message);

    if (instruction === TRAIN) {
      console.log("Training instruction received.");
      runContainer(container_id, data_id); // Run the container
    } else {
      console.log("Unsupported instruction:", instruction);
    }
  } catch (error) {
    console.error("Error processing instruction:", error.message);
  }
}

// Example usage
const message = "{train mnist_container mnist_data_cid0";
runIfInstruction(message);

// console.log(JSON.parse(`{
//   "test_loss": 0.08014832437038422,
//   "test_accuracy": 0.9739999771118164
// }`));
