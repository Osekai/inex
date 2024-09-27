export function parseBoolean(str) {
    if(typeof(str) == "boolean") return str;
    if(str === "true") return true;
    if(str === "false") return false;

    return false;
}