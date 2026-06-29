
import {BotIO} from "../Bot/Bot.js";
import {AttachmentBuilder, EmbedBuilder} from "discord.js";
import Config from "../../config.js";
import express from 'express';
import bodyParser from "body-parser";

export default class IO {
    async Init() {
        console.log("initializing listener");

        // global error handlers to prevent crashing
        process.on('uncaughtException', (err) => {
            console.error('uncaughtException:', err);
            // optionally notify sysops here
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('unhandledRejection:', reason);
            // optionally notify sysops here
        });

        const app = express();

        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));

        // async wrapper to catch errors in async route handlers
        function asyncHandler(fn) {
            return function (req, res, next) {
                Promise.resolve(fn(req, res, next)).catch(next);
            };
        }

        app.get("/", (req, res) => {
            res.send("Hello World!");
        });

        function SetInfo(embed, data, extendedData = false) {
            console.log("!!!");
            console.log(data);
            console.log(data.post.Images);
            let ratingColours = [
                "#3DED6B", // safe      (r0) — hsl(140.5, 85.6%, 53.7%)
                "#EDE03D", // suggestive (r1) — hsl(57.6,  85.6%, 53.7%)
                "#ED8E3D", // mature     (r2) — hsl(28.8,  85.6%, 53.7%)
                "#ED3D3D", // explicit   (r3) — hsl(0,     85.6%, 53.7%)
            ];

            embed
                .setTitle(`${data.user.Name} (@${data.user.Tag}) [${data.user.ID}]`)
                .setURL(Config.phpConfig.URL + "/post/" + data.post.ID)
                .setDescription(`New post!`)
                .setColor(ratingColours[data.post.Rating])

            if(data.post.Images.length > 0) {
                console.log(data.post.Images[0].Links.thumbnail);
                embed.setImage(data.post.Images[0].Links.thumbnail);
            }

            embed.addFields(
                { name: "Type", value: data.post.Type || "N/A", inline: true },
                { name: "Rating", value: data.post.Rating?.toString() || "N/A", inline: true },
                { name: "Creator Tag", value: data.user.Tag || "N/A", inline: true }
            );



            if (extendedData) {
                embed.addFields(
                    { name: "Name", value: data.post.Name || "N/A", inline: true },
                    { name: "Category", value: data.post.ArtCategory?.toString() || "N/A", inline: true }
                );

                if (Array.isArray(data.post.Authors) && data.post.Authors.length) {
                    const authorsList = data.post.Authors.map(a => a.Name).join(", ");
                    embed.addFields({ name: "Authors", value: authorsList, inline: false });
                }
            }

            return embed;
        }



        app.post("/comment", asyncHandler(async (req, res) => {
            const data = req.body;
            console.log("got data for comment", data);
            const { comment, user, url, title } = data;

            const userUrl = `https://osu.ppy.sh/users/${user.id}`;
            const postUrl = `https://inex.osekai.net${url}`;

            const embed = new EmbedBuilder()
                .setTitle("💬 New Comment on " + title)
                .setURL(postUrl)
                .setDescription(comment.Text)
                .addFields(
                    { name: "Author", value: `[${user.username}](${userUrl}) (\`${user.id}\`)`, inline: true },
                    { name: "Post", value: `[${url}](${postUrl})`, inline: true },
                    { name: "Posted At", value: `<t:${Math.floor(new Date(comment.Date).getTime() / 1000)}:R>`, inline: true },
                )
                .setFooter({ text: `Comment #${comment.ID} on target #${comment.Target_ID}` })
                .setTimestamp(new Date(comment.Date))
                .setColor(0xFF2335);

            await BotIO.GetChannel("comments").send({ embeds: [embed] });
            res.sendStatus(200);
        }));



        app.post("/feedback/bug", asyncHandler(async (req, res) => {
            const data = req.body;

            const issueTitle = encodeURIComponent(`[${data.Type}] ${data.Problem?.slice(0, 80) || "Bug report"}`);
            const issueBody = encodeURIComponent(
                `## Problem\n${data.Problem || "N/A"}\n\n` +
                `## Steps to Reproduce\n${data.Reproduce || "N/A"}\n\n` +
                `## Expected Behaviour\n${data.Expected || "N/A"}\n\n` +
                `## Meta\n` +
                `- **URL:** ${data.Url || "N/A"}\n` +
                `- **Viewport:** ${data.Viewport || "N/A"}\n` +
                `- **Priority:** ${data.Priority || "N/A"}\n` +
                `- **User Agent:** ${data.UserAgent || "N/A"}`
            );
            const issueLabels = encodeURIComponent("bug");
            const githubUrl = `https://github.com/osekai/inex/issues/new?title=${issueTitle}&body=${issueBody}&labels=${issueLabels}`;

            const embed = new EmbedBuilder()
                .setTitle("🐛 Bug Report in " + data.TypeReadable + " from " + data.UserData.username)
                .setDescription(`**Problem**\n${data.Problem || "N/A"}`)
                .addFields(
                    { name: "Type", value: data.Type || "N/A", inline: true },
                    { name: "Priority", value: data.Priority || "N/A", inline: true },
                    { name: "Reproduce", value: data.Reproduce || "N/A", inline: false },
                    { name: "Expected", value: data.Expected || "N/A", inline: false },
                    { name: "URL", value: data.Url || "N/A", inline: true },
                    { name: "Viewport", value: data.Viewport || "N/A", inline: true },
                    { name: "Screen", value: data.Screen || "N/A", inline: true },
                    { name: "GitHub Issue", value: `[Create Issue](${githubUrl})`, inline: true },
                    { name: "Creator", value: `[${data.UserData.username}](https://osu.ppu.sh/users/${data.UserData.id})`, inline: true }
                )
                .setFooter({ text: data.UserAgent || "N/A" })
                .setTimestamp()
                .setThumbnail("https://a.ppy.sh/" + data.UserData.id)
                .setColor(0xFF2335);

            setTimeout(async () => {
                await BotIO.GetChannel("bugs").send({ embeds: [embed] });
            }, 1000)
            res.sendStatus(200);
        }));

        app.post("/feedback/feedback", asyncHandler(async (req, res) => {
            const data = req.body;

            const stars = data.Rating > 0
                ? "★".repeat(Math.floor(data.Rating)) + (data.Rating % 1 >= 0.5 ? "½" : "") + "☆".repeat(5 - Math.ceil(data.Rating))
                : "No rating";

            const priorityColours = {
                low: 0x6B9EED,
                medium: 0xEDE03D,
                high: 0xED8E3D,
                critical: 0xED3D3D,
            };

            console.log(data);

            const embed = new EmbedBuilder()
                .setTitle("💬 Feedback for " + data.TypeReadable + " from " + data.UserData.username)
                .setDescription(data.Feedback || "N/A")
                .addFields(
                    { name: "Type", value: data.Type || "N/A", inline: true },
                    { name: "Priority", value: data.Priority || "N/A", inline: true },
                    { name: "Rating", value: stars, inline: true },
                    { name: "Submitted", value: `<t:${Math.floor(new Date(data.Timestamp).getTime() / 1000)}:R>`, inline: true },
                    { name: "Creator", value: `[${data.UserData.username}](https://osu.ppu.sh/users/${data.UserData.id})`, inline: true }
                )
                .setTimestamp()
                .setThumbnail("https://a.ppy.sh/" + data.UserData.id)
                .setColor(priorityColours[data.Priority?.toLowerCase()] ?? 0xFF2335);

            setTimeout(async () => {
                await BotIO.GetChannel("feedback").send({ embeds: [embed] });
            }, 1000)
            res.sendStatus(200);
        }));

        app.post("/sysops/alert", asyncHandler(async (req, res) => {
            const data = req.body;
            const embed = new EmbedBuilder().setTitle(`${data.title}`).setDescription(data.description);
            await BotIO.GetChannel("sysops").send({ embeds: [embed] });
            res.send("ok");
        }));

        app.get('*', asyncHandler(async (req, res) => {
            const embed = new EmbedBuilder().setTitle('Unknown route').setDescription(req.originalUrl);
            await BotIO.GetChannel("sysops").send({ embeds: [embed] });
            res.status(404).send("Not found");
        }));

        // error handler middleware for Express
        app.use((err, req, res, next) => {
            console.error('express error:', err);
            if (!res.headersSent) {
                res.status(500).send('Internal server error');
            }
        });

        app.listen(13416, '127.0.0.1', () => {
            console.log(`ampra for inex listening`);
        }).on("error", (err) => {
            console.error("Server error:", err);
        });
    }
}
