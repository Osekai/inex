export class Medal {
    Obtained: boolean;
    constructor(medal: any) {
        for(var x in medal) {
            // @ts-ignore
            this[x] = medal[x];
        }
    }

    Medal_ID : number;
    Name : string;
    Link : string;
    Description : string;
    Gamemode : string;
    Grouping : string;
    Instructions : string;
    Ordering : number;
    Frequency : string;
    Count_Achieved_By : number;
    Video_URL : string;
    First_Achieved_Date : string;
    First_Achieved_User_ID : number;
    Is_Solution_Found : string;
    Is_Lazer : number;
    Is_Restricted : number;
    Solution : string;
    Date_Released : string;
    Beatmaps: unknown;

    MedalButton: HTMLAnchorElement;

    GetGamemode() {
        if (this.Gamemode === "fruits") return "catch";
        return this.Gamemode ?? "all";
    }
    GetButton() {
        if(this.MedalButton == null) {
            this.MedalButton = document.querySelector("[medal-button-id='"+this.Medal_ID+"']");
        }
        return this.MedalButton;
    }
}