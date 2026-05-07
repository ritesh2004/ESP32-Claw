const supabaseClient = require("../utils/supabaseClient");

const uploadToStorage = async ({ fileName, fileBuffer, format = "text/plain" }: { fileName: string, fileBuffer: Buffer, format?: string }) => {
    console.log("Uploading file to storage...");
    const { data, error } = await supabaseClient.storage.from('ESP32_Projects').upload(fileName, fileBuffer, {
        contentType: format,
        upsert: true
    });
    if (error) {
        console.log("Error in uploading file: ", error);
        throw error;
    }
    console.log("File uploaded successfully: ", data);
    return data;
}

const downloadFromStorage = async ({ fileName }: { fileName: string }) => {
    console.log("Downloading file from storage...");
    const { data, error } = await supabaseClient.storage.from('ESP32_Projects').download(fileName);
    if (error) {
        console.log("Error in downloading file: ", error);
        throw error;
    }
    console.log("File downloaded successfully");
    return data;
}

module.exports = {
    uploadToStorage,
    downloadFromStorage
}