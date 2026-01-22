// Main JavaScript file
console.log('Football Visualization App Loaded');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Initialize all sections
    if (typeof initializeCSV !== 'undefined') initializeCSV();
    if (typeof initializeImages !== 'undefined') initializeImages();
    if (typeof initializeText !== 'undefined') initializeText();
});
