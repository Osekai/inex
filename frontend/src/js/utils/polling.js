export class Polling {
    lastRun = 0;
    running = false;

    constructor(seconds, callback) {
        this.interval = seconds * 1000;
        this.callback = callback;

        this.onVisible = () => this.autoRun();
        document.addEventListener("visibilitychange", this.onVisible);

        // check often enough that short intervals still work
        this.timer = setInterval(() => this.autoRun(), Math.min(30_000, this.interval));
        this.forceRun();
    }

    autoRun() {
        if (document.hidden) return;
        if (Date.now() - this.lastRun < this.interval) return;
        this.forceRun();
    }

    async forceRun() {
        if (this.running) return;
        this.running = true;
        try {
            await this.callback();
            this.lastRun = Date.now();
        } catch (e) {
            console.error(e);
        } finally {
            this.running = false;
        }
    }

    destroy() {
        clearInterval(this.timer);
        document.removeEventListener("visibilitychange", this.onVisible);
    }
}