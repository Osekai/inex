import "../../css/views/rankings_home.css";
import {columnTypes, types} from "./rankings/RankingsUtils";
import {D2} from "../utils/d2";
import {DoRequest} from "../utils/requests";
import {PushToast} from "../ui/toasts";

let cats = [];
for(var key in types) {
    if(cats.indexOf(types[key].category) == -1) cats.push(types[key].category);
}

for(let cat of cats) {
    let panel = D2.Div("panel", () => {
        D2.Text("h1", cat)
        D2.Div("divider")
        D2.Div("buttongrid", () => {
            for(var key in types) {
                if(types[key].category == cat) {
                    D2.CustomPlus("a", "buttonpanel", {"href": "/rankings/"+key}, () => [
                        D2.Text("p", types[key].name)
                    ])
                }
            }
        })
    })
    document.getElementById("rankings-home-panels").appendChild(panel);
}

document.getElementById("add_addbutton").addEventListener("click", async () => {
    let addpanel = document.getElementById("addpanel");
    addpanel.classList.add("loading");

    console.log("gay?");
    let id = document.getElementById("add_userid").value;
    let resp = await DoRequest("POST", "/api/rankings/add", {
        id: id
    });

    if(resp.success == false) {
        PushToast({"theme": "warning", "content": resp.message});
    }
    else {
        PushToast({"theme": "success", "content": "Added user to ranking"});
    }

    addpanel.classList.remove("loading");
})