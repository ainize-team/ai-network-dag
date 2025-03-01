const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync('dht.proto');
const dhtProto = grpc.loadPackageDefinition(packageDefinition).dht;

// const dht = {};  // DHT 데이터 저장을 위한 객체


class DHTService {
    constructor() {
        this.dht = {};
        this.activeRequests = new Set(); // 활성 요청을 추적하는 집합
    }

    put(call, callback) {
        const { key, value } = call.request;
        console.log('dht put:', key, value)
        this.dht[key] = value;
        callback(null, { success: true });
    }

    get(call, callback) {
        const { id, key } = call.request;
        console.log('dht get:', id, key)
        let request_id = id
        /*
        if (this.activeRequests.size > 10) {
            return
        }*/
        // 이미 활성화된 요청이라면 중복을 방지합니다.
        if (id && this.activeRequests.has(id)) {
            console.log('duplicated request')
            callback(null, { value: '', found: false });
            return;
        }
        if (key in this.dht) {
            console.log('dht get value:', this.dht[key])
            callback(null, { value: this.dht[key], found: true });
        } else if (id) {
            this.activeRequests.add(id)
            getFromPeer(id, key, (err, response) => {
                if (response) {
                    this.dht[key] = response.value
                    callback(null, response);
                } else {
                    callback(null, { value: '', found: false });
                }
            })
        } else {
            callback(new Error('Why here?'), null);
        }
    }
}
// DHTService의 인스턴스 생성
const dhtService = new DHTService();

// put 함수 구현
function put(key, value) {
    // RPC 호출을 대신하여 DHTService의 put 메서드를 사용
    dhtService.put({ request: { key, value } }, (err, response) => {
        if (err) {
            console.error("Error during put operation:", err);
            return;
        }
        console.log("Put operation successful:", key, value, response);
    });
}

function generateRequestId(key) {
    // 요청 ID를 생성합니다. 여기서는 단순한 예로 현재 시간을 사용합니다.
    return `${key}-${Date.now()}`;
}

// get 함수 구현
function get(key, callback) {
    const id = generateRequestId(key)
    // RPC 호출을 대신하여 DHTService의 get 메서드를 사용
    dhtService.get({ request: { id, key } }, callback);
}

let peerList = [];

function addPeer(address) {
    peerList.push(address);
}

function getFromPeer(id, key, callback) {
    let attempts = 0;

    function tryNextPeer() {
        if (attempts >= peerList.length) {
            callback(null, null); // 모든 시도가 실패한 경우
            return;
        }

        const peerAddress = peerList[attempts];
        const peerClient = new dhtProto.DHTService(peerAddress, grpc.credentials.createInsecure());

        peerClient.get({ id: id, key: key }, (error, response) => {
            if (!error && response) {
                console.log(response)
                callback(null, response); // 성공 응답
            } else {
                console.log(peerAddress)
                attempts++;
                tryNextPeer(); // 다음 peer 시도
            }
        });
    }
    tryNextPeer();
}


function addService(server) {
    server.addService(dhtProto.DHTService.service, dhtService);
}

module.exports = { put, get, addPeer, addService};
