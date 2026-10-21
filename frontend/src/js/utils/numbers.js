// one place for number formatting, fixed locale so everyone gets commas
export function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined || value === "") return "-";

    let number = Number(value);
    if (isNaN(number)) return "-";

    return number.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}
