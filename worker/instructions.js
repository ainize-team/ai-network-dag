const { runContainer } = require("./docker");
const { update_status_to_ain_blockchain } = require("./ai-network-updater");
const TRAIN = "train"
const SET = "set"

async function runInstruction(message) {
  try {
    const instruction = parseInstruction(message);

    if (instruction.command === TRAIN) {
      console.log("Training instruction received.");
      runContainer(instruction.container_id, instruction.container_args); // Run the container
    } else if (instruction.command === SET) {
      update_status_to_ain_blockchain(instruction.message, instruction.worker_pk)
    }
  } catch (error) {
    console.error("Error processing instruction:", error.message);
  }
}

function isInstruction(message) {
  try {
    const parsed = JSON.parse(message);
    return parsed.hasOwnProperty("command");
  } catch (error) {
    return false;
  }
}

function parseInstruction(message) {
  let parsed;
  try {
    parsed = JSON.parse(message);
  } catch (error) {
    throw new Error("Invalid JSON format. Please provide a valid JSON string.");
  }
  return parsed;
}

module.exports = {
  isInstruction,
  parseInstruction,
  runInstruction
};
