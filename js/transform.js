// ═══════════════════════════════════════
// THE GENTLEMAN'S CUT — AI Transform
// Handles image upload and Replicate API
// Cu CORS proxy pentru GitHub Pages
// ═══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

    // Elements
    const uploadArea = document.getElementById('uploadArea');
    const previewArea = document.getElementById('previewArea');
    const loadingArea = document.getElementById('loadingArea');
    const resultArea = document.getElementById('resultArea');
    const errorArea = document.getElementById('errorArea');
    const fileInput = document.getElementById('fileInput');
    const previewImg = document.getElementById('previewImg');
    const resetBtn = document.getElementById('resetBtn');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const newPhotoBtn = document.getElementById('newPhotoBtn');
    const errorRetryBtn = document.getElementById('errorRetryBtn');
    const errorMessage = document.getElementById('errorMessage');
    const originalResult = document.getElementById('originalResult');
    const transformedResult = document.getElementById('transformedResult');
    const saveApiKeyBtn = document.getElementById('saveApiKey');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiStatus = document.getElementById('apiStatus');
    const uploadZone = document.getElementById('uploadZone');

    let currentImageBase64 = null;
    let currentImageDataUrl = null;

    // PERSONALIZARE: Token-ul se pune din interfața site-ului
    let apiKey = '';
    // Verifică dacă e un prompt de token în URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token')) {
        apiKey = urlParams.get('token');
    }

    // Încearcă din localStorage
    if (!apiKey) {
        apiKey = localStorage.getItem('replicate_api_key') || '';
    }

    // CORS Proxy — necesar pentru apeluri din browser / GitHub Pages
    const CORS_PROXY = 'https://corsproxy.io/?';

    // Load saved API key
    if (apiKey && apiKeyInput) {
        apiKeyInput.value = '••••••••••••••••';
    }

    // Save API key
    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', () => {
            const key = apiKeyInput.value.trim();
            if (key && !key.startsWith('••')) {
                apiKey = key;
                localStorage.setItem('replicate_api_key', key);
                apiKeyInput.value = '••••••••••••••••';
                if (apiStatus) {
                    apiStatus.textContent = '✓ Token salvat cu succes!';
                    setTimeout(() => { apiStatus.textContent = ''; }, 3000);
                }
            }
        });
    }

    // Show/hide sections
    function showSection(section) {
        [uploadArea, previewArea, loadingArea, resultArea, errorArea].forEach(el => {
            if (el) el.style.display = 'none';
        });
        if (section) section.style.display = 'block';
    }

    // File upload via click
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Drag & drop
    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--gold)';
            uploadZone.style.background = 'var(--brown-mid)';
        });
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.style.borderColor = '';
            uploadZone.style.background = '';
        });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '';
            uploadZone.style.background = '';
            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    function handleFileSelect(e) {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    }

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            showError('Te rog încarcă un fișier imagine (JPG, PNG, etc.)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            currentImageDataUrl = e.target.result;
            currentImageBase64 = e.target.result.split(',')[1];
            previewImg.src = currentImageDataUrl;
            showSection(previewArea);
        };
        reader.readAsDataURL(file);
    }

    // Reset
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentImageBase64 = null;
            currentImageDataUrl = null;
            fileInput.value = '';
            showSection(uploadArea);
        });
    }

    // Try again (keep same photo)
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', () => {
            showSection(previewArea);
        });
    }

    // New photo
    if (newPhotoBtn) {
        newPhotoBtn.addEventListener('click', () => {
            currentImageBase64 = null;
            currentImageDataUrl = null;
            fileInput.value = '';
            showSection(uploadArea);
        });
    }

    // Error retry
    if (errorRetryBtn) {
        errorRetryBtn.addEventListener('click', () => {
            showSection(previewArea);
        });
    }

    // Style buttons
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const style = btn.dataset.style;
            transformImage(style);
        });
    });

    // Prompts for each style
    const stylePrompts = {
        short: 'short hair, buzz cut, fade haircut, clean and modern short hairstyle, professional barber cut',
        medium: 'medium length hair, side part, textured crop, modern pompadour, stylish medium hairstyle',
        long: 'long hair, flowing hair, shoulder length hair, man bun option, long layered hairstyle'
    };

    // Transform image with Replicate API (prin CORS proxy)
    async function transformImage(style) {
        if (!apiKey || apiKey === 'PUNE_TOKENUL_TAU_AICI') {
            showError('Te rog configurează API token-ul Replicate în fișierul transform.js sau în secțiunea ⚙ Configurare API.');
            return;
        }

        if (!currentImageBase64) {
            showError('Te rog încarcă o imagine mai întâi.');
            return;
        }

        showSection(loadingArea);

        try {
            // Create prediction — prin CORS proxy
            const response = await fetch(CORS_PROXY + 'https://api.replicate.com/v1/predictions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    version: 'ddfc2b08d209f9fa8c1uj0jte6fg4d2lgv4fk0rdaxbjzltcjkma',
                    input: {
                        image: `data:image/jpeg;base64,${currentImageBase64}`,
                        prompt: stylePrompts[style],
                        negative_prompt: 'blurry, distorted, low quality, unrealistic',
                        num_inference_steps: 30,
                        guidance_scale: 7.5
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || `Eroare API: ${response.status}`);
            }

            const prediction = await response.json();

            // Poll for result — prin CORS proxy
            const pollUrl = prediction.urls.get;
            const result = await pollForResult(pollUrl);

            if (result.status === 'succeeded' && result.output) {
                const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
                originalResult.src = currentImageDataUrl;
                transformedResult.src = outputUrl;
                showSection(resultArea);
            } else {
                throw new Error(result.error || 'Procesarea a eșuat. Încearcă din nou.');
            }

        } catch (error) {
            console.error('Transform error:', error);

            // Friendly error messages
            let msg = error.message;
            if (msg.includes('insufficient credit')) {
                msg = 'Credit insuficient pe Replicate. Adaugă credit la replicate.com/account/billing';
            } else if (msg.includes('Unauthorized') || msg.includes('401')) {
                msg = 'Token API invalid. Verifică token-ul în transform.js sau în secțiunea ⚙ Configurare API.';
            } else if (msg.includes('version') || msg.includes('not exist')) {
                msg = 'Modelul AI nu a fost găsit. Contactează administratorul site-ului.';
            } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                msg = 'Eroare de rețea. Verifică conexiunea la internet și încearcă din nou.';
            }

            showError(msg);
        }
    }

    // Poll Replicate for result — prin CORS proxy
    async function pollForResult(url, maxAttempts = 60) {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const response = await fetch(CORS_PROXY + url, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });

            if (!response.ok) {
                throw new Error(`Polling error: ${response.status}`);
            }

            const result = await response.json();

            if (result.status === 'succeeded' || result.status === 'failed') {
                return result;
            }
        }

        throw new Error('Timeout — procesarea a durat prea mult. Încearcă din nou.');
    }

    // Show error
    function showError(message) {
        if (errorMessage) errorMessage.textContent = message;
        showSection(errorArea);
    }

});
