from AINetworkDagSdk import AINetworkDagSdk

server_address = "localhost:50051"
ai_network_dag_sdk = AINetworkDagSdk(server_address)

def downloadFiles(cid_file_path, output_dir):
    try:
        with open(cid_file_path, "r") as cid_file:
            cids = cid_file.readlines()

        for index, cid in enumerate(cids):
            cid = cid.strip()
            if not cid:
                continue

            print(f"Downloading file with CID: {cid}")
            try:
                root_response = ai_network_dag_sdk.get(cid)
                file_name = root_response.message  # Original file name
                output_path = f"{output_dir}/{file_name}"

                ai_network_dag_sdk.downloadFile(cid, output_path)
                print(f"Downloaded file saved to: {output_path}")
            except Exception as e:
                print(f"Failed to download file with CID {cid}: {e}")
    finally:
        ai_network_dag_sdk.close()

# Usage
cid_file_path = "cids.txt"  # Path to the file containing the CIDs
output_dir = "downloads"    # Directory where downloaded files will be saved

# Create output directory if it doesn't exist
import os
os.makedirs(output_dir, exist_ok=True)

downloadFiles(cid_file_path, output_dir)
