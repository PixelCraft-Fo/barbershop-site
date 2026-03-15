// ═══════════════════════════════════════
// THE GENTLEMAN'S CUT — AI Transform
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

    let currentImageBase64 = null;
    let currentImageDataUrl = null;

    // PERSONALIZARE: Pune token-ul tău Replicate aici între ghilimele
    const apiKey = 'r8_ZIws8zbYFnbxABiVWuZS1t4gJrUFxrJ3PQKBX';

    // CORS Proxy pentru GitHub Pages
    const CORS_PROXY = 'https://corsproxy.io/?';

    function showSection(section) {
        [uploadArea, previewArea, loadingArea, resultArea, errorArea].forEach(el => {
            if (el) el.style.display = 'none';
        });
        if (section) section.style.display = 'block';
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFile(e.target.files[0]);
        });
    }

    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--gold)';
        });
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.style.borderColor = '';
        });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '';
            if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
        });
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

    if (resetBtn) resetBtn.addEventListener('click', resetAll);
    if (newPhotoBtn) newPhotoBtn.addEventListener('click', resetAll);
    if (tryAgainBtn) tryAgainBtn.addEventListener('click', () => showSection(previewArea));
    if (errorRetryBtn) errorRetryBtn.addEventListener('click', () => showSection(previewArea));

    function resetAll() {
        currentImageBase64 = null;
        currentImageDataUrl = null;
        fileInput.value = '';
        showSection(uploadArea);
    }

    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', () => transformImage(btn.dataset.style));
    });

    const stylePrompts = {
        short: 'short hair, buzz cut, fade haircut, clean and modern short hairstyle, professional barber cut',
        medium: 'medium length hair, side part, textured crop, modern pompadour, stylish medium hairstyle',
        long: 'long hair, flowing hair, shoulder length hair, man bun option, long layered hairstyle'
    };

    async function transformImage(style) {
        if (!apiKey || apiKey === 'PUNE_TOKENUL_TAU_AICI') {
            showError('Sistemul AI nu este configurat. Contactează administratorul.');
            return;
        }
        if (!currentImageBase64) {
            showError('Te rog încarcă o imagine mai întâi.');
            return;
        }

        showSection(loadingArea);

        try {
            const response = await fetch(CORS_PROXY + 'https://api.replicate.com/v1/predictions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    version: 'ddfc2b08d209f9fa8c1uj0jte6fg4d2lgv4fk0rdaxbjzltcjkma',
                    input: {
                        image: 'data:image/jpeg;base64,' + currentImageBase64,
                        prompt: stylePrompts[style],
                        negative_prompt: 'blurry, distorted, low quality, unrealistic',
                        num_inference_steps: 30,
                        guidance_scale: 7.5
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Eroare API: ' + response.status);
            }

            const prediction = await response.json();
            const result = await pollForResult(prediction.urls.get);

            if (result.status === 'succeeded' && result.output) {
                const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
                originalResult.src = currentImageDataUrl;
                transformedResult.src = outputUrl;
                showSection(resultArea);
            } else {
                throw new Error(result.error || 'Procesarea a eșuat.');
            }

        } catch (error) {
            let msg = error.message;
            if (msg.includes('insufficient credit')) msg = 'Serviciul AI este temporar indisponibil. Revino mai târziu.';
            else if (msg.includes('Unauthorized') || msg.includes('401')) msg = 'Eroare de autentificare. Contactează administratorul.';
            else if (msg.includes('version') || msg.includes('not exist')) msg = 'Modelul AI nu este disponibil momentan.';
            else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) msg = 'Eroare de rețea. Verifică conexiunea la internet.';
            showError(msg);
        }
    }

    async function pollForResult(url, maxAttempts = 60) {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const response = await fetch(CORS_PROXY + url, {
                headers: { 'Authorization': 'Bearer ' + apiKey }
            });
            if (!response.ok) throw new Error('Polling error: ' + response.status);
            const result = await response.json();
            if (result.status === 'succeeded' || result.status === 'failed') return result;
        }
        throw new Error('Timeout — procesarea a durat prea mult.');
    }

    function showError(message) {
        if (errorMessage) errorMessage.textContent = message;
        showSection(errorArea);
    }

});
