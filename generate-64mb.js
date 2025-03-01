const fs = require('fs');
const path = require('path');
function generateRandomString(sizeInBytes) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let randomString = '';

    for (let i = 0; i < sizeInBytes; i++) {
        randomString += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return randomString;
}


function createFile(filePath, sizeInMB) {
  const oneMB = generateRandomString(1024 * 1024); // 1MB of random string data
  const writeStream = fs.createWriteStream(filePath);

  console.log(`Creating a ${sizeInMB}MB file at: ${filePath}`);
  
  for (let i = 0; i < sizeInMB; i++) {
    writeStream.write(oneMB); // Write 1MB chunk
  }

  writeStream.end(() => {
    console.log(`File created successfully at: ${filePath}`);
  });
}

// File path and size
const filePath = path.join(__dirname, '64mb_test_file.txt');
const sizeInMB = 64;

createFile(filePath, sizeInMB);
