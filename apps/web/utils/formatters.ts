// Helper to parse dates that might be in SQL format "YYYY-MM-DD HH:mm:SS.us +offset"
// or ISO "YYYY-MM-DDTHH:mm:SS..."
export const parseServerDate = (dateStr: string | number | null | undefined): number | null => {
    if (!dateStr) return null;
    if (typeof dateStr === 'number') return dateStr;
    if (typeof dateStr !== 'string') return null;
    // If it contains a space instead of T, replace it.
    // Also handle possible nanoseconds or other quirks if needed,
    // but the main issue is usually the space and missing T.
    // Example input: "2026-01-04 22:30:58.641961 +00:00"
    // Valid ISO: "2026-01-04T22:30:58.641961+00:00"

    // Check if it matches the pattern "YYYY-MM-DD HH:mm..."
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}\s/)) {
        dateStr = dateStr.replace(' ', 'T').replace(' ', ''); // Replace first space with T, remove second space (before offset)?
        // Wait, "+00:00" is fine. But "22:30:58.641961 +00:00" has a space before +.
        // "YYYY-MM-DDTHH:mm:SS.ssssss+00:00" is valid.
        // "YYYY-MM-DD HH:MM:SS.ssssss +00:00" -> Replace first space with T. Remove space before +?

        // Let's replace ALL spaces with T? No.
        // Replace " " with "T" at index 10.
        // And remove space at index ~26?

        // Simpler: Split by space?
        const parts = dateStr.split(' ');
        if (parts.length >= 2) {
            // parts[0] = YYYY-MM-DD
            // parts[1] = HH:MM:SS.ssssss
            // parts[2] = +00:00 (optional)
            let iso = `${parts[0]}T${parts[1]}`;
            if (parts[2]) {
                iso += parts[2];
            } else {
                iso += 'Z'; // Assume UTC if no offset
            }
            dateStr = iso;
        }
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.getTime();
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};
