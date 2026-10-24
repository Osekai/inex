import {ArchiveData} from "./ArchiveData";
import {D2} from "../../utils/d2";
import {marked} from "marked";
import EmblaCarousel from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";
import Lightbox from "../../ui/lightbox";
import {Dropdown} from "../../ui/dropdown";

export class ArchiveUI {
    static ShowPage(page) {
        let container = document.querySelector("[otab-container='page']");
        // otabs might not be loaded yet, the default is what it'll pick up when it is
        container.setAttribute("otab-default", page);
        // on mobile the sidebar covers the page while we're home, same as medals
        container.classList.toggle("home", page == "home");
        if (typeof container.switch === "function") {
            container.switch(page, false);
        }
    }

    static ShowGroup(version) {
        let container = document.querySelector("[otab-container='sidebar']");
        let tab = "group-" + version.Group_ID;
        if (version.Published != 1) {
            tab = "unpublished";
        }
        if (typeof container.switch === "function") {
            container.switch(tab, false);
        }
    }

    static ShowHome() {
        this.ShowPage("home");
    }

    static SetHidden(id, hidden) {
        document.getElementById(id).classList.toggle("hidden", hidden);
    }

    static LoadHeader(version) {
        document.getElementById("version_name").innerText = version.Meta_Name ?? "";
        this.SetHidden("version_name", version.Meta_Name == null);
        document.getElementById("version_version").innerText = version.Version;
        document.getElementById("version_release").innerText = "released " + D2.TimeFull(ArchiveData.ReleaseDate(version), {style: "short"});
        document.getElementById("version_views").innerText = version.Analytics_Views;
        document.getElementById("version_downloads").innerText = version.Analytics_Downloads;

        let archiver = document.getElementById("version_archiver");
        archiver.innerHTML = "";
        if (version.Meta_Archiver_ID != null) {
            // same shape as the medals beatmap uploader
            archiver.appendChild(D2.DivLink("/profiles/" + version.Meta_Archiver_ID, "uploader", () => {
                D2.Image("", "https://a.ppy.sh/" + version.Meta_Archiver_ID);
                let text = D2.StyledText("h3", "archived by <strong></strong>");
                text.querySelector("strong").innerText = version.Archiver_Name ?? ("#" + version.Meta_Archiver_ID);
            }));
        } else {
            archiver.appendChild(D2.Text("h3", "archiver unknown"));
        }

        let header = document.getElementById("version_header");
        if (version.Thumbnail != null) {
            header.style.setProperty("--bg", "url(" + version.Thumbnail + ")");
        } else {
            header.style.removeProperty("--bg");
        }
    }

    // shared with the editor's download panel
    static DownloadCard(full) {
        return D2.Div("archive-download-card", () => {
            D2.LucideIcon("server");
            D2.Div("texts", () => {
                D2.Text("h3", "Download from Osekai servers");
                D2.Text("p", ArchiveData.FormatSize(full.File_Size) + " · " + full.Version + "." + full.File_Format);
            });
            let button = D2.DivLink(full.Download ?? "", "lumen-button", () => {
                D2.LucideIcon("download");
                D2.Text("span", "Download");
            });
            button.target = "_blank";
            button.addEventListener("click", () => {
                ArchiveData.Record(full.ID, "download");
            });
        });
    }

    static LoadDownloads(full) {
        // info page only has the button in the hero toolbar, the editor uses the full card
        let download = document.getElementById("version_download");
        download.innerHTML = "";
        if (full.Download != null) {
            let button = D2.DivLink(full.Download, "archive-hero-download", () => {
                D2.LucideIcon("download");
                D2.Text("span", "Download");
            });
            button.target = "_blank";
            button.setAttribute("tooltip", ArchiveData.FormatSize(full.File_Size) + " · " + full.Version + "." + full.File_Format);
            button.addEventListener("click", () => {
                ArchiveData.Record(full.ID, "download");
            });
            download.appendChild(button);
        }
        this.SetHidden("version_download", full.Download == null);

        let mirrors = document.getElementById("version_mirrors");
        mirrors.innerHTML = "";
        for (let mirror of full.Mirrors) {
            let link = D2.Link(mirror.Name, "archive-mirror", mirror.URL);
            link.target = "_blank";
            link.addEventListener("click", () => {
                ArchiveData.Record(full.ID, "download");
            });
            mirrors.appendChild(link);
        }
        this.SetHidden("version_mirrors_outer", full.Mirrors.length == 0);
    }

    // styled after eclipse's warnings
    // sits above the description, about the client not the archiver
    static Warning(title, description) {
        return D2.Div("archive-warning-box", () => {
            D2.Div("header", () => {
                D2.LucideIcon("alert-triangle");
                D2.Text("h3", title);
            });
            D2.Text("p", description);
        });
    }

    static LoadWarnings(full) {
        let warnings = document.getElementById("version_warnings");
        warnings.innerHTML = "";

        if (full.Flag_Auto_Updates == 1) {
            warnings.appendChild(this.Warning("Automatically Updated", "This client originally auto-updated. We've applied a _staging file to prevent this."));
        }
        if (full.Flag_Requires_Server == 1) {
            warnings.appendChild(this.Warning("Requires Server", "This client cannot be opened without connecting to a private server."));
        }

        this.SetHidden("version_warnings", warnings.children.length == 0);
    }

    static carousel = null;
    static carouselBound = false;

    // arrows are in the page markup, so only hook them up once and always use the current carousel
    static BindCarouselArrows() {
        if (this.carouselBound) return;
        this.carouselBound = true;

        document.getElementById("version_carousel_prev").addEventListener("click", () => {
            if (this.carousel != null) this.carousel.scrollPrev();
        });
        document.getElementById("version_carousel_next").addEventListener("click", () => {
            if (this.carousel != null) this.carousel.scrollNext();
        });
    }

    static ScreenName(screenshot, index) {
        return screenshot.Game_Screen ?? ("Screenshot " + (index + 1));
    }

    static screenDropdown = null;
    static screenDropdownEl = null;

    // clicking the caption under the carousel lists every screenshot to jump to
    static LoadScreenJump(screenshots) {
        if (this.screenDropdownEl == null) {
            this.screenDropdownEl = D2.Div("dropdown-content no-search archive-screen-dropdown", () => {
                D2.Div("dropdown-inner");
            });
            // lives next to its button, Dropdown moves it to body only while open
            // (sitting in body while closed made the whole page scroll past the end)
            let button = document.getElementById("version_screen");
            button.after(this.screenDropdownEl);
            this.screenDropdown = new Dropdown(this.screenDropdownEl, button);
        }

        let inner = this.screenDropdownEl.querySelector(".dropdown-inner");
        inner.innerHTML = "";
        screenshots.forEach((screenshot, index) => {
            let item = D2.Text("p", (index + 1) + ". " + this.ScreenName(screenshot, index));
            item.addEventListener("click", () => {
                this.carousel.scrollTo(index);
                this.screenDropdown.close();
            });
            inner.appendChild(item);
        });
    }

    static LoadScreenshots(full) {
        this.BindCarouselArrows();

        let container = document.getElementById("version_screenshots");
        let dots = document.getElementById("version_carousel_dots");
        container.innerHTML = "";
        dots.innerHTML = "";
        if (this.carousel != null) {
            this.carousel.destroy();
            this.carousel = null;
        }

        let screenshots = full.Screenshots;
        this.SetHidden("version_carousel", screenshots.length == 0);
        this.SetHidden("version_carousel_dots", screenshots.length < 2);
        this.SetHidden("version_screen", screenshots.length == 0);
        if (screenshots.length == 0) return;

        // the hero background is the first screenshot, blurred in css
        document.getElementById("version_header").style.setProperty("--bg", "url(" + screenshots[0].Full + ")");

        let items = screenshots.map(screenshot => ({
            "src": screenshot.Full,
            "thumb": screenshot.Thumb,
            "caption": screenshot.Game_Screen ?? "",
        }));

        screenshots.forEach((screenshot, index) => {
            let slide = D2.Div("archive-carousel-slide", () => {
                D2.Image("", screenshot.Thumb, null, screenshot.Game_Screen ?? "");
            });
            slide.addEventListener("click", () => {
                // side slides just bring themselves to the middle, the middle one opens the lightbox
                if (this.carousel.selectedScrollSnap() != index) {
                    this.carousel.scrollTo(index);
                    return;
                }
                Lightbox.open(items, index);
            });
            container.appendChild(slide);

            let dot = D2.Custom("button", "dot");
            dot.addEventListener("click", () => this.carousel.scrollTo(index));
            dots.appendChild(dot);
        });

        this.LoadScreenJump(screenshots);

        let viewport = document.querySelector("#version_carousel .archive-carousel-viewport");
        // same as the profiles carousel, sideways drags stay on the carousel and vertical ones scroll the page
        viewport.setAttribute("data-axis-lock", "");
        this.carousel = EmblaCarousel(viewport, {"loop": screenshots.length > 1, "align": "center"}, [
            Autoplay({"delay": 6000, "stopOnMouseEnter": true, "stopOnInteraction": false}),
        ]);

        let update = () => {
            let current = this.carousel.selectedScrollSnap();
            container.querySelectorAll(".archive-carousel-slide").forEach((slide, index) => {
                slide.classList.toggle("active", index == current);
            });
            dots.querySelectorAll(".dot").forEach((dot, index) => {
                dot.classList.toggle("active", index == current);
            });
            let screen = document.getElementById("version_screen");
            screen.innerHTML = "";
            screen.appendChild(D2.Text("span", this.ScreenName(screenshots[current], current)));
            screen.appendChild(D2.LucideIcon("chevron-down"));
            this.screenDropdownEl.querySelectorAll(".dropdown-inner p").forEach((item, index) => {
                item.classList.toggle("selected", index == current);
            });
        };
        this.carousel.on("select", update);
        update();

        // scale/fade follow the actual scroll position every frame, based on embla's tween example
        let imgs = Array.from(container.querySelectorAll(".archive-carousel-slide img"));
        let tween = () => {
            let engine = this.carousel.internalEngine();
            let progress = this.carousel.scrollProgress();
            let snaps = this.carousel.scrollSnapList();

            snaps.forEach((snap, index) => {
                let diff = snap - progress;

                // looped slides get moved to the other end, so measure from there instead
                if (engine.options.loop) {
                    for (let loopItem of engine.slideLooper.loopPoints) {
                        let target = loopItem.target();
                        if (loopItem.index != index || target == 0) continue;
                        if (Math.sign(target) == -1) diff = snap - (1 + progress);
                        if (Math.sign(target) == 1) diff = snap + (1 - progress);
                    }
                }

                // 1 in the middle, 0 a full slide or more away
                let amount = 1 - Math.min(Math.abs(diff * snaps.length), 1);
                imgs[index].style.transform = "scale(" + (0.9 + 0.1 * amount) + ")";
                imgs[index].style.opacity = 0.4 + 0.6 * amount;
            });
        };
        this.carousel.on("scroll", tween);
        this.carousel.on("reInit", tween);
        tween();
    }

    static async LoadVersion(version, record = true) {
        this.ShowPage("version");
        this.ShowGroup(version);
        this.LoadHeader(version);
        document.getElementById("main-col").scrollTop = 0;

        if (record) {
            ArchiveData.Record(version.ID, "view");
        }

        let full = await ArchiveData.GetFull(version.ID);
        // they clicked something else while it was loading
        if (ArchiveData.CurrentVersion != version.ID) return;
        if (full == null) return;

        this.Fill(full);
        // only on a real load, editor refreshes shouldn't reset comments
        document.getElementById("comments").loadComments(full.ID);

        if (this.OnFullLoaded != null) {
            this.OnFullLoaded(full);
        }
    }

    // fills the page without switching tabs or scrolling, used after the editor changes something
    static Refresh(version, full) {
        this.LoadHeader(version);
        this.Fill(full);
    }

    static Fill(full) {
        // markdown with the medal solution elements, extra info lives in here as <solution-note extra>
        let description = full.Meta_Description ?? "";
        document.getElementById("version_description").innerHTML = marked.parse(description);
        this.SetHidden("version_description_panel", description == "");

        let changelog = full.Meta_Changelog_Notes ?? "";
        document.getElementById("version_changelog").innerHTML = marked.parse(changelog);
        let changelogLink = document.getElementById("version_changelog_link");
        if (full.Meta_Changelog_Link != null) {
            changelogLink.href = full.Meta_Changelog_Link;
        }
        this.SetHidden("version_changelog_link", full.Meta_Changelog_Link == null);
        this.SetHidden("version_changelog", changelog == "");
        this.SetHidden("version_changelog_panel", changelog == "" && full.Meta_Changelog_Link == null);

        let video = document.getElementById("version_video");
        video.innerHTML = "";
        if (full.Meta_Video != null) {
            let iframe = D2.Custom("iframe", "");
            iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(full.Meta_Video);
            iframe.allowFullscreen = true;
            video.appendChild(iframe);
        }
        this.SetHidden("version_video_panel", full.Meta_Video == null);

        this.LoadDownloads(full);
        this.LoadWarnings(full);
        this.LoadScreenshots(full);
    }

    // the editor hooks in here
    static OnFullLoaded = null;
}
