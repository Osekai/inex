import {ArchiveData} from "./ArchiveData";
import {SetVersion} from "../archive";
import {D2} from "../../utils/d2";
import {marked} from "marked";
import EmblaCarousel from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";

export class ArchiveHome {
    static carousel = null;

    static Published() {
        return ArchiveData.GetVersionsSync().filter(version => version.Published == 1);
    }

    static SetHidden(id, hidden) {
        document.getElementById(id).classList.toggle("hidden", hidden);
    }

    // a link so middle click works, normal clicks stay on the page
    static VersionLink(version, className, children) {
        let link = D2.DivLink("/archive/" + version.ID, className, children);
        link.addEventListener("click", (e) => {
            if (e.ctrlKey || e.metaKey || e.button == 1) return;
            e.preventDefault();
            SetVersion(version.ID, true, true);
        });
        return link;
    }

    // same shape as the profiles home rows
    static Row(version, small, rank = null) {
        return this.VersionLink(version, "archive-row", () => {
            if (rank != null) D2.Text("span", "#" + rank, "archive-row-rank");
            if (version.Thumbnail != null) {
                D2.Image("", version.Thumbnail, null, version.Version);
            } else {
                D2.Div("thumb-placeholder");
            }
            let name = version.Version;
            if (version.Meta_Name != null) name = version.Meta_Name + " " + version.Version;
            D2.Text("p", name);
            D2.Text("small", small);
        });
    }

    static LoadStats() {
        let versions = this.Published();

        let downloads = 0;
        let archivers = new Set();
        let oldest = null;
        for (let version of versions) {
            downloads += parseInt(version.Analytics_Downloads) || 0;
            if (version.Meta_Archiver_ID != null) archivers.add(version.Meta_Archiver_ID);
            let year = ArchiveData.ReleaseDate(version).getFullYear();
            if (oldest == null || year < oldest) oldest = year;
        }

        let subtitle = document.getElementById("home_subtitle");
        subtitle.innerHTML = "";
        subtitle.appendChild(D2.StyledText("span", "archiving <strong>" + versions.length + "</strong> osu! versions from " + (oldest ?? 2007) + " to now"));

        let stats = [
            [versions.length.toLocaleString(), "versions archived"],
            [downloads.toLocaleString(), "downloads"],
            [archivers.size.toLocaleString(), "archivers"],
            [oldest ?? "-", "oldest version"],
        ];

        let outer = document.getElementById("home_stats");
        outer.innerHTML = "";
        for (let [value, label] of stats) {
            outer.appendChild(D2.Div("archive-home-stat", () => {
                D2.Text("h1", value);
                D2.Text("p", label);
            }));
        }
    }

    static LoadRecent() {
        let versions = this.Published().filter(version => version.Meta_Archival_Date != null);
        versions.sort((a, b) => new Date(b.Meta_Archival_Date) - new Date(a.Meta_Archival_Date));

        let outer = document.getElementById("home_recent");
        outer.innerHTML = "";
        for (let version of versions.slice(0, 8)) {
            outer.appendChild(this.Row(version, D2.TimeRelative(version.Meta_Archival_Date)));
        }
        this.SetHidden("home_recent_panel", versions.length == 0);
    }

    static LoadOnThisDay() {
        let today = new Date();
        let versions = this.Published().filter(version => {
            let date = ArchiveData.ReleaseDate(version);
            return date.getMonth() == today.getMonth() && date.getDate() == today.getDate() && date.getFullYear() != today.getFullYear();
        });
        versions.sort((a, b) => ArchiveData.ReleaseDate(a) - ArchiveData.ReleaseDate(b));

        let outer = document.getElementById("home_today");
        outer.innerHTML = "";
        for (let version of versions) {
            let years = today.getFullYear() - ArchiveData.ReleaseDate(version).getFullYear();
            let text = years + " years ago";
            if (years == 1) text = "1 year ago";
            outer.appendChild(this.Row(version, text));
        }
        this.SetHidden("home_today_panel", versions.length == 0);
    }

    static LoadPopular() {
        let versions = [...this.Published()];
        versions.sort((a, b) => (parseInt(b.Analytics_Downloads) || 0) - (parseInt(a.Analytics_Downloads) || 0));

        let outer = document.getElementById("home_popular");
        outer.innerHTML = "";
        versions.slice(0, 5).forEach((version, index) => {
            let downloads = (parseInt(version.Analytics_Downloads) || 0).toLocaleString();
            outer.appendChild(this.Row(version, downloads + " downloads", index + 1));
        });
        this.SetHidden("home_popular_panel", versions.length == 0);
    }

    // steam store style, screenshots + title on the left, staff blurb on the right
    static FeatureCard(feature) {
        let version = {"ID": feature.Version_ID};
        let shots = feature.Screenshots;

        return D2.Div("archive-featured-slide", () => {
            D2.Div("panel archive-feature", () => {
                D2.Div("media", () => {
                    if (shots.length > 0) {
                        this.VersionLink(version, "big", () => {
                            D2.Image("", shots[0].Full, null, shots[0].Game_Screen ?? "");
                        });
                    }
                    if (shots.length > 1) {
                        D2.Div("small", () => {
                            for (let shot of shots.slice(1, 3)) {
                                this.VersionLink(version, "", () => {
                                    D2.Image("", shot.Thumb, null, shot.Game_Screen ?? "");
                                });
                            }
                        });
                    }
                });
                D2.Div("text", () => {
                    D2.Div("title", () => {
                        if (feature.Meta_Name != null) D2.Text("h1", feature.Meta_Name);
                        D2.Text("h2", feature.Version);
                        let line = "released " + D2.TimeFull(ArchiveData.ReleaseDate(feature), {style: "short"});
                        if (feature.Archiver_Name != null) line += " · archived by " + feature.Archiver_Name;
                        D2.Text("h3", line);
                    });
                    D2.Div("divider");
                    let description = D2.Div("description");
                    description.innerHTML = marked.parse(feature.Description);
                    this.VersionLink(version, "button cta pill-button", () => {
                        D2.Text("span", "View this version!");
                    });
                });
            });
        });
    }

    static LoadFeatured() {
        let features = [];
        if (typeof (archive_featured_preload) !== "undefined") {
            features = archive_featured_preload['content'];
        }

        let outer = document.getElementById("home_featured");
        outer.innerHTML = "";
        if (this.carousel != null) {
            this.carousel.destroy();
            this.carousel = null;
        }
        this.SetHidden("home_featured", features.length == 0);
        if (features.length == 0) return;

        // embla needs enough slides to fill both sides before it can loop, so repeat short lists
        let slidesData = [...features];
        if (features.length > 1) {
            while (slidesData.length < 4) {
                slidesData = slidesData.concat(features);
            }
        }

        // blurred screenshot of whatever's in the middle, behind everything
        let backdrop = D2.Div("archive-featured-backdrop");
        outer.appendChild(backdrop);

        let viewport = D2.Div("archive-featured-viewport");
        // same as the profiles carousel, sideways drags stay on the carousel and vertical ones scroll the page
        viewport.setAttribute("data-axis-lock", "");
        let container = D2.Div("archive-featured-container");
        viewport.appendChild(container);
        for (let feature of slidesData) {
            container.appendChild(this.FeatureCard(feature));
        }
        outer.appendChild(viewport);

        let setBackdrop = (feature) => {
            if (feature.Screenshots.length > 0) {
                backdrop.style.setProperty("--bg", "url(" + feature.Screenshots[0].Full + ")");
            }
        };

        if (features.length == 1) {
            outer.classList.add("single");
            container.querySelector(".archive-featured-slide").classList.add("active");
            setBackdrop(features[0]);
            return;
        }
        outer.classList.remove("single");

        let prev = D2.Custom("button", "archive-featured-arrow prev", () => {
            D2.LucideIcon("chevron-left");
        });
        let next = D2.Custom("button", "archive-featured-arrow next", () => {
            D2.LucideIcon("chevron-right");
        });
        outer.appendChild(prev);
        outer.appendChild(next);

        // containScroll off or embla pins the first slide to the left instead of centring it
        this.carousel = EmblaCarousel(viewport, {"loop": true, "align": "center", "containScroll": false}, [
            Autoplay({"delay": 9000, "stopOnMouseEnter": true, "stopOnInteraction": false}),
        ]);
        prev.addEventListener("click", () => this.carousel.scrollPrev());
        next.addEventListener("click", () => this.carousel.scrollNext());

        // the ones peeking in from the sides just scroll over instead of opening
        let slides = Array.from(container.querySelectorAll(".archive-featured-slide"));
        slides.forEach((slide, index) => {
            slide.addEventListener("click", (e) => {
                if (this.carousel.selectedScrollSnap() == index) return;
                e.preventDefault();
                e.stopPropagation();
                this.carousel.scrollTo(index);
            }, true);
        });

        let update = () => {
            let current = this.carousel.selectedScrollSnap();
            slides.forEach((slide, index) => {
                slide.classList.toggle("active", index == current);
            });
            setBackdrop(slidesData[current]);
        };
        this.carousel.on("select", update);
        update();
    }

    static Load() {
        this.LoadStats();
        this.LoadFeatured();
        this.LoadRecent();
        this.LoadOnThisDay();
        this.LoadPopular();
    }
}
