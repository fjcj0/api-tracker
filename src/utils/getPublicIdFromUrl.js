export const getPublicIdFromUrl = (url, folder = 'users') => {
    try {
        if (!url) return null;
        const urlParts = url.split('/');
        const filenameWithExtension = urlParts[urlParts.length - 1];
        const publicIdWithExtension = filenameWithExtension.split('.')[0];
        return `${folder}/${publicIdWithExtension}`;
    } catch (error) {
        console.error('Error extracting public ID from URL:', error);
        return null;
    }
};