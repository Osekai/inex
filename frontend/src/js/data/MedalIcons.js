
export class MedalIcons {
    static icons;
    static async GetIcons() {
        if (MedalIcons.icons != null) return MedalIcons.icons;

        const response = await fetch("/assets/medals.json.gz");
        const ds = new DecompressionStream("gzip");
        const decompressed = response.body.pipeThrough(ds);
        const text = await new Response(decompressed).text();
        MedalIcons.icons = JSON.parse(text);

        console.log(MedalIcons.icons);

        return MedalIcons.icons;
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