export class Clubs {
    static GetClub(percentage) {
        if (percentage >= 100) return 100;
        if (percentage >= 95) return 95;
        if (percentage >= 90) return 90;
        if (percentage >= 80) return 80;
        if (percentage >= 60) return 60;
        if (percentage >= 40) return 40;
        return 0;
    }

    static GetClubClass(club) {
        switch(club) {
            case 100: return "col100club";
            case 95: return "col95club";
            case 90: return "col90club";
            case 80: return "col80club";
            case 60: return "col60club";
            case 40: return "col40club";
            default: return "colnoclub";
        }
    }
}
