export function TimeTransform_MM_SS(time) {
    var minutes = Math.floor(time / 60);
    var seconds = time % 60;

    if(seconds < 10) {
        seconds = "0" + seconds;
    }
    return minutes + ":" + seconds;
}

export function UTCify(date) {
    // avoid double-appending Z if the string is already ISO-formatted
    if (date.includes("T") || date.endsWith("Z")) return new Date(date);
    return new Date(date.replace(" ", "T") + "Z");
}

export function formatPlayTime(minutes) {
    const totalMinutes = Math.round(minutes);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const mins = totalMinutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
    if (mins > 0 || parts.length === 0) parts.push(`${mins} minute${mins !== 1 ? "s" : ""}`);

    return parts.join(", ");
}