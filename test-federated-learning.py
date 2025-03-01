import grpc
import json
from concurrent import futures
from AINetworkDagSdk import AINetworkDagSdk
import threading
import tensorflow as tf

# MNIST 데이터 로드 및 전처리
def load_mnist_data():
    (x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()

    # 데이터 정규화 (픽셀 값을 0~1 범위로 조정)
    x_test = x_test.astype("float32") / 255.0

    # 데이터 형상 조정 (MNIST는 28x28 이미지를 4D 텐서로 변환)
    x_test = x_test.reshape(-1, 28, 28, 1)  # (N, H, W, C)

    # 레이블을 원-핫 인코딩으로 변환
    y_test = tf.keras.utils.to_categorical(y_test, 10)

    print("Test data shape:", x_test.shape, y_test.shape)
    return x_test, y_test

# MNIST 테스트 데이터 준비
x_test, y_test = load_mnist_data()
current_epoch = 1

if __name__ == "__main__":
    SERVER_ADDRESS = "localhost:50051"
    ai_network_dag_sdk = AINetworkDagSdk(SERVER_ADDRESS)
    worker_models = {}
    merged = {}


    def merge_models(model_cids):
        try:
            # 모델 병합을 위한 가중치 저장소
            weights_sum = None
            model_count = 0

            for model_cid in model_cids:
                # 모델 다운로드
                print(f"Downloading model for CID: {model_cid}")
                model_path = ai_network_dag_sdk.downloadFile(model_cid)

                # HDF5 형식으로 저장된 모델 로드
                try:
                    model = tf.keras.models.load_model(model_path, compile=False)
                except Exception as load_error:
                    print(f"Error loading model for CID {model_cid}: {load_error}")
                    continue  # 문제 있는 모델은 건너뜀

                # 가중치 합산
                if weights_sum is None:
                    weights_sum = [tf.Variable(w) for w in model.get_weights()]
                else:
                    for i, w in enumerate(model.get_weights()):
                        weights_sum[i].assign_add(w)

                model_count += 1

            # 병합된 가중치 평균 계산
            if weights_sum is not None and model_count > 0:
                averaged_weights = [w / model_count for w in weights_sum]

                # 병합된 모델 생성
                print("Creating merged model...")
                merged_model = tf.keras.models.clone_model(model)  # 병합 기준 모델 복제
                merged_model.set_weights(averaged_weights)
                print("Models successfully merged.")
                return merged_model
            else:
                raise ValueError("No models to merge.")

        except Exception as e:
            print(f"Error during model merging: {str(e)}")
            raise
    try:
        # 사용자 정의 콜백 함수 정의
        def process_message(response):
            global current_epoch  # 전역 변수 선언
            try:
                print(f"Received message: {response}")
                instruction = json.loads(response.instruction)
                worker_pk = instruction.get("worker_pk")
                # Check if the instruction command is "set" and message exists
                if worker_pk and instruction.get("command") == "set" and "message" in instruction:
                    message = instruction["message"]
                    print(f"Start parsing message: {message}")
                    model_cid = message.get("model_cid")
                    epoch = message.get("epoch")
                    if model_cid and epoch == current_epoch:
                        worker_models[worker_pk] = model_cid
                        print(f"Worker {worker_pk}: Updated CID {model_cid}")
                        print(f"Received so far: {len(worker_models)}")
                        # 병합 조건 확인 (5명의 worker가 모두 CID를 보냈을 때)
                        if len(worker_models) == 5 and not merged.get(current_epoch, False):
                            merged[current_epoch] = True  # 병합 완료 상태로 설정
                            print(f"All workers have submitted models. Starting merge for epoch {current_epoch}.")
                            # current_epoch = current_epoch + 1
                            merged_model = merge_models(worker_models.values())  # CID 리스트 전달
                            print("Merged model created successfully.")

                            # 병합된 모델 평가
                            print("Evaluating merged model...")
                            test_loss, test_acc = merged_model.evaluate(x_test, y_test, verbose=2)
                            print(f"Test Loss: {test_loss}, Test Accuracy: {test_acc}")
                    else:
                        print("Invalid message format: model_cid missing")
            except Exception as e:
                print(f"Error processing message: {str(e)}")
            print(response)
            # print(f"Processing message from node_pk: {response.node_pk}, message: {response.message}")

        # 파일에서 CID 읽기
        try:
            with open("./sample_federated_learning/cids.txt", "r", encoding="utf-8") as file:
                cids = [line.strip() for line in file if line.strip()]

            threads = []  # 스레드 목록 저장
            for index, cid in enumerate(cids[:5]):
                instruction = json.dumps({
                    "command": "train",
                    "container_id": "mnist-train",
                    "container_args": {
                        "worker-pk": f"workerpk{index + 1}",
                        "data": cid,
                        "epochs": 1
                    }
                })

                # Subscribe를 별도의 스레드에서 실행
                def run_subscription(index=index):
                    ai_network_dag_sdk.subscribe(
                        topic="TRAIN_MNIST",
                        node_pk=f"workerpk{index + 1}",
                        on_message_callback=process_message,
                    )

                subscription_thread = threading.Thread(target=run_subscription, daemon=True)
                subscription_thread.start()
                threads.append(subscription_thread)

                # Publish 실행
                ai_network_dag_sdk.publish("TRAIN_MNIST", instruction)

            # 모든 스레드가 종료될 때까지 대기
            for thread in threads:
                thread.join()

        except FileNotFoundError as e:
            print(f"Error reading CID file: {str(e)}")
        except Exception as e:
            print(f"Unexpected error: {str(e)}")

    finally:
        ai_network_dag_sdk.close()
