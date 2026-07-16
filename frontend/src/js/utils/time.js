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