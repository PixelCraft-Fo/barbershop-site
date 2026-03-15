// ═══════════════════════════════════════
// THE GENTLEMAN'S CUT — AI Transform
// Handles image upload and Replicate API
// Folosește black-forest-labs/flux-kontext-pro
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

    // API key din localStorage
   

    function showSection(section) {
        [uploadArea, previewArea, loadingArea, resultArea, errorArea].forEach(el => {
            if (el) el.style.display = 'none';
        });
        if (section) section.style.display = 'block';
    }

    // Ensure upload area visible on load
    if (uploadArea) uploadArea.style.display = 'block';

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

    // Style buttons — all 10 styles with active highlight
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('style-btn-active'));
            btn.classList.add('style-btn-active');
            transformImage(btn.dataset.style);
        });
    });

    // Prompts detaliate pentru fiecare din cele 10 frizuri — black-forest-labs/flux-kontext-pro
    // Modelul primește input_image + prompt (text liber descriptiv)
    const stylePrompts = {
        buzzcut: 'Transform this person\'s hairstyle into a clean military-style buzz cut. The hair should be uniformly clipped to approximately 3mm all around the head, with a sharp and precise hairline along the forehead, temples and neckline. The scalp should be slightly visible through the very short hair. Keep the person\'s face, skin tone, clothing and background completely unchanged.',

        sidepart: 'Transform this person\'s hairstyle into a classic gentleman\'s side part. The hair on top should be medium length (about 3-4 inches), neatly combed to the right side with a crisp defined part line on the left. The sides should be tapered short and blended smoothly into the longer top. The hair should look clean, polished and well-groomed with a slight natural shine. Keep the person\'s face, skin tone, clothing and background completely unchanged.',

        flowhair: 'Transform this person\'s hairstyle into long flowing hair that reaches past the shoulders. The hair should have natural movement and soft layers, falling freely with a slight wave. The texture should look healthy, thick and well-maintained with subtle highlights from natural light. The hair should frame the face naturally. Keep the person\'s face, skin tone, clothing and background completely unchanged.',

        fade: 'Transform this person\'s hairstyle into a modern high skin fade. The sides and back should gradually taper from completely bald skin near the ears up to a sharp transition into the longer hair on top. The top should have about 2-3 inches of textured, slightly messy styled hair. The fade should be crisp, clean and professionally done with a sharp lineup at the forehead and temples. Keep the person\'s face, skin tone, clothing and background completely unchanged.',

        pompadour: 'Transform this person\'s hairstyle into a classic voluminous pompadour. The hair on top should be swept upward and backward with significant height and volume at the front, reaching about 4-5 inches tall at the peak. The sides should be slicked back and shorter, blending into the dramatic top volume. The style should look sleek with a slight glossy finish like pomade was applied. Keep the person\'s face, skin tone, clothing and background completely unchanged.',

        curly: 'Transform this person\'s hairstyle into natural curly hair. The curls should be well-defined, bouncy ringlets of medium length (about 4-6 inches when stretched). The curls should have good volume and a rounded shape, looking healthy and moisturized with natural texture. The curls should cover the top and sides evenly, creating a full and lively look. Keep the person\'s face, skin tone, clothing and background completely unchanged.',

        mohawk: 'Transform this person\'s hairstyle into a bold modern mohawk. The center strip of hair running from the forehead to the back of the head should be about 2-3 inches wide and stand upright, approximately 3-4 inches tall, styled with a slight forward lean. Both sides of the head should be cleanly faded down to the skin. The mohawk strip should look sharp and well-defined with textured spiky styling. Keep the person\'s face, skin tone, clothing and background completely unchanged.',

        mullet: 'Transform this person\'s hairstyle into a modern stylish mullet. The front and top should be cropped to a medium-short length with textured layers and slight volume. The sides should be shorter and tapered. The back should flow down past the neck and reach the shoulders, creating the signature "business in the front, party in the back" silhouette. The overall look should be trendy and intentional, not messy. Keep the person\'s face, skin tone, clothing and background completely unchanged.',

        braids: 'Transform this person\'s hairstyle into neat cornrow braids. The hair should be braided in straight parallel rows running from the front hairline to the back of the head, with approximately 8-10 evenly spaced braids. Each braid should be tight, uniform and close to the scalp with clean straight parts between them. The braids should be well-defined and precise, showing skilled craftsmanship. Keep the person\'s face, skin tone, clothing and background completely unchanged.',

        lowtaper: 'Transform this person\'s hairstyle into a clean low taper fade. The hair on top should be kept at a medium length of about 3-4 inches, styled neatly with a natural side sweep or slight texture. The taper should begin just above the ears and gradually blend shorter toward the hairline at the neck and sides. The transition should be subtle and gradual, not dramatic. The lineup should be clean and precise around the ears and neckline. Keep the person\'s face, skin tone, clothing and background completely unchanged.'
    };

    // Transform image with Replicate API — black-forest-labs/flux-kontext-pro
   async function transformImage(style) {
        if (!currentImageBase64) { showError('Încarcă o imagine mai întâi.'); return; }
        showSection(loadingArea);

        try {
            const prompt = stylePrompts[style];
            if (!prompt) throw new Error('Stil necunoscut: ' + style);

            const response = await fetch('/api/transform', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: 'data:image/jpeg;base64,' + currentImageBase64,
                    prompt: prompt
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
