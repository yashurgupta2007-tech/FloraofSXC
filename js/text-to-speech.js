
window.FloraSpeech = (() => {
    let currentUtterance = null;
    let isPaused = false;
    let playbackId = 0;

    function isSupported() {
        return (
            'speechSynthesis' in window &&
            'SpeechSynthesisUtterance' in window
        );
    }

    function createController() {
        if (document.getElementById('speech-controller')) return;

        const controller = document.createElement('div');
        controller.id = 'speech-controller';
        controller.className = 'speech-controller';
        controller.hidden = true;

        controller.innerHTML = `
            <span class="speech-status" aria-live="polite">
                Reading plant information...
            </span>

            <button type="button" id="speech-pause"
                aria-label="Pause narration">
                <i class="fa-solid fa-pause"></i>
            </button>

            <button type="button" id="speech-stop"
                aria-label="Stop narration">
                <i class="fa-solid fa-stop"></i>
            </button>
        `;

        document.body.appendChild(controller);

        document.getElementById('speech-pause')
            .addEventListener('click', togglePause);

        document.getElementById('speech-stop')
            .addEventListener('click', stop);
    }

    function chooseVoice() {
        const voices = speechSynthesis.getVoices();

        return (
            voices.find(v => v.lang.toLowerCase() === 'en-in') ||
            voices.find(v => v.lang.toLowerCase().startsWith('en-gb')) ||
            voices.find(v => v.lang.toLowerCase().startsWith('en')) ||
            null
        );
    }


    function speakFields(fields, statusLabel = 'Plant Information') {
        if (!isSupported()) {
            alert('Text-to-speech is not supported by this browser.');
            return;
        }

        const validFields = fields.filter(field =>
            field.text !== null &&
            field.text !== undefined &&
            String(field.text).trim() !== ''
        );

        if (!validFields.length) return;

        stop();
        createController();

        const controller =
            document.getElementById('speech-controller');

        const status =
            controller.querySelector('.speech-status');

        controller.hidden = false;
        controller.style.display = 'flex';

        status.textContent = `Reading: ${statusLabel}`;

        const fullText = validFields
            .map(field => `${field.label}. ${field.text}`)
            .join('. ');

        const utterance = new SpeechSynthesisUtterance(fullText);

        currentUtterance = utterance;

        const thisPlayback = playbackId;
        const voice = chooseVoice();

        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        } else {
            utterance.lang = 'en-IN';
        }

        utterance.rate = 0.95;
        utterance.pitch = 1;

        utterance.onstart = () => {
            if (thisPlayback !== playbackId) return;
            status.textContent = `Reading: ${statusLabel}`;
        };

        utterance.onend = () => {
            if (thisPlayback !== playbackId) return;

            currentUtterance = null;
            isPaused = false;
            controller.hidden = true;
        };

        utterance.onerror = (event) => {
            if (thisPlayback !== playbackId) return;

            if (event.error !== 'canceled' &&
                event.error !== 'interrupted') {
                console.error('Speech error:', event.error);
            }

            currentUtterance = null;
            isPaused = false;
            controller.hidden = true;
        };

        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    }


    function speakText(text, label = 'Plant information') {
        speakFields([{ label, text }], label);
    }

    function togglePause() {
        if (!isSupported() || !currentUtterance) return;

        const button = document.getElementById('speech-pause');
        const icon = button?.querySelector('i');

        if (isPaused) {
            speechSynthesis.resume();
            isPaused = false;

            if (icon) icon.className = 'fa-solid fa-pause';

            button?.setAttribute('aria-label', 'Pause narration');
        } else {
            speechSynthesis.pause();
            isPaused = true;

            if (icon) icon.className = 'fa-solid fa-play';

            button?.setAttribute('aria-label', 'Resume narration');
        }
    }

    function stop() {
        playbackId++;

        if (isSupported()) {
            speechSynthesis.cancel();
        }

        currentUtterance = null;
        isPaused = false;

        document.getElementById('speech-controller')?.remove();
    }

    return {
        speakText,
        speakFields,
        pause: () => speechSynthesis.pause(),
        resume: () => speechSynthesis.resume(),
        stop
    };
})();
