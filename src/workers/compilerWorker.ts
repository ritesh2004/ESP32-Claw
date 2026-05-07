const { Worker, Queue } = require("bullmq");
const { downloadFromStorage } = require("../services/supabase.services");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { uploadToStorage } = require("../services/supabase.services");
const { Telegram } = require("telegraf");
const mqtt = require("mqtt");

const bot = new Telegram(process.env.TELEGRAM_BOT_TOKEN);

const mqttOptions = {
    host: process.env.MQTT_BROKER,
    port: process.env.MQTT_PORT,
    protocol: 'mqtts',
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD
}

const client = mqtt.connect(mqttOptions);

client.on("connect", () => {
    console.log("Connected to MQTT broker");
});

client.on("error", (error: any) => {
    console.log("Error in MQTT connection: ", error);
});

client.on("message", (topic: string, message: Buffer) => {
    console.log("Received message on topic ", topic, ": ", message.toString());
});

const connection = {
    host: "localhost",
    port: 6379
};

const codeCompileQueue = new Queue("code-compile", connection);

new Worker("code", async (job: any) => {
    console.log(job.data);

    const code: any = await downloadFromStorage({
        fileName: job.data.link
    });

    const PROJECT_DIR = "./esp32_project";

    const localPath = path.join(PROJECT_DIR, "main", "esp32_project.c");

    const buffer = Buffer.from(await code.arrayBuffer());

    fs.writeFileSync(localPath, buffer);

    try {
        execSync(`docker run --rm -v ${process.cwd()}/${PROJECT_DIR}:/project -w /project espressif/idf idf.py build`, {
            stdio: "inherit"
        });

        await bot.sendMessage(job.data.chatId, "Code compiled successfully");

        const binPath = path.join(PROJECT_DIR, 'build', 'esp32_project.bin')
        const binBuffer = fs.readFileSync(binPath)

        const binFileName = `bins/${job.data.chatId}_${Date.now()}.bin`;

        const data = await uploadToStorage({
            fileName: binFileName,
            fileBuffer: binBuffer,
            format: "application/octet-stream"
        });

        await bot.sendMessage(job.data.chatId, "Code uploaded to storage, code will automatically flash to your device");

        // await codeCompileQueue.add("compile", {
        //     link: binFileName,
        //     chatId: job.data.chatId
        // });

        client.publish(process.env.MQTT_TOPIC, JSON.stringify({
            "url": `${process.env.SUPABASE_PROJECT_URL}/storage/v1/object/public/${data.fullPath}`,
        }));

    } catch (error: any) {
        await bot.sendMessage(job.data.chatId, error.message);
        console.log("Error in compilation: ", error.message);
    }
}, {
    lockDuration: 1000 * 60 * 15,
    connection
});

// compilerWorker.run();