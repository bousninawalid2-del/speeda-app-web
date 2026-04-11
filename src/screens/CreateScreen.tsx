// Updated parseMediaUrls function in CreateScreen.tsx

function parseMediaUrls(mediaUrls: string): string[] {
    let trimmedMediaUrls: string[] = [];
    try {
        JSON.parse(mediaUrls);
        trimmedMediaUrls = mediaUrls
            .split(',')
            .map(url => url.trim())
            .filter(url => url.length > 0);
    } catch (error) {
        // Return trimmed media URLs, ignoring JSON parse error
        console.error('JSON parse error:', error);
    }
    return trimmedMediaUrls;
}