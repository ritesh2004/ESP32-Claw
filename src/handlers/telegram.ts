const { Telegraf } = require('telegraf');
const { Queue } = require("bullmq");


const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);


// bot.on('message', (ctx: any) => {
//     console.log(ctx.message);
// });


const promptQueue = new Queue("prompt", {
    connection: {
        host: "localhost",
        port: 6379
    }
});


bot.command('prompt', async (ctx: any) => {
    console.log(ctx.message);
    await ctx.reply('Sending prompt...');

    const promptText = ctx.message.text.split("/prompt ").slice(1).join(" ");

    const job = await promptQueue.add("prompt", {
        prompt: promptText,
        chatId: ctx.chat.id
    });
});

bot.command('close', (ctx: any) => {
    ctx.reply('Closing claw!');
});

bot.launch();


process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
