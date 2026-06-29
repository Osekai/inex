// heavily ported from https://github.com/anthera-art/web/blob/main/frontend/src/js/elements/feedback-button.js

import {LoaderOverlay} from "../ui/loader-overlay";
import {D2} from "../utils/d2";
import {Overlay} from "../ui/overlay";
import {DoRequest, DoRequestWithFile} from "../utils/requests";

import "../../css/layout/bug-reporter.css"

async function Bug(type, readableType) {
    let extraInfo = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        screen: `${screen.width}x${screen.height}`,
        devicePixelRatio: window.devicePixelRatio,
        colorDepth: screen.colorDepth,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        memory: navigator.deviceMemory ?? null,
        cores: navigator.hardwareConcurrency ?? null,
        online: navigator.onLine
    }
    let describeInput, reproduceInput, expectedInput, submitButton, cancelButton;
    let inner = D2.Div("basic-modal bug-report-modal");
    let overlay = new Overlay(inner);

    inner.appendChild(D2.Text("h1", "Report a bug with " + readableType));

    inner.appendChild(D2.Text("h2", "Please describe the bug in as much detail as possible"));

    inner.appendChild(D2.Div("input-with-text slide", () => {
        D2.Text("p", "What's the problem?");
        describeInput = D2.TextArea("");
    }));
    inner.appendChild(D2.Div("input-with-text slide", () => {
        D2.Text("p", "What steps can you take to reproduce the bug? (Optional)");
        reproduceInput = D2.TextArea("");
    }));
    inner.appendChild(D2.Div("input-with-text slide", () => {
        D2.Text("p", "What do you expect to happen? (Optional)");
        expectedInput = D2.TextArea("");
    }));



    inner.appendChild(D2.Div("input-with-text", () => {
        D2.Text("p", "Priority");
        D2.Fieldset("priority-selector", (self) => {
            for (const [value, icon, label] of [
                [
                    "low",
                    "arrow-down",
                    "Low"
                ],
                [
                    "medium",
                    "minus",
                    "Medium"
                ],
                [
                    "high",
                    "arrow-up",
                    "High"
                ],
                [
                    "critical",
                    "circle-alert",
                    "Critical"
                ],
            ]) {
                const id = `priority-${value}`;
                const div = document.createElement("div");
                const input = document.createElement("input");
                input.type = "radio";
                input.name = "bug-priority";
                input.value = value;
                input.id = id;
                if (value === "medium") input.checked = true;

                const lbl = D2.Label(id, () => {
                    D2.LucideIcon(icon);
                    D2.Text("span", label);
                });

                div.appendChild(input);
                div.appendChild(lbl);
                self.appendChild(div);
            }
        });
    }));

    let info = D2.Text("p", "Sending this report will include information about your browser, OS, and device.", "info-text")
    let viewInfo = D2.Text("span", "Click here to view what information is sent.")
    info.appendChild(viewInfo)
    viewInfo.addEventListener("click", () => {
        let infoContainer = D2.Div("basic-modal report-info-modal");
        let overlay = new Overlay(infoContainer);
        infoContainer.appendChild(D2.Text("h1", "Information sent with bug reports"));
        infoContainer.appendChild(D2.Text("h3", "This information is sent to help us debug and fix bugs. It does not include any personal information."));
        infoContainer.appendChild(D2.Text("p", "The following information is sent:"));
        let infoItems = D2.Div("info-items");
        for (const [key, value] of Object.entries(extraInfo)) {
            infoItems.appendChild(D2.Text("p", `${key}: ${value}`));
        }
        infoContainer.appendChild(infoItems);
        infoContainer.appendChild(D2.Text("p", "We also record which user reported the bug."));
        let ok = D2.Button("OK", "cta");
        ok.addEventListener("click", () => {
            overlay.remove();
        })
        infoContainer.appendChild(ok);
    })
    inner.appendChild(info);

    inner.appendChild(D2.Div("button-row", () => {
        submitButton = D2.Button("Submit", "cta");
        cancelButton = D2.Button("Cancel");
    }))

    inner.appendChild(D2.Text("p", "We might try get in contact through Discord, e-mail, or other methods if we need more information or have updates for this issue!", "contact-text"));

    cancelButton.addEventListener("click", () => {
        overlay.remove();
    })
    submitButton.addEventListener("click", async () => {
        let loader = new LoaderOverlay("Sending bug report");
        let priority = inner.querySelector('input[name="bug-priority"]:checked')?.value ?? "medium";

        try {
            await DoRequest("POST", "/api/feedback/bug", {
                problem: describeInput.value,
                reproduce: reproduceInput.value,
                expected: expectedInput.value,
                priority,
                type,
                readableType,
                timestamp: new Date().toISOString(),
                ...extraInfo
            });
        } catch {
            loader.remove();
            inner.innerHTML = "";
            inner.appendChild(D2.Text("h1", "Error sending bug report"));
            inner.appendChild(D2.Text("p", "There was an error sending your bug report. Please try again later."));
            let close = D2.Button("Close", "cta");
            close.addEventListener("click", () => {
                overlay.remove();
            })
            inner.appendChild(close);
            return;
        }
        loader.remove();

        inner.innerHTML = "";
        inner.appendChild(D2.Text("h1", "Bug report sent!"));
        inner.appendChild(D2.Text("p", "Thank you for your feedback!"));
        let close = D2.Button("Close", "cta");
        close.addEventListener("click", () => {
            overlay.remove();
        })
        inner.appendChild(close);
    })
}

async function Feedback(type, readableType) {
    let inner = D2.Div("basic-modal bug-report-modal");
    let overlay = new Overlay(inner);
    let feedbackField, stars, submitButton, cancelButton;

    inner.appendChild(D2.Text("h1", "Give feedback about " + readableType));
    inner.appendChild(D2.Text("h2", "Got ideas for a feature that could go here, a way to improve the ui, or just want to say hi? We'd love to hear from you!"));

    inner.appendChild(D2.Div("input-with-text", () => {
        D2.Text("p", "How was your experience using " + readableType + "?");
        stars = document.createElement("star-rating");
        stars.setAttribute("half", "");
        stars.style.setProperty("--scale", "2");
        D2._currentParent.appendChild(stars);
    }));

    inner.appendChild(D2.Div("input-with-text", () => {
        D2.Text("p", "Suggestion / Feedback");
        feedbackField = D2.TextArea("What's your idea?");
    }));

    inner.appendChild(D2.Div("input-with-text", () => {
        D2.Text("p", "How important is this to you?");
        D2.Fieldset("priority-selector", (self) => {
            for (const [value, icon, label] of [
                [
                    "low",
                    "arrow-down",
                    "Low"
                ],
                [
                    "medium",
                    "minus",
                    "Medium"
                ],
                [
                    "high",
                    "arrow-up",
                    "High"
                ],
                [
                    "critical",
                    "circle-alert",
                    "Critical"
                ],
            ]) {
                const id = `feedback-priority-${value}`;
                const div = document.createElement("div");
                const input = document.createElement("input");
                input.type = "radio";
                input.name = "feedback-priority";
                input.value = value;
                input.id = id;
                if (value === "medium") input.checked = true;
                const lbl = D2.Label(id, () => {
                    D2.LucideIcon(icon);
                    D2.Text("span", label);
                });
                div.appendChild(input);
                div.appendChild(lbl);
                self.appendChild(div);
            }
        });
    }));



    inner.appendChild(D2.Div("button-row", () => {
        submitButton = D2.Button("Submit", "cta");
        cancelButton = D2.Button("Cancel");
    }));

    inner.appendChild(D2.Text("p", "We might try get in contact through Discord, e-mail, or other methods if we need more information or have updates for this!", "contact-text"));

    cancelButton.addEventListener("click", () => {
        overlay.remove();
    });

    submitButton.addEventListener("click", async () => {
        let loader = new LoaderOverlay("Sending feedback");
        let priority = inner.querySelector('input[name="feedback-priority"]:checked')?.value ?? "medium";
        let extraInfo = {};
        await DoRequestWithFile("POST", "/api/feedback/feedback", {
            feedback: feedbackField.value,
            rating: stars.rating,
            priority,
            type,
            readableType,
            timestamp: new Date().toISOString(),
            ...extraInfo
        });
        loader.remove();

        inner.innerHTML = "";
        inner.appendChild(D2.Text("h1", "Feedback sent!"));
        inner.appendChild(D2.Text("p", "Thank you for your feedback!"));
        let close = D2.Button("Close", "cta");
        close.addEventListener("click", () => {
            overlay.remove();
        });
        inner.appendChild(close);
    });
}


function ReportOverlay(cb, type = "bug") {
    console.log("Like a ghost, I fled the scene\n");

    let boxes = [];
    let placer, selectedText;
    let selectedSection = null;

    const svgNS = "http://www.w3.org/2000/svg";
    let svg = document.createElementNS(svgNS, "svg");
    svg.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:9999;pointer-events:none";

    let defs = document.createElementNS(svgNS, "defs");
    let mask = document.createElementNS(svgNS, "mask");
    mask.setAttribute("id", "bug-report-mask");

    let maskBase = document.createElementNS(svgNS, "rect");
    maskBase.setAttribute("width", "100%");
    maskBase.setAttribute("height", "100%");
    maskBase.setAttribute("fill", "white");
    mask.appendChild(maskBase);
    defs.appendChild(mask);
    svg.appendChild(defs);

    let backdrop = document.createElementNS(svgNS, "rect");
    backdrop.setAttribute("width", "100%");
    backdrop.setAttribute("height", "100%");
    backdrop.setAttribute("fill", "rgba(0,0,0,0.7)");
    backdrop.setAttribute("mask", "url(#bug-report-mask)");
    svg.appendChild(backdrop);



    let overlay = D2.Div("bug-report-overlay", () => {
        placer = D2.Div("bug-report-overlay-placer", () => {});
        D2.Div("bug-report-overlay-inner", () => {
            D2.Text("h1", type == "bug" ? "Report a bug" : "Give feedback");
            if(type == "bug") {
                D2.Text("p", "Please select a section of the page to report a bug on! If you can't, just submit with 'None' and try explain.");
            } else {
                D2.Text("p", "Please select a section of the page to give feedback on! If you can't, just submit with 'None' and try explain!");
            }
            D2.Div("selected", () => {
                D2.Text("p", "Currently Selected");
                selectedText = D2.Text("h3", "None");
            })
            D2.Div("button-row", () => {
                D2.Button("Cancel", "", () => {
                    cancel();
                })
                D2.Button("Continue", "cta", () => {
                    submit()
                })
            })
        });
    });

    let cancel = () => {
        for (let box of boxes) {
            box.box.remove();
            box.maskRect.remove();
        }
        clearInterval(loop);
        document.body.removeChild(overlay);
    }
    let submit = () => {
        let section = "none";
        let readableSection = "None";

        if(selectedSection) {
            section = selectedSection.name;
            readableSection = selectedSection.readableName;
        }

        cb(section, readableSection);
        cancel();
    }



    let sections = document.querySelectorAll("[bug]");

    let offset = 0.2;
    for (let section of sections) {
        let maskRect = document.createElementNS(svgNS, "rect");
        maskRect.setAttribute("fill", "black");
        mask.appendChild(maskRect);

        let box = D2.Div("bug-report-overlay-box", () => {});
        box.style.setProperty("--border-radius", getComputedStyle(section).borderRadius);
        placer.appendChild(box);

        box.style.setProperty("--offset-x", offset + "s");
        offset += 0.2;


        let readable = section.getAttribute("bug-name");
        if(!readable) {
            readable = section.getAttribute("bug").replaceAll("/", " / ").replaceAll("_" , " ");
            // uppercase first letters of each word
            readable = readable.replace(/\w\S*/g, (txt) => {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }
        let obj = {
            section,
            name: section.getAttribute("bug"),
            readableName: readable,
            box,
            maskRect,
            unique: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        };
        boxes.push(obj);
        box.classList.add("bug-report-overlay-box-" + obj.unique);
        box.addEventListener("click", () => {
            if(selectedSection !== obj) {
                selectedSection?.box.classList.remove("active");
                selectedSection = obj;
                selectedText.innerHTML = obj.readableName;
                box.classList.add("active");
            } else {
                selectedSection = null;
                selectedText.innerHTML = "None";
                box.classList.remove("active");
            }
        })
    }

    let style = document.createElement("style");
    document.head.appendChild(style);

    let updateBoxPositions = () => {
        // first pass: compute rects and z-indices
        for (let box of boxes) {
            if (!box.section.checkVisibility({ opacityProperty: true, visibilityProperty: true })) {
                box.box.style.display = "none";
                box.maskRect.setAttribute("width", "0");
                box.maskRect.setAttribute("height", "0");
                box._rect = null;
                continue;
            }

            box.box.style.display = "";


            let r = box.section.getBoundingClientRect();
            r = JSON.parse(JSON.stringify(r));

            if (r.top < 0) {
                r.height += r.top;
                r.top = 0;
            }
            if (r.height > document.body.clientHeight) {
                r.height = document.body.clientHeight;
            }

            let z = 0;
            let el = box.section;
            while (el && el !== document.body) {
                const computed = parseInt(getComputedStyle(el).zIndex);
                if (!isNaN(computed)) z = Math.max(z, computed);
                el = el.parentElement;
            }


            box._rect = r;
            box._z = z;
            box.box.style.zIndex = z + 1;

            box.box.style.setProperty("--top", r.top + "px");
            box.box.style.setProperty("--left", r.left + "px");
            box.box.style.setProperty("--width", r.width + "px");
            box.box.style.setProperty("--height", r.height + "px");
            box.maskRect.setAttribute("x", r.left);
            box.maskRect.setAttribute("y", r.top);
            box.maskRect.setAttribute("width", r.width);
            box.maskRect.setAttribute("height", r.height);
            box.maskRect.setAttribute("rx", getComputedStyle(box.section).borderRadius.replace("px", "") || "16");
        }

        // second pass: per-box svg masks to subtract higher boxes
        style.innerHTML = "";
        for (let box of boxes) {
            if (!box._rect) continue;

            const r = box._rect;

            const overlaps = boxes.filter(other =>
                other !== box &&
                other._rect &&
                other._z >= box._z &&
                other._rect.left < r.left + r.width &&
                other._rect.left + other._rect.width > r.left &&
                other._rect.top < r.top + r.height &&
                other._rect.top + other._rect.height > r.top
            );

            if (overlaps.length === 0) {
                box.box.style.webkitMaskImage = "";
                box.box.style.maskImage = "";
                continue;
            }

            // build a css gradient mask using radial/linear isn't flexible enough,
            // so we use an inline svg mask via mask-image url(data:...)
            const svgNS = "http://www.w3.org/2000/svg";

            // coords relative to the box itself
            let rects = overlaps.map(other => {
                const ox = Math.max(other._rect.left, r.left) - r.left;
                const oy = Math.max(other._rect.top, r.top) - r.top;
                const ox2 = Math.min(other._rect.left + other._rect.width, r.left + r.width) - r.left;
                const oy2 = Math.min(other._rect.top + other._rect.height, r.top + r.height) - r.top;
                return { x: ox, y: oy, w: ox2 - ox, h: oy2 - oy };
            });

            const w = Math.round(r.width);
            const h = Math.round(r.height);

            let holes = rects.map(hr =>
                `<rect x='${Math.round(hr.x)}' y='${Math.round(hr.y)}' width='${Math.round(hr.w)}' height='${Math.round(hr.h)}' fill='black'/>`
            ).join("");

            const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><rect width='${w}' height='${h}' fill='white'/>${holes}</svg>`;

            const encoded = `url("data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23').replaceAll("\"", "'").replaceAll("\n", "")}")`;

            style.innerHTML += `.bug-report-overlay-box-${box.unique} { mask-image: ${encoded}; mask-mode: luminance; mask-size: 100% 100%; mask-repeat: no-repeat; mask-position: 0 0; }`;
        }
    };


    updateBoxPositions();
    let loop = setInterval(updateBoxPositions, 100);
    document.addEventListener("scroll", updateBoxPositions);

    overlay.appendChild(svg);
    document.body.appendChild(overlay);
}

setTimeout(() => {
    //ReportOverlay(Bug);
}, 500);

if(loggedIn) {
    document.getElementById("bug-reporter-bug").addEventListener("click", () => {
        document.querySelector("[dropdown='bugs']").dropdown.close();
        ReportOverlay(Bug, "bug");
    })
    document.getElementById("bug-reporter-feedback").addEventListener("click", () => {
        document.querySelector("[dropdown='bugs']").dropdown.close();
        ReportOverlay(Feedback, "feedback");
    })
}