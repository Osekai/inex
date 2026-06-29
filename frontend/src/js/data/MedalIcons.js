
export class MedalIcons {
    static icons;
    static async GetIcons() {
        // return existing icons if already loaded
        if (MedalIcons.icons != null) return MedalIcons.icons;

        // prevent concurrent fetches by caching the promise itself
        if (MedalIcons._iconsPromise != null) return MedalIcons._iconsPromise;

        MedalIcons._iconsPromise = (async () => {
            const response = await fetch("/assets/medals.json.gz");
            const ds = new DecompressionStream("gzip");
            const text = await new Response(response.body.pipeThrough(ds)).text();
            return MedalIcons.icons = JSON.parse(text);
        })();

        return MedalIcons._iconsPromise;
    }
    static async GetIconWithBase(name) {
        let icons = await MedalIcons.GetIcons();
        let icon = icons["medals"][name];
        let base = icons["bases"][icon.colour];
        icon.base = base;
        console.log(icon);
        return icon;
    }
}