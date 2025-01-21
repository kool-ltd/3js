export function showLoadingProgress(percent) {
    document.getElementById('loading-text').textContent = 
        `Loading model... ${Math.round(percent)}%`;
}

export function hideLoadingText() {
    document.getElementById('loading-text').style.display = 'none';
}

export function showError(message) {
    document.getElementById('loading-text').textContent = message;
}
