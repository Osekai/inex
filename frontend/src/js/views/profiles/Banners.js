import {DoRequest} from "../../utils/requests";
import {D2} from "../../utils/d2";

export default class Banners {
    main;
    constructor(main) {
        this.main = main;
        this.init()
    }

    el = null;
    els = [];

    userBanners;
    availableThemes;

    async init() {
        this.el = D2.Div("banner-editor", () => {
            this.els.list = D2.Div("banner-list", () => {

            });
            this.els.preview = D2.Div("banner-preview", () => {

            });
            this.els.editor = D2.Div("banner-editor", () => {

            })
        })

        let userBanners = await DoRequest("POST", "/api/profiles/" + this.main.profile.User.id + "/banners/all");
        this.userBanners = userBanners['content'];
        let availableThemes = await DoRequest("GET", "/api/profiles/banners/themes");
        this.availableThemes = availableThemes['content'];

        for(let banner of this.userBanners) {
            let iframeOuter;
            let el = D2.Custom("button", "banner-list-item", () => {
                iframeOuter = D2.Div("banner-list-item-shadow", () => {})
                D2.Div("banner-list-item-metadata", () => {
                    D2.Text("h1", banner.data.Name)
                    D2.Text("h3", "using theme " + banner.data.Theme.Name)
                })
            })
            let iframe = document.createElement("iframe");
            iframe.srcdoc = banner.html;
            iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");

            iframeOuter.style.setProperty("--aspect", banner.data.Theme.Resolution.replace(":", "/"))

            el.addEventListener("click", () => {
                this.els.preview.innerHTML = "";
                this.els.editor.innerHTML = "";
            })

            iframeOuter.appendChild(iframe);
            this.els.list.appendChild(el);
        }

        document.getElementById("banners-outer").appendChild(this.el);
    }
}