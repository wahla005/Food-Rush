import API from '../api/axios';

/**
 * Resolves a potentially relative image path to a full URL.
 * Handles Cloudinary URLs, absolute paths, and relative local paths.
 */
export const getImageUrl = (path) => {
    if (!path) return '';
    
    // If it's already a full URL (Cloudinary, Unsplash, etc.)
    if (path.startsWith('http')) return path;

    // Determine the base URL of the server
    // In production, API.defaults.baseURL should be the full URL
    const apiBase = API.defaults.baseURL || '';
    let serverBase = '';

    if (apiBase.startsWith('http')) {
        // Extract base from something like https://api.com/api
        const url = new URL(apiBase);
        serverBase = `${url.protocol}//${url.host}`;
    } else {
        // Fallback for local dev if baseURL is relative or missing
        serverBase = 'http://localhost:5001';
    }

    // Ensure path starts with / and remove redundant uploads/ if already present in a way that conflicts
    let cleanPath = path;
    
    // If it's just a filename, assume it belongs in uploads
    if (!path.includes('/')) {
        cleanPath = `/uploads/${path}`;
    } else if (!path.startsWith('/')) {
        cleanPath = `/${path}`;
    }

    return `${serverBase}${cleanPath}`;
};
