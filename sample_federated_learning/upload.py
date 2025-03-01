from AINetworkDagSdk import AINetworkDagSdk

server_address = "localhost:50051"
ai_network_dag_sdk = AINetworkDagSdk(server_address)

try:
    with open("cids.txt", "w") as cid_file:
        for i in range(1, 6):
            file_name = f"mnist_split_{i}.npz"
            print(f"Uploading file: {file_name}")
            cid = ai_network_dag_sdk.uploadFile(file_name)  # 4MB chunk size
            print(f"Uploaded {file_name} with CID: {cid}")
            cid_file.write(f"{cid}\n")
finally:
    ai_network_dag_sdk.close()
