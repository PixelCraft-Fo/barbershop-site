// ═══════════════════════════════════════
// THE GENTLEMAN'S CUT — AI Transform
// Handles image upload and Replicate API
// Folosește flux-kontext-apps/change-haircut
// Cu CORS proxy pentru GitHub Pages
// ═══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
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
    const uploadZone = document.getElementById('uploadZone');
    const saveApiKeyBtn = document.getElementById('saveApiKey');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiStatus = document.getElementById('apiStatus');

    let currentImageBase64 = null;
    let currentImageDataUrl = null;

    // API key din localStorage
    let apiKey = localStorage.getItem('replicate_api_key') || '';
    const CORS_PROXY = 'https://corsproxy.io/?';

    // Load saved API key indicator
    if (apiKey && apiKeyInput) apiKeyInput.value = '••••••••••••••••';

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

    // Ensure upload area visible on load
    if (uploadArea) uploadArea.style.display = 'block';

    // File upload
    if (fileInput) fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    // Drag & drop
    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
        });
    }

    function handleFile(file) {
        if (!file.type.startsWith('image/')) { showError('Încarcă un fișier imagine.'); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            currentImageDataUrl = e.target.result;
            currentImageBase64 = e.target.result.split(',')[1];
            previewImg.src = currentImageDataUrl;
            showSection(previewArea);
        };
        reader.readAsDataURL(file);
    }

    // Navigation buttons
    if (resetBtn) resetBtn.addEventListener('click', resetAll);
    if (newPhotoBtn) newPhotoBtn.addEventListener('click', resetAll);
    if (tryAgainBtn) tryAgainBtn.addEventListener('click', () => showSection(previewArea));
    if (errorRetryBtn) errorRetryBtn.addEventListener('click', () => showSection(previewArea));

    function resetAll() {
        currentImageBase64 = null; currentImageDataUrl = null;
        fileInput.value = ''; showSection(uploadArea);
    }

    // Style buttons — all 10 styles with active highlight
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('style-btn-active'));
            btn.classList.add('style-btn-active');
            transformImage(btn.dataset.style);
        });
    });

    // Prompts for each of the 10 hairstyles
    const stylePrompts = {
        buzzcut: 'Change the hairstyle to a military buzz cut, very short all around, clean and minimal',
        sidepart: 'Change the hairstyle to a classic side part, medium length on top combed to one side with shorter sides',
        flowhair: 'Change the hairstyle to long flowing hair, shoulder length, natural and free-flowing',
        fade: 'Change the hairstyle to a high skin fade with short textured top',
        pompadour: 'Change the hairstyle to a classic pompadour, slicked back with volume on top',
        curly: 'Change the hairstyle to curly hair, natural curls medium length',
        mohawk: 'Change the hairstyle to a modern mohawk with faded sides',
        mullet: 'Change the hairstyle to a modern mullet, short on top longer in the back',
        braids: 'Change the hairstyle to braided hair, cornrow braids close to the scalp',
        lowtaper: 'Change the hairstyle to a low taper fade, gradual fade around the ears and neckline with longer hair on top'
    };

    // Transform image with Replicate API — flux-kontext-apps/change-haircut
    async function transformImage(style) {
        if (!apiKey) {
            showError('Te rog configurează API token-ul Replicate în secțiunea ⚙ Configurare API.');
            return;
        }
        if (!currentImageBase64) { showError('Încarcă o imagine mai întâi.'); return; }
        showSection(loadingArea);

        try {
            const prompt = stylePrompts[style];
            if (!prompt) throw new Error('Stil necunoscut: ' + style);

            // Model-based API endpoint (no version hash needed)
            const endpoint = 'https://api.replicate.com/v1/models/flux-kontext-apps/change-haircut/predictions';

            const response = await fetch(CORS_PROXY + endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'wait'
                },
                body: JSON.stringify({
                    input: {
                        image: 'data:image/jpeg;base64,' + currentImageBase64,
                        prompt: prompt
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Eroare API: ${response.status}`);
            }

            const prediction = await response.json();

            // If status is "succeeded" directly (Prefer: wait)
            if (prediction.status === 'succeeded' && prediction.output) {
                const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
                originalResult.src = currentImageDataUrl;
                transformedResult.src = outputUrl;
                showSection(resultArea);
                return;
            }

            // Otherwise, poll for result
            if (prediction.urls && prediction.urls.get) {
                const result = await pollForResult(prediction.urls.get);
                if (result.status === 'succeeded' && result.output) {
                    const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
                    originalResult.src = currentImageDataUrl;
                    transformedResult.src = outputUrl;
                    showSection(resultArea);
                } else {
                    throw new Error(result.error || 'Procesarea a eșuat. Încearcă din nou.');
                }
            } else {
                throw new Error('Procesarea a eșuat. Încearcă din nou.');
            }
        } catch (error) {
            let msg = error.message;
            if (msg.includes('insufficient credit') || msg.includes('payment')) {
                msg = 'Credit insuficient pe Replicate. Adaugă credit la replicate.com/account/billing';
            } else if (msg.includes('Unauthorized') || msg.includes('401')) {
                msg = 'Token API invalid. Verifică token-ul în secțiunea ⚙ Configurare API.';
            } else if (msg.includes('not exist') || msg.includes('not found')) {
                msg = 'Modelul AI nu a fost găsit. Contactează administratorul site-ului.';
            } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                msg = 'Eroare de rețea. Verifică conexiunea la internet și încearcă din nou.';
            }
            showError(msg);
        }
    }

    // Poll Replicate for result via CORS proxy
    async function pollForResult(url, maxAttempts = 60) {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const response = await fetch(CORS_PROXY + url, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            if (!response.ok) throw new Error(`Polling error: ${response.status}`);
            const result = await response.json();
            if (result.status === 'succeeded' || result.status === 'failed') return result;
        }
        throw new Error('Timeout — procesarea a durat prea mult. Încearcă din nou.');
    }

    function showError(message) {
        if (errorMessage) errorMessage.textContent = message;
        showSection(errorArea);
    }
});
