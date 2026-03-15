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

    function showSection(section) {
        [uploadArea, previewArea, loadingArea, resultArea, errorArea].forEach(el => {
            if (el) el.style.display = 'none';
        });
        if (section) section.style.display = 'block';
    }

    if (fileInput) fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

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

    if (resetBtn) resetBtn.addEventListener('click', resetAll);
    if (newPhotoBtn) newPhotoBtn.addEventListener('click', resetAll);
    if (tryAgainBtn) tryAgainBtn.addEventListener('click', () => showSection(previewArea));
    if (errorRetryBtn) errorRetryBtn.addEventListener('click', () => showSection(previewArea));

    function resetAll() {
        currentImageBase64 = null; currentImageDataUrl = null;
        fileInput.value = ''; showSection(uploadArea);
    }

    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', () => transformImage(btn.dataset.style));
    });

    const stylePrompts = {
        short: 'short hair, buzz cut, fade haircut, clean modern short hairstyle',
        medium: 'medium length hair, side part, textured crop, modern pompadour',
        long: 'long hair, flowing hair, shoulder length, long layered hairstyle'
    };

    async function transformImage(style) {
        if (!currentImageBase64) { showError('Încarcă o imagine mai întâi.'); return; }
        showSection(loadingArea);

        try {
            const response = await fetch('/api/transform', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    version: 'ddfc2b08d209f9fa8c1uj0jte6fg4d2lgv4fk0rdaxbjzltcjkma',
                    input: {
                        image: 'data:image/jpeg;base64,' + currentImageBase64,
                        prompt: stylePrompts[style],
                        negative_prompt: 'blurry, distorted, low quality',
                        num_inference_steps: 30,
                        guidance_scale: 7.5
                    }
                })
            });

            const result = await response.json();
            if (result.error) throw new Error(result.error);
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
            if (msg.includes('insufficient credit')) msg = 'Serviciul AI este temporar indisponibil.';
            else if (msg.includes('Failed to fetch')) msg = 'Eroare de rețea. Verifică conexiunea.';
            showError(msg);
        }
    }

    function showError(message) {
        if (errorMessage) errorMessage.textContent = message;
        showSection(errorArea);
    }
});
