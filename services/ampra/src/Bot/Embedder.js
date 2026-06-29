
import {Embed, EmbedBuilder, Message} from "discord.js";

export class Embedder {
    embedText = "";
    embed = null;
    emessage = null;
    constructor() {

    }
    async Create(data) {
        this.embed = new EmbedBuilder();
        data.embedder = this;

        this.embed.setTitle("Running " + data.args[0])
        this.embed.setDescription("...");

        this.emessage = await data.message.reply({ embeds: [this.embed] });
    }

    async Update(line, override = false, colour = 0xFFFFFF) {
        if(override) this.embedText = "";
        this.embedText += "\n";
        this.embedText += line;
        this.embed.setDescription(this.embedText);
        this.embed.setColor(colour);
        if(line == "Done!") {
            this.embed.setColor(0x0000FF);
        }
        await this.emessage.edit({ embeds: [this.embed] });
    }
}