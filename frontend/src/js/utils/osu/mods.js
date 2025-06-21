export function GetMod(acronym) {
    for(var mod of mods) {
        if(mod.ID === acronym) return mod;
    }
}