<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Radio Wave</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/style.css?v=<?php echo time(); ?>">
</head>
<body>
    <div id="app-container">
        <!-- Sidebar with station lists -->
        <div id="sidebar">
            <div id="sidebar-header">
                <h1>Radio Wave</h1>
                <div class="theme-switcher">
                    <i class="fas fa-sun"></i>
                    <label class="switch">
                        <input type="checkbox" id="theme-toggle">
                        <span class="slider round"></span>
                    </label>
                    <i class="fas fa-moon"></i>
                </div>
            </div>
            <div id="sidebar-tabs">
                <button class="tab-link active" data-tab="my-stations-tab">My Stations</button>
                <button class="tab-link" data-tab="discover-tab">Discover</button>
            </div>

            <!-- My Stations Tab -->
            <div id="my-stations-tab" class="tab-content active">
                <div class="toolbar">
                    <div class="search-bar">
                        <i class="fas fa-search"></i>
                        <input type="text" id="search-input" placeholder="Search stations...">
                    </div>
                    <div class="filter-bar">
                        <select id="genre-filter">
                            <option value="all">All Genres</option>
                        </select>
                    </div>
                </div>
                <div id="station-list">
                    <!-- Stations will be dynamically loaded here -->
                </div>
                <button id="add-station-btn" class="sidebar-btn"><i class="fas fa-plus"></i> Add New Station</button>
            </div>

            <!-- Discover Tab -->
            <div id="discover-tab" class="tab-content">
                <div class="toolbar">
                    <div class="search-bar">
                        <i class="fas fa-search"></i>
                        <input type="text" id="discover-search-input" placeholder="Search global library...">
                    </div>
                </div>
                <div id="discover-list">
                    <!-- Global stations will be loaded here -->
                </div>
            </div>
        </div>

        <!-- Main content with player and visualizer -->
        <div id="main-content">
            <div id="visualizer-container">
                <canvas id="visualizer"></canvas>
            </div>
            <div id="player-container">
                <div id="now-playing">
                    <img id="station-art" src="assets/images/default-art.png" alt="Station Art">
                    <div id="station-info">
                        <h2 id="player-station-name">Select a Station</h2>
                        <p id="player-station-genre">---</p>
                    </div>
                </div>
                <div id="player-controls">
                    <button id="prev-station-btn" title="Previous Station"><i class="fas fa-backward"></i></button>
                    <button id="play-pause-btn" class="play-btn" title="Play/Pause"><i class="fas fa-play"></i></button>
                    <button id="next-station-btn" title="Next Station"><i class="fas fa-forward"></i></button>
                    <button id="record-btn" title="Start Recording"><i class="fas fa-circle"></i></button>
                </div>
                <div class="volume-control">
                    <i class="fas fa-volume-down"></i>
                    <input type="range" id="volume-slider" min="0" max="1" step="0.01" value="0.8">
                    <i class="fas fa-volume-up"></i>
                </div>
            </div>
            <div id="recommendations-container">
                <h3>You might also like...</h3>
                <div id="recommendations-list">
                    <!-- AI recommendations will appear here -->
                </div>
            </div>
        </div>

        <!-- App-wide controls -->
        <div id="app-controls">
            <button id="settings-btn" title="Settings"><i class="fas fa-cog"></i></button>
            <button id="equalizer-btn" title="Equalizer"><i class="fas fa-sliders-h"></i></button>
            <button id="sleep-timer-btn" title="Sleep Timer"><i class="fas fa-clock"></i></button>
            <button id="import-export-btn" title="Import/Export"><i class="fas fa-file-import"></i></button>
        </div>
    </div>

    <!-- Modals -->
    <!-- Add/Edit Station Modal -->
    <div id="station-modal" class="modal">
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <h2 id="modal-title">Add Station</h2>
            <form id="station-form">
                <input type="hidden" id="station-id">
                <label for="station-name">Name:</label>
                <input type="text" id="station-name" required>
                <label for="station-url">Stream URL:</label>
                <input type="url" id="station-url" required>
                <label for="station-genre">Genre:</label>
                <input type="text" id="station-genre" placeholder="e.g., Rock, Pop, News">
                <button type="submit" id="save-station-btn">Save Station</button>
            </form>
        </div>
    </div>

    <!-- Settings Modal -->
    <div id="settings-modal" class="modal">
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <h2>Settings</h2>
            <div class="color-picker-section">
                <h3>Customize Colors</h3>
                <div class="color-input">
                    <label for="primary-color">Primary:</label>
                    <input type="color" id="primary-color" value="#3498db">
                </div>
                <div class="color-input">
                    <label for="accent-color">Accent:</label>
                    <input type="color" id="accent-color" value="#2ecc71">
                </div>
                <div class="color-input">
                    <label for="text-color-light">Text (Light):</label>
                    <input type="color" id="text-color-light" value="#2c3e50">
                </div>
                 <div class="color-input">
                    <label for="text-color-dark">Text (Dark):</label>
                    <input type="color" id="text-color-dark" value="#ecf0f1">
                </div>
                <button id="reset-colors-btn">Reset to Default</button>
            </div>
        </div>
    </div>

    <!-- Sleep Timer Modal -->
    <div id="sleep-timer-modal" class="modal">
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <h2>Sleep Timer</h2>
            <p>Stop playback after:</p>
            <div id="timer-options">
                <button class="timer-option" data-minutes="15">15 min</button>
                <button class="timer-option" data-minutes="30">30 min</button>
                <button class="timer-option" data-minutes="60">60 min</button>
            </div>
            <p id="timer-display">Timer not set</p>
            <button id="cancel-timer-btn">Cancel Timer</button>
        </div>
    </div>

    <!-- Import/Export Modal -->
    <div id="import-export-modal" class="modal">
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <h2>Import / Export</h2>
            <div class="import-section">
                <h3>Import Stations</h3>
                <p>Load stations from a `.json` file.</p>
                <input type="file" id="import-file-input" accept=".json">
                <button id="import-btn">Import</button>
            </div>
            <div class="export-section">
                <h3>Export Stations</h3>
                <p>Save your current station list to a file.</p>
                <button id="export-btn">Export</button>
            </div>
        </div>
    </div>

    <!-- Equalizer Modal -->
    <div id="equalizer-modal" class="modal">
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <h2>Graphic Equalizer</h2>
            <div id="equalizer-controls">
                <div class="eq-presets">
                    <label for="eq-presets-select">Presets:</label>
                    <select id="eq-presets-select">
                        <option value="custom">Custom</option>
                        <option value="flat">Flat</option>
                        <option value="bass-boost">Bass Boost</option>
                        <option value="rock">Rock</option>
                        <option value="pop">Pop</option>
                        <option value="vocal-booster">Vocal Booster</option>
                    </select>
                </div>
                <div id="eq-bands">
                    <!-- EQ sliders will be generated by JS -->
                </div>
                <button id="reset-eq-btn">Reset EQ</button>
            </div>
        </div>
    </div>

    <audio id="audio-player" crossOrigin="anonymous"></audio>
    <script src="assets/js/main.js?v=<?php echo time(); ?>"></script>
</body>
</html>