import mongoose = require("mongoose");

interface IPrompt {
    promptText: string;
    chatId: string;
}

const PromptSchema: mongoose.Schema<IPrompt> = new mongoose.Schema({
    promptText: { type: String, required: true },
    chatId: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Prompt", PromptSchema);