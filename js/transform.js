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

    async function transformImage(style) {
        if (!currentImageBase64) { showError('Încarcă o imagine mai întâi.'); return; }
        showSection(loadingArea);

        try {
            const response = await fetch('/api/transform', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: 'data:image/jpeg;base64,' + currentImageBase64,
                    prompt: stylePrompts[style]
                })
            });

            const result = await response.json();
            if (result.error) throw new Error(result.error);
            
            if (result.output) {
                const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
                originalResult.src = currentImageDataUrl;
                transformedResult.src = outputUrl;
                showSection(resultArea);
            } else {
                throw new Error('Procesarea a eșuat. Încearcă din nou.');
            }
        } catch (error) {
            let msg = error.message;
            if (msg.includes('insufficient credit')) msg = 'Serviciul AI este temporar indisponibil. Revino mai târziu.';
            else if (msg.includes('Failed to fetch')) msg = 'Eroare de rețea. Verifică conexiunea.';
            showError(msg);
        }
    }

    function showError(message) {
        if (errorMessage) errorMessage.textContent = message;
        showSection(errorArea);
    }
});
