import {DoRequest} from "../utils/requests.js";
import {Div, LucideIcon, Text, Image} from "../utils/dom.js";


import '../../css/ui/notifications.css'
import DOMPurify from "dompurify";
import {D2} from "../utils/d2";

var offset = 0;
var isMore = true;
var list = document.getElementById("notifications");

class Type {
    strings;
    icon;
    accent;
    type;

    constructor(type, strings, icon, accent) {
        this.type = type;
        this.strings = strings;
        this.icon = icon;
        this.accent = accent;
    }

    GetTitle(user, reftype, n) {
        var str = this.strings[reftype].title.replace("$USER", `<a href="${user.link}">${DOMPurify.sanitize(user.name)}</a>`);
        var extra = this.strings[reftype].dynamic?.(n) ?? {};
        for (var [key, val] of Object.entries(extra)) {
            str = str.replace(key, val);
        }
        return str;
    }

    GetDescription(title, reftype, n) {
        var plural = title;
        plural += title.endsWith("s") ? "'" : "'s";

        var tmp = this.strings[reftype].description;
        if (typeof(tmp) == "undefined" || tmp == null) return null;

        var extra = this.strings[reftype].dynamic?.(n) ?? {};

        var dumb = Math.random() * 9999;
        tmp = tmp.replace("$TITLEPLURAL", dumb);
        tmp = tmp.replace("$TITLE", title);
        tmp = tmp.replace(dumb, plural);

        for (var [key, val] of Object.entries(extra)) {
            tmp = tmp.replace(key, val);
        }

        return tmp;
    }
}

function String(title, description = null, dynamic = null) {
    return {title, description, dynamic};
}

var types = {
    "comment": new Type("comment", {
        "medals": String("$USER commented on a medal", "$TITLE"),
        "users": String("$USER commented on your profile"),
    }, "message-square", 278),
    "reply": new Type("reply", {
        "medals": String("$USER replied to your comment", "on $TITLE"),
        "users": String("$USER replied to $COMMENT_OWNER", "on $TITLEPLURAL profile", (n) => ({
            "$COMMENT_OWNER": n.Ref_Comments_Reply_Data?.User_ID === userData.id ? "your comment" : "a comment"
        })),
    }, "messages-square", 331),
}

function ParseNotification(n) {
    if (typeof n.SenderData === "string") n.SenderData = JSON.parse(n.SenderData);
    if (typeof n.Ref_Medals_Data === "string") n.Ref_Medals_Data = JSON.parse(n.Ref_Medals_Data);
    if (typeof n.Ref_Users_Data === "string") n.Ref_Users_Data = JSON.parse(n.Ref_Users_Data);
    if (typeof n.Ref_Comments_Data === "string") n.Ref_Comments_Data = JSON.parse(n.Ref_Comments_Data);
    if (typeof n.Ref_Comments_Reply_Data === "string") n.Ref_Comments_Reply_Data = JSON.parse(n.Ref_Comments_Reply_Data);
    return n;
}

function GenerateNotification(raw) {
    var n = ParseNotification(raw);

    var reftype = "";
    if (n.Ref_Medals != null) reftype = "medals";
    else if (n.Ref_Users != null) reftype = "users";

    if (typeof (types[n.Type]) == "undefined") {
        return Text("p", "ERROR: Type " + n.Type + " is not defined!");
    }

    var type = types[n.Type];

    function GetUser() {
        return {
            "name": n.SenderData.Name.toString(),
            "link": "/user/" + n.SenderData.User_ID
        };
    }

    var title = "";
    var link = "";

    switch (reftype) {
        case "medals":
            title = n.Ref_Medals_Data.Name;
            link = `/medals/${n.Ref_Medals}`;
            break;
        case "users":
            title = n.Ref_Users_Data.Name;
            link = `/user/${n.Ref_Users}`;
            break;
    }

    var div = Div("a", "notification");
    div.href = link;
    div.style.setProperty("--ahue", type.accent);

    if (n.Read === 0) div.classList.add("unread");

    var notif_right = Div("div", "notification-right");
    var notif_upper = Div("div", "notification-upper");
    var notif_extra = Div("div", "notification-extra");

    var imagei = Image("https://a.ppy.sh/" + n.SenderID, "backdrop", true);
    notif_upper.appendChild(imagei);

    var useExtra = false;

    var icon = LucideIcon(type.icon);
    var texts = Div("div");

    var titletxt = Text("object", "");
    titletxt.innerHTML = type.GetTitle(GetUser(), reftype, n);
    var lower = Text("small", type.GetDescription(title, reftype, n));
    texts.appendChild(titletxt);
    texts.appendChild(lower);
    const notifDate = new Date(n.Date + " UTC");
    const notifDateText = Text("h6", D2.TimeRelative(notifDate));
    notifDateText.setAttribute("tooltip", D2.TimeFull(notifDate, {time: "minutes"}));
    texts.appendChild(notifDateText);
    notif_upper.appendChild(icon);
    notif_upper.appendChild(texts);

    function ReplyThingy(user_id, content) {
        var div = Div("div", "notification-extra-comment");
        div.appendChild(Image("https://a.ppy.sh/" + user_id, "pfp", true));
        div.appendChild(Text("p", content));
        return div;
    }

    if (n.Ref_Comments_Reply_Data !== null) {
        useExtra = true;
        var x = ReplyThingy(n.Ref_Comments_Reply_Data.User_ID, n.Ref_Comments_Reply_Data.Text);
        x.classList.add("faded");
        notif_extra.appendChild(x);
    }
    if (n.Ref_Comments_Data !== null) {
        useExtra = true;
        notif_extra.appendChild(ReplyThingy(n.Ref_Comments_Data.User_ID, n.Ref_Comments_Data.Text));
    }

    notif_right.appendChild(notif_upper);
    if (useExtra) notif_right.appendChild(notif_extra);
    div.appendChild(notif_right);

    return div;
}

var loaded = false;
export default async function LoadMore(auto = true) {
    if (loaded === true && auto === false) {
        loaded = false;
        offset = 0;
        isMore = true;
    }
    loaded = true;
    var more = await DoRequest("POST", "/api/notifications", {offset});
    console.log(more);
    more = more.content;
    isMore = more.length >= 50;
    if (auto === false) {
        list.innerHTML = "";
        list.innerHTML = loader;
    }
    if(more.length == 0) {
        list.innerHTML = "";
        list.appendChild(D2.Div("no-notifs", () => {
            D2.Icon("smile");
            D2.Text("p", "You have no notifications!");
        }))
        return;
    }
    for (let notification of more) {
        list.appendChild(GenerateNotification(notification));
    }

    if (isMore) {
        var loadMore = Text("button", "load more?", "button big");
        list.appendChild(loadMore);
        loadMore.addEventListener("click", async () => {
            loadMore.remove();
            var loaderContainer = Div("div", "loader-container");
            loaderContainer.innerHTML = loader;
            list.appendChild(loaderContainer);
            await LoadMore();
            loaderContainer.remove();
        });
    }

    DoRequest("POST", "/api/notifications/readall", {"items": JSON.stringify(more)});
    offset += 50;

    if(document.getElementById("notif-pill")) document.getElementById("notif-pill").classList.add("hidden");
}