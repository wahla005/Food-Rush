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
    const apiBase = API.defaults.baseURL || '';
    let serverBase = '';

    if (apiBase.startsWith('http')) {
        const url = new URL(apiBase);
        serverBase = `${url.protocol}//${url.host}`;
    } else {
        serverBase = 'http://localhost:5001';
    }

    let cleanPath = path;
    
    if (!path.includes('/')) {
        cleanPath = `/uploads/${path}`;
    } else if (!path.startsWith('/')) {
        cleanPath = `/${path}`;
    }

    return `${serverBase}${cleanPath}`;
};
