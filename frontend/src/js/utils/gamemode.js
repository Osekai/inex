export function GamemodeToName(gamemode) {
    var names = {
        "osu": "osu!",
        "taiko": "Taiko",
        "mania": "Mania",
        "catch": "Catch",
        "fruits": "Catch",
        "all": "Any Mode"
    }
    return names[gamemode];
}