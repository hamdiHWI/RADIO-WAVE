<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Radio Wave</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="assets/css/style.css?v=<?php echo time(); ?>">
    <meta name="description" content="Radio Wave - The ultimate web radio experience.">
    <meta name="robots" content="noindex, nofollow">
</head>
<body class="dark-theme">

    <div id="app-container">
        <!-- Header -->
        <header id="main-header">
            <div class="logo">
                <i class="fas fa-broadcast-tower"></i>
                <h1>Radio Wave</h1>
            </div>
            <div class="header-controls">
                <button id="theme-switcher" class="control-button"><i class="fas fa-sun"></i></button>
                <button id="equalizer-button" class="control-button"><i class="fas fa-sliders-h"></i></button>
                <button id="settings-button" class="control-button"><i class="fas fa-cog"></i></button>
            </div>
        </header>

        <!-- Main Content -->
        <main id="main-content">
            <!-- Left Column: Player -->
            <div id="player-column">
                <div id="now-playing-card">
                    <div id="album-art-container">
                        <img src="https://picsum.photos/seed/radiowave/600" alt="Album Art" id="station-logo">
                        <canvas id="visualizer"></canvas>
                    </div>
                    <div id="station-info">
                        <h2 id="station-name">Select a Station</h2>
                        <p id="station-genre">Welcome to Radio Wave</p>
                        <p id="live-indicator"><span class="dot"></span> Live</p>
                    </div>
                </div>

                <div id="player-controls">
                    <button id="prev-station" class="control-button"><i class="fas fa-backward"></i></button>
                    <button id="play-pause-button" class="control-button main-button">
                        <i class="fas fa-play"></i>
                    </button>
                    <button id="next-station" class="control-button"><i class="fas fa-forward"></i></button>
                </div>

                <div id="volume-and-more">
                     <div id="volume-control">
                        <i class="fas fa-volume-down"></i>
                        <input type="range" id="volume-slider" min="0" max="1" step="0.01" value="0.8">
                        <i class="fas fa-volume-up"></i>
                    </div>
                    <button id="record-button" class="control-button"><i class="fas fa-circle"></i></button>
                </div>
            </div>

            <!-- Right Column: Stations -->
            <div id="stations-column">
                <div class="tabs">
                    <button class="tab-link active" data-tab="my-stations-tab">My Stations</button>
                    <button class="tab-link" data-tab="discover-tab">Discover</button>
                    <button class="tab-link" data-tab="genres-tab">Genres</button>
                </div>

                <div id="my-stations-tab" class="tab-content active">
                    <div class="station-list-header">
                        <input type="text" id="search-input" placeholder="Search your stations...">
                    </div>
                    <ul id="station-list">
                        <!-- Stations will be dynamically added here -->
                    </ul>
                </div>

                <div id="discover-tab" class="tab-content">
                     <div id="ai-recommendations">
                        <h3>Recommended For You</h3>
                        <div id="recommendations-container"></div>
                    </div>
                    <h3>Global Stations</h3>
                    <ul id="discover-list">
                       <!-- Discover stations will be added here -->
                    </ul>
                </div>
                 <div id="genres-tab" class="tab-content">
                    <ul id="genre-list">
                        <!-- Genres will be dynamically added here -->
                    </ul>
                </div>
            </div>
        </main>
    </div>

    <!-- Modals -->
    <div id="settings-modal" class="modal">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h2>Settings</h2>
            <div class="setting-item">
                <label for="color-picker">Accent Color:</label>
                <input type="color" id="color-picker" value="#FF8C00">
            </div>
            <div class="setting-item">
                <label for="sleep-timer-select">Sleep Timer:</label>
                <select id="sleep-timer-select">
                    <option value="0">Off</option>
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                </select>
            </div>
             
        </div>
    </div>

    

    <div id="equalizer-modal" class="modal">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h2>10-Band Graphic Equalizer</h2>
            <div id="equalizer-controls">
                <div class="eq-presets">
                    <select id="eq-preset-select">
                        <option value="custom">Custom</option>
                        <option value="flat">Flat</option>
                        <option value="bass-boost">Bass Boost</option>
                        <option value="rock">Rock</option>
                        <option value="pop">Pop</option>
                        <option value="vocal-booster">Vocal Booster</option>
                    </select>
                    <button id="eq-reset-button" class="control-button">Reset</button>
                </div>
                <div id="eq-bands-container">
                    <!-- EQ bands will be generated by JS -->
                </div>
            </div>
        </div>
    </div>

    <script src="assets/js/main.js?v=<?php echo time(); ?>"></script>
</body>
</html>
