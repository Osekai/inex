// guesses which game screen a screenshot is with ocr, tesseract only loads when this actually runs

// webpack emits these as-is into dist/tesseract (see webpack.config.js)
const WORKER_PATH = new URL("../../../../node_modules/tesseract.js/dist/worker.min.js", import.meta.url).href;
const CORE_PATHS = [
    new URL("../../../../node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js", import.meta.url).href,
    new URL("../../../../node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js", import.meta.url).href,
    new URL("../../../../node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js", import.meta.url).href,
];
const LANG_FILE = new URL("../../../../node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", import.meta.url).href;

// anything from the bottom of the settings menu, ocr often mangles one or two of them
const SETTINGS_PHRASES = [
    "Delete all unranked maps",
    "all unranked maps",
    "Repair folder permissions",
    "Mark all maps as played",
    "Run osu! updater",
    "Chat ignore list",
    "Chat highlight words",
    "Block private messages",
    // older options screen (2014 era)
    "Change the way osu! behaves",
    "Detail Settings",
    "Screen Resolution",
    "Frame Limiter",
    "Select Language",
];

// older song selects don't have "By Difficulty"
const SONG_SELECT_PHRASES = [
    "By Difficulty",
    "Local Ranking",
    "Selection Options",
];

// older main menus don't have "ppy powered"
const MAIN_MENU_PHRASES = [
    "ppy powered",
    "online facilities",
    "join osu! chat",
];

export class SnapshotsOCR {
    static MAX_WORKERS = 4;
    static scheduler = null;

    // a few workers sharing one queue, so screenshots get read in parallel
    static async GetScheduler(workers) {
        if (this.scheduler != null) return this.scheduler;

        const Tesseract = await import("tesseract.js");
        let folder = CORE_PATHS[0].substring(0, CORE_PATHS[0].lastIndexOf("/") + 1);

        let scheduler = Tesseract.createScheduler();
        let created = [];
        for (let i = 0; i < workers; i++) {
            created.push(Tesseract.createWorker("eng", 1, {
                workerPath: WORKER_PATH,
                // tesseract picks the right core from this folder for the device
                corePath: folder,
                langPath: LANG_FILE.substring(0, LANG_FILE.lastIndexOf("/") + 1),
                workerBlobURL: false,
            }));
        }
        for (let worker of await Promise.all(created)) {
            scheduler.addWorker(worker);
        }

        this.scheduler = scheduler;
        return this.scheduler;
    }

    static async Terminate() {
        if (this.scheduler == null) return;
        await this.scheduler.terminate();
        this.scheduler = null;
    }

    // ocr mangles spacing and punctuation, so compare letters and numbers only
    static Squash(text) {
        return text.toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    static Has(squashed, phrase) {
        return squashed.includes(this.Squash(phrase));
    }

    static Classify(text) {
        let squashed = this.Squash(text);
        let lower = text.toLowerCase();

        // settings can sit on top of anything, so it wins
        for (let phrase of SETTINGS_PHRASES) {
            if (this.Has(squashed, phrase)) return "Settings Menu";
        }

        for (let phrase of SONG_SELECT_PHRASES) {
            if (this.Has(squashed, phrase)) return "Song Select";
        }
        if (this.Has(squashed, "Mapped by") && this.Has(squashed, "BPM")) return "Song Select";

        for (let phrase of MAIN_MENU_PHRASES) {
            if (this.Has(squashed, phrase)) {
                if (this.Has(squashed, "beatmaps available")) return "Main Menu Opened";
                return "Main Menu";
            }
        }

        if (this.Has(squashed, "Watch Replay")) return "Score Results";

        // last guess before giving up
        if (/\bauto\b/.test(lower)) return "Gameplay";
        if (this.Has(squashed, "UNRANKED")) return "Gameplay";
        if (/\d{1,3}[.,]\d{2}\s*%/.test(text)) return "Gameplay";

        return null;
    }

    // returns guesses in the same order as screenshots, onDone fires as each one finishes
    static async GuessAll(screenshots, onDone = null) {
        let workers = Math.min(this.MAX_WORKERS, screenshots.length);
        let scheduler = await this.GetScheduler(workers);

        let done = 0;
        let jobs = screenshots.map(async (screenshot) => {
            let guess = await this.Guess(scheduler, screenshot);
            done++;
            if (onDone != null) onDone(done);
            return guess;
        });
        return await Promise.all(jobs);
    }

    // greyscale (and upscale small ones) first, white text on osu! blue reads way better that way
    static async Prepare(url) {
        let img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        await img.decode();

        let scale = 1;
        if (img.naturalWidth < 2000) {
            scale = 2000 / img.naturalWidth;
        }

        let canvas = document.createElement("canvas");
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        let ctx = canvas.getContext("2d");
        ctx.filter = "grayscale(1)";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas;
    }

    static async Guess(scheduler, screenshot) {
        let canvas = await this.Prepare(screenshot.Full);
        let result = await scheduler.addJob("recognize", canvas);
        let text = result.data.text;
        let guess = this.Classify(text);

        // so we can tune the rules when it gets things wrong
        console.log("[snapshots ocr] screenshot " + screenshot.ID + " -> " + (guess ?? "no idea"), {
            "screenshot": screenshot,
            "guess": guess,
            "confidence": result.data.confidence,
            "text": text,
        });

        return guess;
    }
}
