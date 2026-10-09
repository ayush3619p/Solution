export function formatPrice(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(value);
}

export function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "—"
        : new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium",
            timeStyle: "short"
        }).format(date);
}

export function formatNumber(value) {
    return Number(value).toLocaleString("en-IN");
}
