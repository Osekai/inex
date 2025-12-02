export function TimeTransform_MM_SS(time) {
    var minutes = Math.floor(time / 60);
    var seconds = time % 60;

    if(seconds < 10) {
        seconds = "0" + seconds;
    }
    return minutes + ":" + seconds;
}