document.addEventListener('DOMContentLoaded', () => {
    const app = new RadioWave();
    app.init();
});

class RadioWave {
    constructor() {
        this.stations = [];
        this.currentStationIndex = -1;
        this.audio = new Audio();
        this.audio.crossOrigin = 'anonymous';
        this.isPlaying = false;
        this.audioContext = null;
        this.analyser = null;
        this.eqBands = [];
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.sleepTimer = null;

        this.ui = {}; // To cache UI elements
    }

    async init() {
        this.initUI();
        await this.loadStations();
        this.bindEvents();
        this.applyAccentColor(localStorage.getItem('accentColor') || '#FF8C00');
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.replace('dark-theme', 'light-theme');
            this.ui.themeSwitcher.innerHTML = '<i class="fas fa-moon"></i>';
        }
        this.populateGenres();
        this.populateDiscoverStations();
    }

    initUI() {
        const ids = [
            'app-container', 'main-header', 'theme-switcher', 'equalizer-button', 'settings-button',
            'main-content', 'player-column', 'now-playing-card', 'album-art-container', 'station-logo',
            'visualizer', 'station-info', 'station-name', 'station-genre', 'live-indicator',
            'player-controls', 'prev-station', 'play-pause-button', 'next-station', 'volume-and-more',
            'volume-control', 'volume-slider', 'record-button', 'stations-column', 'tabs',
            'my-stations-tab', 'discover-tab', 'genres-tab', 'station-list-header', 'search-input',
            'add-station-button', 'station-list', 'ai-recommendations', 'recommendations-container',
            'discover-list', 'genre-list', 'settings-modal', 'color-picker', 'sleep-timer-select',
            'import-button', 'export-button', 'import-file-input', 'add-station-modal', 'add-station-form',
            'new-station-name', 'new-station-url', 'new-station-logo', 'new-station-genre',
            'equalizer-modal', 'equalizer-controls', 'eq-preset-select', 'eq-reset-button', 'eq-bands-container'
        ];
        ids.forEach(id => {
            const camelCaseId = id.replace(/-([a-z])/g, g => g[1].toUpperCase());
            this.ui[camelCaseId] = document.getElementById(id);
        });
        
        this.ui.modalCloseButtons = document.querySelectorAll('.modal .close-button');
        this.ui.tabLinks = document.querySelectorAll('.tab-link');
    }

    bindEvents() {
        this.ui.playPauseButton.addEventListener('click', () => this.togglePlayPause());
        this.ui.nextStation.addEventListener('click', () => this.playNextStation());
        this.ui.prevStation.addEventListener('click', () => this.playPreviousStation());
        this.ui.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.ui.stationList.addEventListener('click', (e) => this.handleStationClick(e));
        this.ui.searchInput.addEventListener('input', (e) => this.filterStations(e.target.value));
        this.ui.themeSwitcher.addEventListener('click', () => this.toggleTheme());

        // Modals
        this.ui.settingsButton.addEventListener('click', () => this.showModal(this.ui.settingsModal));
        this.ui.addStationButton.addEventListener('click', () => this.showModal(this.ui.addStationModal));
        this.ui.equalizerButton.addEventListener('click', () => this.showModal(this.ui.equalizerModal));
        this.ui.modalCloseButtons.forEach(btn => btn.addEventListener('click', () => this.hideAllModals()));
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) this.hideAllModals();
        });

        // Settings
        this.ui.colorPicker.addEventListener('input', (e) => this.applyAccentColor(e.target.value));
        this.ui.sleepTimerSelect.addEventListener('change', (e) => this.setSleepTimer(e.target.value));
        this.ui.importButton.addEventListener('click', () => this.ui.importFileInput.click());
        this.ui.importFileInput.addEventListener('change', (e) => this.importStations(e));
        this.ui.exportButton.addEventListener('click', () => this.exportStations());

        // Add Station Form
        this.ui.addStationForm.addEventListener('submit', (e) => this.addStation(e));

        // Tabs
        this.ui.tabLinks.forEach(link => {
            link.addEventListener('click', () => this.switchTab(link.dataset.tab));
        });

        // Audio Lifecycle
        this.audio.addEventListener('playing', () => this.isPlaying = true);
        this.audio.addEventListener('pause', () => this.isPlaying = false);

        // Equalizer & Recorder
        this.ui.recordButton.addEventListener('click', () => this.toggleRecording());
        this.initEqualizer();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    // Station Management
    async loadStations() {
        try {
            const response = await fetch('/api/get_stations.php');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const stations = await response.json();
            this.stations = stations.map(station => ({
                ...station,
                logo: station.logo_url // map db field to app field
            }));
            this.renderStationList();
            if (this.stations.length > 0 && this.currentStationIndex === -1) {
                this.playStation(0);
            }
        } catch (error) {
            console.error("Could not load stations:", error);
            this.ui.stationList.innerHTML = `<li class="error">Could not load stations.</li>`;
        }
    }

    renderStationList() {
        this.ui.stationList.innerHTML = '';
        this.stations.forEach((station, index) => {
            const li = document.createElement('li');
            li.dataset.index = index;
            li.className = (index === this.currentStationIndex) ? 'active' : '';
            li.innerHTML = `
                <img src="${station.logo || 'https://picsum.photos/seed/'+station.name+'/40'}" alt="${station.name}">
                <span>${station.name}</span>
            `;
            this.ui.stationList.appendChild(li);
        });
    }

    handleStationClick(e) {
        const li = e.target.closest('li');
        if (li) {
            const index = parseInt(li.dataset.index, 10);
            this.playStation(index);
        }
    }

    filterStations(query) {
        const lowerQuery = query.toLowerCase();
        const filtered = this.stations.filter(s => s.name.toLowerCase().includes(lowerQuery));
        // A bit of a hack, but re-rendering the whole list is easiest
        this.ui.stationList.innerHTML = '';
        filtered.forEach(station => {
            const index = this.stations.indexOf(station);
            const li = document.createElement('li');
            li.dataset.index = index;
            li.className = (index === this.currentStationIndex) ? 'active' : '';
            li.innerHTML = `
                <img src="${station.logo || 'https://picsum.photos/seed/'+station.name+'/40'}" alt="${station.name}">
                <span>${station.name}</span>
            `;
            this.ui.stationList.appendChild(li);
        });
    }

    // Player Logic
    playStation(index) {
        if (index < 0 || index >= this.stations.length) return;

        this.currentStationIndex = index;
        const station = this.stations[index];

        this.audio.src = station.url;
        this.togglePlayPause(true);

        this.ui.stationLogo.src = station.logo || `https://picsum.photos/seed/${station.name}/600`;
        this.ui.stationName.textContent = station.name;
        this.ui.stationGenre.textContent = station.genre || 'Radio';
        
        this.renderStationList(); // To update active state
        this.updateAIRecommendations(station.genre);
    }

    togglePlayPause(forcePlay = null) {
        if (this.currentStationIndex === -1) {
            if (this.stations.length > 0) this.playStation(0);
            return;
        }

        const shouldPlay = forcePlay !== null ? forcePlay : this.audio.paused;

        if (shouldPlay) {
            this.audio.play().catch(e => console.error("Playback failed:", e));
            this.ui.playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
            this.setupAudioVisualizer();
        } else {
            this.audio.pause();
            this.ui.playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    playNextStation() {
        let nextIndex = this.currentStationIndex + 1;
        if (nextIndex >= this.stations.length) nextIndex = 0;
        this.playStation(nextIndex);
    }

    playPreviousStation() {
        let prevIndex = this.currentStationIndex - 1;
        if (prevIndex < 0) prevIndex = this.stations.length - 1;
        this.playStation(prevIndex);
    }

    setVolume(value) {
        this.audio.volume = value;
    }

    // Audio Features
    setupAudioVisualizer() {
        if (this.audioContext) return;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = this.audioContext.createMediaElementSource(this.audio);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;

        // EQ setup
        const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
        let lastNode = source;
        frequencies.forEach((freq, i) => {
            const eq = this.audioContext.createBiquadFilter();
            eq.type = 'peaking';
            eq.frequency.value = freq;
            eq.Q.value = 1.5;
            eq.gain.value = 0;
            lastNode.connect(eq);
            lastNode = eq;
            this.eqBands.push(eq);
        });

        lastNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.drawVisualizer();
    }

    drawVisualizer() {
        requestAnimationFrame(() => this.drawVisualizer());
        if (!this.analyser) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        const canvas = this.ui.visualizer;
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;

        ctx.clearRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] * (height / 255);
            
            const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
            gradient.addColorStop(0, getComputedStyle(document.documentElement).getPropertyValue('--primary-color'));
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
            ctx.fillStyle = gradient;

            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }

    initEqualizer() {
        const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
        this.ui.eqBandsContainer.innerHTML = '';
        frequencies.forEach((freq, i) => {
            const band = document.createElement('div');
            band.className = 'eq-band';
            band.innerHTML = `
                <input type="range" min="-12" max="12" step="0.1" value="0" data-index="${i}">
                <label>${freq < 1000 ? freq : (freq/1000)+'k'} Hz</label>
            `;
            this.ui.eqBandsContainer.appendChild(band);
        });

        this.ui.eqBandsContainer.addEventListener('input', (e) => {
            if (e.target.type === 'range') {
                const index = e.target.dataset.index;
                const value = e.target.value;
                if (.eqBands[index]) {
                    this.eqBands[index].gain.value = value;
                }
                this.ui.eqPresetSelect.value = 'custom';
            }
        });

        this.ui.eqPresetSelect.addEventListener('change', (e) => this.applyEQPreset(e.target.value));
        this.ui.eqResetButton.addEventListener('click', () => this.applyEQPreset('flat'));
    }

    applyEQPreset(preset) {
        const presets = {
            'flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            'bass-boost': [6, 5, 4, 1, 0, -1, -2, -2, -1, 0],
            'rock': [4, 2, -2, -4, -2, 2, 4, 5, 5, 4],
            'pop': [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2],
            'vocal-booster': [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2]
        };
        const values = presets[preset];
        if (!values) return;

        this.ui.eqBandsContainer.querySelectorAll('input[type=range]').forEach((slider, i) => {
            slider.value = values[i];
            if (this.eqBands[i]) {
                this.eqBands[i].gain.value = values[i];
            }
        });
        this.ui.eqPresetSelect.value = preset;
    }

    toggleRecording() {
        if (!this.audioContext) {
            alert("Please play a station first to start recording.");
            return;
        }

        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            // Stop recording
            this.mediaRecorder.stop();
            this.ui.recordButton.classList.remove('recording');
        } else {
            // Start recording
            const destination = this.audioContext.createMediaStreamDestination();
            this.analyser.connect(destination); // Record post-EQ and visualizer
            this.mediaRecorder = new MediaRecorder(destination.stream);

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.recordedChunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `radiowave-recording-${new Date().toISOString()}.webm`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                this.recordedChunks = [];
            };

            this.mediaRecorder.start();
            this.ui.recordButton.classList.add('recording');
        }
    }

    // Theme & Style
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme');
        const isDark = document.body.classList.contains('dark-theme');
        this.ui.themeSwitcher.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    applyAccentColor(color) {
        document.documentElement.style.setProperty('--primary-color', color);
        this.ui.colorPicker.value = color;
        localStorage.setItem('accentColor', color);
    }

    // Data & Settings
    setSleepTimer(minutes) {
        clearTimeout(this.sleepTimer);
        if (minutes > 0) {
            this.sleepTimer = setTimeout(() => {
                this.togglePlayPause(false); // Pause the player
                this.ui.sleepTimerSelect.value = 0;
            }, minutes * 60 * 1000);
        }
    }

    setSleepTimer(minutes) {
        clearTimeout(this.sleepTimer);
        if (minutes > 0) {
            this.sleepTimer = setTimeout(() => {
                this.togglePlayPause(false); // Pause the player
                this.ui.sleepTimerSelect.value = 0;
            }, minutes * 60 * 1000);
        }
    }

    // UI Helpers
    showModal(modalElement) {
        this.hideAllModals();
        modalElement.classList.add('show');
    }

    hideAllModals() {
        document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
    }

    switchTab(tabId) {
        this.ui.tabLinks.forEach(link => link.classList.remove('active'));
        document.querySelector(`.tab-link[data-tab="${tabId}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
    }

    // Discovery Features
    populateGenres() {
        const genres = [...new Set(this.stations.map(s => s.genre).filter(g => g))];
        // Add some default genres
        ['Pop', 'Rock', 'Jazz', 'Electronic', 'Classical', 'Hip-Hop'].forEach(g => {
            if (!genres.includes(g)) genres.push(g);
        });
        this.ui.genreList.innerHTML = '';
        genres.sort().forEach(genre => {
            const li = document.createElement('li');
            li.textContent = genre;
            li.addEventListener('click', () => this.filterStationsByGenre(genre));
            this.ui.genreList.appendChild(li);
        });
    }

    filterStationsByGenre(genre) {
        this.switchTab('my-stations-tab');
        this.ui.searchInput.value = genre;
        this.filterStations(genre);
    }

    populateDiscoverStations() {
        // In a real app, this would be an API call.
        const discover = [
            { name: "Jazz Cafe", url: "http://192.99.35.215:5034/stream", logo: "https://cdn-radiotime-logos.tunein.com/s253631q.png", genre: "Jazz" },
            { name: "Classical FM", url: "http://media-ice.musicradio.com/ClassicFMMP3", logo: "https://cdn-radiotime-logos.tunein.com/s25365q.png", genre: "Classical" },
            { name: "Radio Paradise", url: "http://stream.radioparadise.com/flacm", logo: "https://i.radioparadise.com/img/logo-circle-250.png", genre: "Eclectic" },
        ];
        this.ui.discoverList.innerHTML = '';
        discover.forEach(station => {
            const li = document.createElement('li');
            li.innerHTML = `
                <img src="${station.logo}" alt="${station.name}">
                <span>${station.name}</span>
                <button class="add-from-discover"><i class="fas fa-plus"></i></button>
            `;
            li.querySelector('.add-from-discover').addEventListener('click', (e) => {
                e.stopPropagation();
                this.stations.push(station);
                this.saveStations();
                this.renderStationList();
                alert(`${station.name} added to your stations!`);
            });
            this.ui.discoverList.appendChild(li);
        });
    }

    updateAIRecommendations(genre) {
        if (!genre) {
            this.ui.aiRecommendations.style.display = 'none';
            return;
        }
        // Dummy recommendation logic
        const recommendations = this.stations.filter(s => s.genre === genre && s.name !== this.stations[this.currentStationIndex].name);
        if (recommendations.length > 0) {
            this.ui.recommendationsContainer.innerHTML = '';
            recommendations.slice(0, 2).forEach(station => {
                const div = document.createElement('div');
                div.className = 'rec-item';
                div.innerHTML = `<span>Based on ${genre}, try: <b>${station.name}</b></span>`;
                div.addEventListener('click', () => this.playStation(this.stations.indexOf(station)));
                this.ui.recommendationsContainer.appendChild(div);
            });
            this.ui.aiRecommendations.style.display = 'block';
        } else {
            this.ui.aiRecommendations.style.display = 'none';
        }
    }

    handleKeyPress(e) {
        // Don't interfere with text inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowRight':
                this.playNextStation();
                break;
            case 'ArrowLeft':
                this.playPreviousStation();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.ui.volumeSlider.value = Math.min(1, this.audio.volume + 0.05);
                this.setVolume(this.ui.volumeSlider.value);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.ui.volumeSlider.value = Math.max(0, this.audio.volume - 0.05);
                this.setVolume(this.ui.volumeSlider.value);
                break;
        }
    }
}