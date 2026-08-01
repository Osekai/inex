class Club {
    #idx;

    constructor(name, colour, rank, idx) {
        this.name = name;
        this.colour = colour;
        this.rank = rank;
        this.#idx = idx;
        this.cssClass = rank > 0 ? `col${rank}club` : "colnoclub";
        this.icon = `/public/img/clubs/${rank}.png`;
    }

    Next() {
        return this.#idx > 0 ? Clubs2.clubs[this.#idx - 1] : null;
    }

    Previous() {
        return this.#idx < Clubs2.clubs.length - 1 ? Clubs2.clubs[this.#idx + 1] : null;
    }

    GetCount(existing) {
        return Math.ceil(existing * (this.rank / 100));
    }


}

export class Clubs2 {
    static clubs = [
        new Club("100% Club", "#f72585", 100, 0),
        new Club("98% Club",  "#FAD82E",  98, 1),
        new Club("95% Club",  "#FF445A",  95, 2),
        new Club("90% Club",  "#E44AFF",  90, 3),
        new Club("80% Club",  "#65C4FF",  80, 4),
        new Club("60% Club",  "#5AFFC3",  60, 5),
        new Club("40% Club",  "#9FB5D8",  40, 6),
    ];

    static #noClub = new Club("No Club", "#ffffff44", 0, -1);

    static Get(percentage) {
        return this.clubs.find(c => percentage >= c.rank) ?? this.#noClub;
    }
}