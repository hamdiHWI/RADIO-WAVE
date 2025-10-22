class RadioWaveApp {
    constructor() {
        this.audio = document.getElementById('audio-player');
        this.stations = [];
        this.currentStationIndex = -1;
        this.discoverStations = this.getDiscoverStations();
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.sleepTimer = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.eqBands = [];

        this.loadStations();
        this.loadTheme();
        this.loadColors();
        this.initUI();
        this.bindEvents();
        this.renderStations();
        this.renderDiscoverStations();
    }

    initUI() {
        // Cache all UI elements
        this.ui = {
            stationList: document.getElementById('station-list'),
            discoverList: document.getElementById('discover-list'),
            playPauseBtn: document.getElementById('play-pause-btn'),
            nextBtn: document.getElementById('next-station-btn'),
            prevBtn: document.getElementById('prev-station-btn'),
            recordBtn: document.getElementById('record-btn'),
            volumeSlider: document.getElementById('volume-slider'),
            playerStationName: document.getElementById('player-station-name'),
            playerStationGenre: document.getElementById('player-station-genre'),
            stationArt: document.getElementById('station-art'),
            searchInput: document.getElementById('search-input'),
            genreFilter: document.getElementById('genre-filter'),
            themeToggle: document.getElementById('theme-toggle'),
            visualizer: document.getElementById('visualizer'),
            // Modals
            stationModal: document.getElementById('station-modal'),
            settingsModal: document.getElementById('settings-modal'),
            sleepTimerModal: document.getElementById('sleep-timer-modal'),
            importExportModal: document.getElementById('import-export-modal'),
            equalizerModal: document.getElementById('equalizer-modal'),
            // Modal Triggers
            addStationBtn: document.getElementById('add-station-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            sleepTimerBtn: document.getElementById('sleep-timer-btn'),
            importExportBtn: document.getElementById('import-export-btn'),
            equalizerBtn: document.getElementById('equalizer-btn'),
            // Tabs
            sidebarTabs: document.querySelectorAll('.tab-link'),
            tabContents: document.querySelectorAll('.tab-content'),
            // Recommendations
            recommendationsList: document.getElementById('recommendations-list'),
            // EQ
            eqBandsContainer: document.getElementById('eq-bands'),
            eqPresetsSelect: document.getElementById('eq-presets-select'),
            resetEqBtn: document.getElementById('reset-eq-btn'),
        };

        this.canvasCtx = this.ui.visualizer.getContext('2d');
    }

    bindEvents() {
        // Player controls
        this.ui.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.ui.nextBtn.addEventListener('click', () => this.playNext());
        this.ui.prevBtn.addEventListener('click', () => this.playPrevious());
        this.ui.recordBtn.addEventListener('click', () => this.toggleRecording());
        this.ui.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));

        // Station list interactions
        this.ui.stationList.addEventListener('click', (e) => this.handleStationListClick(e));
        this.ui.discoverList.addEventListener('click', (e) => this.handleDiscoverListClick(e));

        // Search and filter
        this.ui.searchInput.addEventListener('input', (e) => this.renderStations(e.target.value, this.ui.genreFilter.value));
        this.ui.genreFilter.addEventListener('change', (e) => this.renderStations(this.ui.searchInput.value, e.target.value));

        // Theme and settings
        this.ui.themeToggle.addEventListener('change', () => this.toggleTheme());
        this.bindModalEvents();
        this.bindColorPickerEvents();
        this.bindTimerEvents();
        this.bindImportExportEvents();
        this.bindEqualizerEvents();

        // Tabs
        this.ui.sidebarTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
        
        // Audio events
        this.audio.addEventListener('play', () => this.ui.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>');
        this.audio.addEventListener('pause', () => this.ui.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>');

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    bindModalEvents() {
        const modals = document.querySelectorAll('.modal');
        const closeBtns = document.querySelectorAll('.close-btn');

        this.ui.addStationBtn.addEventListener('click', () => this.openStationModal());
        this.ui.settingsBtn.addEventListener('click', () => this.ui.settingsModal.classList.add('active'));
        this.ui.equalizerBtn.addEventListener('click', () => this.ui.equalizerModal.classList.add('active'));
        this.ui.sleepTimerBtn.addEventListener('click', () => this.ui.sleepTimerModal.classList.add('active'));
        this.ui.importExportBtn.addEventListener('click', () => this.ui.importExportModal.classList.add('active'));

        closeBtns.forEach(btn => btn.addEventListener('click', () => this.closeAllModals()));
        modals.forEach(modal => modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeAllModals();
        }));

        document.getElementById('station-form').addEventListener('submit', (e) => this.saveStation(e));
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    }

    /* --- Station Management --- */

    loadStations() {
        const savedStations = localStorage.getItem('radioWaveStations');
        this.stations = savedStations ? JSON.parse(savedStations) : this.getDefaultStations();
        this.updateGenreFilter();
    }

    saveStations() {
        localStorage.setItem('radioWaveStations', JSON.stringify(this.stations));
        this.updateGenreFilter();
        this.renderStations();
    }

    renderStations(searchTerm = '', genreTerm = 'all') {
        this.ui.stationList.innerHTML = '';
        const filteredStations = this.stations.filter(station => {
            const matchesSearch = station.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesGenre = genreTerm === 'all' || station.genre.toLowerCase() === genreTerm.toLowerCase();
            return matchesSearch && matchesGenre;
        });

        if (filteredStations.length === 0) {
            this.ui.stationList.innerHTML = '<p style="text-align:center; opacity: 0.7;">No stations found.</p>';
            return;
        }

        filteredStations.forEach((station, index) => {
            const isPlaying = this.currentStationIndex === this.stations.indexOf(station) && !this.audio.paused;
            const item = document.createElement('div');
            item.className = `station-item ${isPlaying ? 'playing' : ''}`;
            item.dataset.id = station.id;

            item.innerHTML = `
                <div class="station-item-info">
                    <h3>${station.name}</h3>
                    <p>${station.genre || 'No Genre'}</p>
                </div>
                <div class="station-item-controls">
                    <button class="edit-btn"><i class="fas fa-pencil-alt"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            `;
            this.ui.stationList.appendChild(item);
        });
    }

    handleStationListClick(e) {
        const stationItem = e.target.closest('.station-item');
        if (!stationItem) return;

        const stationId = stationItem.dataset.id;
        const stationIndex = this.stations.findIndex(s => s.id == stationId);

        if (e.target.closest('.edit-btn')) {
            this.openStationModal(stationId);
        } else if (e.target.closest('.delete-btn')) {
            if (confirm('Are you sure you want to delete this station?')) {
                this.stations.splice(stationIndex, 1);
                this.saveStations();
            }
        } else {
            this.playStation(stationIndex);
        }
    }

    openStationModal(stationId = null) {
        const form = document.getElementById('station-form');
        const modalTitle = document.getElementById('modal-title');
        form.reset();
        document.getElementById('station-id').value = '';

        if (stationId) {
            const station = this.stations.find(s => s.id == stationId);
            modalTitle.textContent = 'Edit Station';
            document.getElementById('station-id').value = station.id;
            document.getElementById('station-name').value = station.name;
            document.getElementById('station-url').value = station.url;
            document.getElementById('station-genre').value = station.genre;
        } else {
            modalTitle.textContent = 'Add Station';
        }
        this.ui.stationModal.classList.add('active');
    }

    saveStation(e) {
        e.preventDefault();
        const id = document.getElementById('station-id').value;
        const newStation = {
            id: id || Date.now(),
            name: document.getElementById('station-name').value,
            url: document.getElementById('station-url').value,
            genre: document.getElementById('station-genre').value,
        };

        if (id) {
            const index = this.stations.findIndex(s => s.id == id);
            this.stations[index] = newStation;
        } else {
            this.stations.push(newStation);
        }
        this.saveStations();
        this.closeAllModals();
    }

    updateGenreFilter() {
        const genres = ['all', ...new Set(this.stations.map(s => s.genre).filter(g => g))];
        this.ui.genreFilter.innerHTML = genres.map(g => `<option value="${g}">${g.charAt(0).toUpperCase() + g.slice(1)}</option>`).join('');
    }

    /* --- Player --- */

    playStation(index) {
        if (index < 0 || index >= this.stations.length) return;
        this.currentStationIndex = index;
        const station = this.stations[index];
        this.audio.src = station.url;
        this.audio.play().catch(e => {
            alert("Failed to play station. The stream might be offline or blocked.");
            console.error("Playback Error:", e);
        });
        this.updatePlayerUI(station);
        this.renderStations();
        this.setupAudioPipeline();
        this.updateRecommendations();
    }

    togglePlayPause() {
        if (this.audio.paused) {
            if (this.currentStationIndex === -1 && this.stations.length > 0) {
                this.playStation(0);
            } else {
                this.audio.play();
            }
        } else {
            this.audio.pause();
        }
        this.renderStations();
    }

    playNext() {
        let nextIndex = this.currentStationIndex + 1;
        if (nextIndex >= this.stations.length) nextIndex = 0;
        this.playStation(nextIndex);
    }

    playPrevious() {
        let prevIndex = this.currentStationIndex - 1;
        if (prevIndex < 0) prevIndex = this.stations.length - 1;
        this.playStation(prevIndex);
    }

    setVolume(value) {
        this.audio.volume = value;
    }

    updatePlayerUI(station) {
        this.ui.playerStationName.textContent = station.name;
        this.ui.playerStationGenre.textContent = station.genre || '---';
        this.ui.stationArt.src = 'assets/images/default-art.png';
    }

    /* --- Audio Pipeline (Visualizer & EQ) --- */

    setupAudioPipeline() {
        if (this.audioContext) return; // Already set up
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.source = this.audioContext.createMediaElementSource(this.audio);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;

            this.initEqualizer();

            // Connect nodes: source -> EQ -> analyser -> destination
            let lastNode = this.source;
            this.eqBands.forEach(band => {
                lastNode.connect(band);
                lastNode = band;
            });
            lastNode.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.drawVisualizer();
        } catch (e) {
            console.error('Web Audio API setup failed.', e);
            this.ui.visualizer.style.display = 'none';
            this.ui.equalizerBtn.style.display = 'none';
        }
    }

    drawVisualizer() {
        requestAnimationFrame(() => this.drawVisualizer());
        if (!this.analyser) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        this.canvasCtx.fillStyle = '#000';
        this.canvasCtx.fillRect(0, 0, this.ui.visualizer.width, this.ui.visualizer.height);

        const barWidth = (this.ui.visualizer.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i];
            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
            const gradient = this.canvasCtx.createLinearGradient(0, this.ui.visualizer.height, 0, this.ui.visualizer.height - barHeight);
            gradient.addColorStop(0, primaryColor);
            gradient.addColorStop(1, accentColor);
            this.canvasCtx.fillStyle = gradient;
            this.canvasCtx.fillRect(x, this.ui.visualizer.height - barHeight / 2, barWidth, barHeight / 2);
            x += barWidth + 1;
        }
    }

    /* --- Equalizer --- */

    initEqualizer() {
        const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
        this.ui.eqBandsContainer.innerHTML = '';
        frequencies.forEach((freq, i) => {
            const band = this.audioContext.createBiquadFilter();
            band.type = 'peaking';
            band.frequency.value = freq;
            band.Q.value = 1;
            band.gain.value = 0;
            this.eqBands.push(band);

            const bandElement = document.createElement('div');
            bandElement.className = 'eq-band';
            bandElement.innerHTML = `
                <input type="range" min="-20" max="20" step="1" value="0" data-index="${i}">
                <label>${freq < 1000 ? freq + 'Hz' : (freq / 1000) + 'k'}</label>
            `;
            this.ui.eqBandsContainer.appendChild(bandElement);
        });
    }

    bindEqualizerEvents() {
        this.ui.eqBandsContainer.addEventListener('input', (e) => {
            if (e.target.type === 'range') {
                const index = e.target.dataset.index;
                const value = e.target.value;
                this.eqBands[index].gain.value = value;
                this.ui.eqPresetsSelect.value = 'custom';
            }
        });
        this.ui.eqPresetsSelect.addEventListener('change', (e) => this.applyEQPreset(e.target.value));
        this.ui.resetEqBtn.addEventListener('click', () => this.applyEQPreset('flat'));
    }

    applyEQPreset(preset) {
        const presets = {
            'flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            'bass-boost': [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
            'rock': [4, 2, -2, -3, -1, 2, 4, 5, 5, 6],
            'pop': [-1, -2, 0, 2, 4, 4, 2, 0, -1, -2],
            'vocal-booster': [0, 0, 0, -2, -2, 4, 4, 2, 0, 0],
            'custom': null
        };
        const values = presets[preset];
        if (!values) return;

        this.ui.eqPresetsSelect.value = preset;
        const sliders = this.ui.eqBandsContainer.querySelectorAll('input[type="range"]');
        sliders.forEach((slider, i) => {
            slider.value = values[i];
            this.eqBands[i].gain.value = values[i];
        });
    }

    /* --- Recording --- */

    toggleRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.ui.recordBtn.classList.remove('recording');
            this.ui.recordBtn.title = 'Start Recording';
        } else {
            if (!this.source) {
                alert('Please start playing a station first.');
                return;
            }
            try {
                const dest = this.audioContext.createMediaStreamDestination();
                this.analyser.connect(dest); // Record post-EQ and post-analyser
                this.mediaRecorder = new MediaRecorder(dest.stream);
                
                this.recordedChunks = [];
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
                };

                this.mediaRecorder.start();
                this.ui.recordBtn.classList.add('recording');
                this.ui.recordBtn.title = 'Stop Recording';
            } catch (e) {
                alert('Recording failed to start. Your browser may not support it.');
                console.error('Recording Error:', e);
            }
        }
    }

    /* --- Keyboard Shortcuts --- */
    handleKeyPress(e) {
        // Ignore key presses in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowRight':
                this.playNext();
                break;
            case 'ArrowLeft':
                this.playPrevious();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setVolume(Math.min(1, this.audio.volume + 0.05));
                this.ui.volumeSlider.value = this.audio.volume;
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.setVolume(Math.max(0, this.audio.volume - 0.05));
                this.ui.volumeSlider.value = this.audio.volume;
                break;
        }
    }

    /* --- Theme & Colors --- */

    loadTheme() {
        const theme = localStorage.getItem('radioWaveTheme') || 'dark';
        document.body.className = theme + '-theme';
        this.ui.themeToggle.checked = theme === 'dark';
    }

    toggleTheme() {
        const isDark = this.ui.themeToggle.checked;
        const theme = isDark ? 'dark' : 'light';
        document.body.className = theme + '-theme';
        localStorage.setItem('radioWaveTheme', theme);
    }

    bindColorPickerEvents() {
        const root = document.documentElement;
        const colorInputs = {
            '--primary-color': document.getElementById('primary-color'),
            '--accent-color': document.getElementById('accent-color'),
            '--light-text': document.getElementById('text-color-light'),
            '--dark-text': document.getElementById('text-color-dark'),
        };

        for (const [prop, input] of Object.entries(colorInputs)) {
            input.addEventListener('input', (e) => {
                root.style.setProperty(prop, e.target.value);
                this.saveColors();
            });
        }

        document.getElementById('reset-colors-btn').addEventListener('click', () => this.resetColors());
    }

    saveColors() {
        const rootStyles = getComputedStyle(document.documentElement);
        const colors = {
            primary: rootStyles.getPropertyValue('--primary-color').trim(),
            accent: rootStyles.getPropertyValue('--accent-color').trim(),
            textLight: rootStyles.getPropertyValue('--light-text').trim(),
            textDark: rootStyles.getPropertyValue('--dark-text').trim(),
        };
        localStorage.setItem('radioWaveColors', JSON.stringify(colors));
    }

    loadColors() {
        const savedColors = JSON.parse(localStorage.getItem('radioWaveColors'));
        if (savedColors) {
            const root = document.documentElement;
            root.style.setProperty('--primary-color', savedColors.primary);
            root.style.setProperty('--accent-color', savedColors.accent);
            root.style.setProperty('--light-text', savedColors.textLight);
            root.style.setProperty('--dark-text', savedColors.textDark);

            document.getElementById('primary-color').value = savedColors.primary;
            document.getElementById('accent-color').value = savedColors.accent;
            document.getElementById('text-color-light').value = savedColors.textLight;
            document.getElementById('text-color-dark').value = savedColors.textDark;
        }
    }

    resetColors() {
        localStorage.removeItem('radioWaveColors');
        window.location.reload();
    }

    /* --- Advanced Features --- */

    switchTab(tabId) {
        this.ui.tabContents.forEach(content => content.classList.remove('active'));
        this.ui.sidebarTabs.forEach(tab => tab.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        document.querySelector(`[data-tab='${tabId}']`).classList.add('active');
    }

    bindTimerEvents() {
        const timerDisplay = document.getElementById('timer-display');
        document.querySelectorAll('.timer-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes, 10);
                this.setSleepTimer(minutes);
                timerDisplay.textContent = `Stops in ${minutes} minutes.`;
            });
        });
        document.getElementById('cancel-timer-btn').addEventListener('click', () => {
            this.cancelSleepTimer();
            timerDisplay.textContent = 'Timer not set';
        });
    }

    setSleepTimer(minutes) {
        this.cancelSleepTimer();
        this.sleepTimer = setTimeout(() => {
            this.audio.pause();
            document.getElementById('timer-display').textContent = 'Timer finished';
        }, minutes * 60 * 1000);
    }

    cancelSleepTimer() {
        if (this.sleepTimer) {
            clearTimeout(this.sleepTimer);
            this.sleepTimer = null;
        }
    }

    bindImportExportEvents() {
        document.getElementById('export-btn').addEventListener('click', () => this.exportStations());
        document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file-input').click());
        document.getElementById('import-file-input').addEventListener('change', (e) => this.importStations(e));
    }

    exportStations() {
        const dataStr = JSON.stringify(this.stations, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'radiowave_stations.json';
        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    importStations(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedStations = JSON.parse(e.target.result);
                if (Array.isArray(importedStations)) {
                    this.stations = importedStations;
                    this.saveStations();
                    this.closeAllModals();
                    alert('Stations imported successfully!');
                } else {
                    alert('Invalid file format.');
                }
            } catch (err) {
                alert('Error reading file: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    /* --- Discovery & Recommendations --- */

    renderDiscoverStations() {
        this.ui.discoverList.innerHTML = '';
        this.discoverStations.forEach(station => {
            const item = document.createElement('div');
            item.className = 'discover-item';
            item.dataset.name = station.name;
            item.dataset.url = station.url;
            item.dataset.genre = station.genre;
            item.innerHTML = `
                <div class="station-item-info">
                    <h3>${station.name}</h3>
                    <p>${station.genre}</p>
                </div>
                <div class="discover-item-controls">
                    <button class="add-from-discover-btn"><i class="fas fa-plus-circle"></i></button>
                </div>
            `;
            this.ui.discoverList.appendChild(item);
        });
    }

    handleDiscoverListClick(e) {
        const item = e.target.closest('.discover-item');
        if (!item) return;

        const newStation = {
            id: Date.now(),
            name: item.dataset.name,
            url: item.dataset.url,
            genre: item.dataset.genre,
        };

        if (this.stations.some(s => s.url === newStation.url)) {
            alert('This station is already in your list.');
            return;
        }

        this.stations.push(newStation);
        this.saveStations();
        alert(`'${newStation.name}' has been added to your stations!`);
        this.switchTab('my-stations-tab');
    }

    updateRecommendations() {
        this.ui.recommendationsList.innerHTML = '';
        if (this.currentStationIndex === -1) return;

        const currentGenre = this.stations[this.currentStationIndex].genre;
        if (!currentGenre) return;

        const recommendations = this.discoverStations.filter(s => s.genre.toLowerCase() === currentGenre.toLowerCase() && !this.stations.some(myS => myS.url === s.url)).slice(0, 3);

        if (recommendations.length === 0) {
            this.ui.recommendationsList.innerHTML = '<p style="opacity:0.7">No recommendations right now.</p>';
            return;
        }

        recommendations.forEach(station => {
            const item = document.createElement('div');
            item.className = 'rec-item';
            item.dataset.name = station.name;
            item.dataset.url = station.url;
            item.dataset.genre = station.genre;
            item.innerHTML = `<h4>${station.name}</h4><p>${station.genre}</p>`;
            item.addEventListener('click', () => {
                if (confirm(`Add '${station.name}' to your stations?`)) {
                    this.handleDiscoverListClick({ target: item });
                }
            });
            this.ui.recommendationsList.appendChild(item);
        });
    }

    /* --- Default Data --- */

    getDefaultStations() {
        return [
            { id: 1, name: 'Lofi Girl', url: 'https://stream.lofigirl.com/lofi', genre: 'Lofi' },
            { id: 2, name: 'BBC Radio 1', url: 'http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one', genre: 'Pop' },
            { id: 3, name: 'KEXP 90.3 FM', url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3', genre: 'Indie' },
        ];
    }

    getDiscoverStations() {
        return [
            { name: 'NTS Radio', url: 'http://stream-relay-geo.ntslive.net/stream', genre: 'Electronic' },
            { name: 'Dublab', url: 'https://dublab.out.airtime.pro/dublab_128.mp3', genre: 'Eclectic' },
            { name: 'Worldwide FM', url: 'https://worldwidefm.out.airtime.pro/worldwidefm_128.mp3', genre: 'World' },
            { name: 'The Lot Radio', url: 'https://thelot.out.airtime.pro/thelot_128.mp3', genre: 'Dance' },
            { name: 'Rinse FM', url: 'https://rinse.fm/streams/rinse.mp3', genre: 'Grime' },
            { name: 'Jazz24', url: 'https://jazz24.streamguys1.com/jazz24.mp3', genre: 'Jazz' },
            { name: 'SomaFM: Groove Salad', url: 'http://ice1.somafm.com/groovesalad-128-mp3', genre: 'Ambient' },
            { name: 'Classical KUSC', url: 'https://kusc.streamguys1.com/kusc-128.mp3', genre: 'Classical' },
            { name: 'Rock FM', url: 'https://live.rockfm.ro/rockfm.aacp', genre: 'Rock' },
            { name: 'Radio Paradise', url: 'http://stream.radioparadise.com/mp3-128', genre: 'Rock' },
        ];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RadioWaveApp();
});