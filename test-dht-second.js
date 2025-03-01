const dht = require("./dht")
const grpc = require('@grpc/grpc-js');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// yargs를 사용하여 명령줄 인자 파싱
const argv = yargs(hideBin(process.argv))
  .option('address', {
    alias: 'a',
    describe: 'Server address',
    default: 'localhost:50052',
    type: 'string'
  })
  .option('peer', {
    alias: 'p',
    describe: 'Peer address',
    default: 'localhost:50051',
    type: 'string'
  })
  .argv;

// Set up gRPC server
const server = new grpc.Server();
dht.addService(server)
dht.addPeer(argv.peer);
server.bindAsync(argv.address, grpc.ServerCredentials.createInsecure(), () => {
    server.start();
});

dht.put("b", "bb")
// get은 비동기적으로 작동하므로 콜백을 사용합니다.
dht.get("a", (err, value) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("a Retrieved value:", value);
});

// get은 비동기적으로 작동하므로 콜백을 사용합니다.
dht.get("b", (err, value) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("b Retrieved value:", value);
});


// get은 비동기적으로 작동하므로 콜백을 사용합니다.
dht.get("c", (err, value) => {
    if (err) {
        console.error("c err:", err);
        return;
    }
    console.log("c Retrieved value:", value);
});


// get은 비동기적으로 작동하므로 콜백을 사용합니다.
dht.get("a", (err, value) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("a Retrieved value:", value);
});