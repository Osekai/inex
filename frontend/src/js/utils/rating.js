import {GetSetting} from "./usersettings";

function RatingToString(rating, lower = false) {
    const strings = ["Safe", "Suggestive", "Mature", "Explicit"];
    if (lower) return strings[rating].toLowerCase();
    return strings[rating];
}

function RatingToInt(rating) {
    rating = rating.toLowerCase();
    switch (rating) {
        case "su":
        case "suggestive":
            return 1;
        case "m":
        case "mature":
            return 2;
        case "e":
        case "explicit":
            return 3;
        default:
            return 0;
    }
}



export function RatingAllowance(rating) {
    if (Number.isInteger(rating)) {
        rating = RatingToString(rating, true);
    }

    if (rating === "explicit" || rating === "mature") {
        if (!over18) {
            return false;
        }
    }

    if (GetSetting("rating_allowance", null) != null) {
        return GetSetting("rating_allowance")[RatingToInt(rating)];
    } else {
        if (rating === "safe") {
            return true;
        }
        if (rating === "suggestive" || rating === "mature" || rating === "explicit") {
            return false;
        }
    }
    return false;
}