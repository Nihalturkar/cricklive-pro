/* ============ DASHBOARD VIEW ============ */
var DashboardView = (function () {

    function render() {
        var app = document.getElementById('app');
        var hasKey = !!CricketAPI.getApiKey();

        // If no API key, show setup page first
        if (!hasKey) {
            renderSetupPage(app);
            return;
        }

        app.innerHTML = '<div class="container"><div class="loading-spinner"></div><p class="text-center text-muted" style="margin-top:8px">Loading live matches...</p></div>';

        CricketAPI.getCurrentMatches().then(function (apiMatches) {
            var localMatches = Store.getRecentMatches(10);
            var liveLocal = localMatches.filter(function (m) { return m.status === 'live'; });
            var otherLocal = localMatches.filter(function (m) { return m.status !== 'live'; });
            var usage = CricketAPI.getUsage();

            var html = '<div class="container">';

            // Hero
            html += '<div class="dashboard-hero">';
            html += '<div class="hero-left">';
            html += '<h1 class="hero-title">&#127951; Cricket Live</h1>';
            html += '<p class="hero-subtitle">Real-time scores from around the world</p>';
            html += '</div>';
            html += '<div class="hero-actions">';
            html += '<a href="#/teams" class="btn btn-outline btn-sm">&#128101; Teams</a>';
            html += '<a href="#/tournaments" class="btn btn-outline btn-sm">&#127942; Tournaments</a>';
            html += '</div>';
            html += '</div>';

            // API usage bar
            html += '<div class="api-usage-bar">';
            html += '<span>API: ' + usage.used + '/' + usage.limit + ' today</span>';
            html += '<div class="api-usage-track"><div class="api-usage-fill" style="width:' + Math.min(100, (usage.used / usage.limit) * 100) + '%"></div></div>';
            html += '<button class="btn btn-ghost btn-sm" style="font-size:.7rem" onclick="DashboardView.changeApiKey()">Change Key</button>';
            html += '</div>';

            // Separate matches
            var liveApi = apiMatches.filter(function (m) { return m.matchStarted && !m.matchEnded; });
            var upcomingApi = apiMatches.filter(function (m) { return !m.matchStarted && !m.matchEnded; });
            var completedApi = apiMatches.filter(function (m) { return m.matchEnded; });

            // Live Matches
            if (liveApi.length > 0) {
                html += '<div class="section-header"><h2 class="section-title"><span class="live-dot"></span> Live Matches (' + liveApi.length + ')</h2></div>';
                html += '<div class="grid-auto stagger-children">';
                liveApi.forEach(function (m) { html += MatchCard.renderApiCard(m); });
                html += '</div>';
            }

            // Live Local Matches
            if (liveLocal.length > 0) {
                html += '<div class="section-header" style="margin-top:32px"><h2 class="section-title"><span class="live-dot"></span> Local Live</h2></div>';
                html += '<div class="grid-auto stagger-children">';
                liveLocal.forEach(function (m) { html += MatchCard.renderLocalCard(m); });
                html += '</div>';
            }

            // Upcoming
            if (upcomingApi.length > 0) {
                html += '<div class="section-header" style="margin-top:32px"><h2 class="section-title">&#128197; Upcoming</h2></div>';
                html += '<div class="grid-auto stagger-children">';
                upcomingApi.slice(0, 6).forEach(function (m) { html += MatchCard.renderApiCard(m); });
                html += '</div>';
            }

            // Recent Completed
            if (completedApi.length > 0) {
                html += '<div class="section-header" style="margin-top:32px"><h2 class="section-title">&#9989; Recent Results</h2></div>';
                html += '<div class="grid-auto stagger-children">';
                completedApi.slice(0, 6).forEach(function (m) { html += MatchCard.renderApiCard(m); });
                html += '</div>';
            }

            // Local matches
            if (otherLocal.length > 0) {
                html += '<div class="section-header" style="margin-top:32px"><h2 class="section-title">Local Matches</h2></div>';
                html += '<div class="grid-auto stagger-children">';
                otherLocal.forEach(function (m) { html += MatchCard.renderLocalCard(m); });
                html += '</div>';
            }

            // Empty API state
            if (apiMatches.length === 0 && localMatches.length === 0) {
                html += '<div class="empty-state">';
                html += '<div class="empty-state-icon">&#127951;</div>';
                html += '<div class="empty-state-title">No Matches Found</div>';
                html += '<div class="empty-state-desc">API key may be invalid or no matches are currently available. Check your key or try again later.</div>';
                html += '<br><button class="btn btn-primary" onclick="DashboardView.changeApiKey()">Check API Key</button>';
                html += '</div>';
            }

            html += '</div>';
            app.innerHTML = html;
        });
    }

    function renderSetupPage(app) {
        var html = '<div class="container" style="max-width:550px;margin:0 auto;padding-top:60px">';

        html += '<div style="text-align:center;margin-bottom:32px">';
        html += '<div style="font-size:4rem;margin-bottom:12px">&#127951;</div>';
        html += '<h1 style="font-size:1.8rem;font-weight:800;margin-bottom:8px">CrickLive Pro</h1>';
        html += '<p style="color:var(--text-secondary)">Live Cricket Scores & Local Tournaments</p>';
        html += '</div>';

        html += '<div class="card" style="padding:28px">';
        html += '<h2 style="font-size:1.1rem;font-weight:700;margin-bottom:16px">&#128273; Setup Live Scores</h2>';
        html += '<p style="color:var(--text-secondary);font-size:.85rem;line-height:1.7;margin-bottom:20px">';
        html += 'To get real-time cricket scores, you need a <strong>free API key</strong> from CricketData.org:';
        html += '</p>';

        html += '<div class="setup-steps">';
        html += '<div class="setup-step">';
        html += '<div class="setup-step-num">1</div>';
        html += '<div>Go to <strong>cricketdata.org</strong> and click <strong>Sign Up</strong></div>';
        html += '</div>';
        html += '<div class="setup-step">';
        html += '<div class="setup-step-num">2</div>';
        html += '<div>Create a free account (email + password)</div>';
        html += '</div>';
        html += '<div class="setup-step">';
        html += '<div class="setup-step-num">3</div>';
        html += '<div>Copy your <strong>API Key</strong> from the dashboard</div>';
        html += '</div>';
        html += '<div class="setup-step">';
        html += '<div class="setup-step-num">4</div>';
        html += '<div>Paste it below and click <strong>Start</strong></div>';
        html += '</div>';
        html += '</div>';

        html += '<div class="form-group" style="margin-top:20px">';
        html += '<label class="form-label">Your API Key</label>';
        html += '<input type="text" class="form-input" id="apiKeyInput" placeholder="e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890" style="font-family:monospace;font-size:.85rem">';
        html += '</div>';

        html += '<button class="btn btn-success btn-lg" style="width:100%;margin-top:8px" onclick="DashboardView.saveApiKey()" id="setupStartBtn">&#127951; Start - Get Live Scores</button>';
        html += '<div id="setupError" style="display:none;color:var(--accent-red);font-size:.8rem;text-align:center;margin-top:10px"></div>';

        html += '<div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border-color);text-align:center">';
        html += '<p style="color:var(--text-muted);font-size:.78rem">Free plan: 100 API calls/day &bull; All match data &bull; No credit card needed</p>';
        html += '</div>';
        html += '</div>';

        // Skip option for local-only use
        html += '<div style="text-align:center;margin-top:20px">';
        html += '<button class="btn btn-ghost btn-sm" onclick="DashboardView.skipSetup()">Skip - Use only for local tournaments</button>';
        html += '</div>';

        html += '</div>';
        app.innerHTML = html;
    }

    function saveApiKey() {
        var input = document.getElementById('apiKeyInput');
        if (!input || !input.value.trim()) {
            Toast.show({ message: 'Please enter an API key', type: 'error' });
            return;
        }

        var key = input.value.trim();
        var btn = document.getElementById('setupStartBtn');
        if (btn) btn.textContent = 'Validating...';

        CricketAPI.validateApiKey(key).then(function (valid) {
            if (valid) {
                var settings = Store.getSettings();
                settings.apiKey = key;
                Store.saveSettings(settings);
                Toast.show({ message: 'API Key verified! Loading live matches...', type: 'success', duration: 3000 });
                setTimeout(function () { render(); ScoreTicker.update(); }, 800);
            } else {
                if (btn) btn.textContent = '&#127951; Start - Get Live Scores';
                var errDiv = document.getElementById('setupError');
                if (errDiv) {
                    errDiv.style.display = 'block';
                    errDiv.textContent = 'Invalid API key. Please check and try again.';
                }
                Toast.show({ message: 'Invalid API key!', type: 'error' });
            }
        });
    }

    function skipSetup() {
        var settings = Store.getSettings();
        settings.apiKey = '';
        settings.skippedSetup = true;
        Store.saveSettings(settings);
        renderSkippedDashboard();
    }

    function renderSkippedDashboard() {
        var app = document.getElementById('app');
        var localMatches = Store.getRecentMatches(10);
        var liveLocal = localMatches.filter(function (m) { return m.status === 'live'; });
        var otherLocal = localMatches.filter(function (m) { return m.status !== 'live'; });

        var html = '<div class="container">';

        html += '<div class="dashboard-hero">';
        html += '<div class="hero-left">';
        html += '<h1 class="hero-title">&#127951; Cricket Live</h1>';
        html += '<p class="hero-subtitle">Local tournaments & scoring</p>';
        html += '</div>';
        html += '<div class="hero-actions">';
        html += '<button class="btn btn-outline btn-sm" onclick="DashboardView.showSetup()">&#128273; Add API Key</button>';
        html += '<a href="#/teams" class="btn btn-outline btn-sm">&#128101; Teams</a>';
        html += '<a href="#/tournaments" class="btn btn-outline btn-sm">&#127942; Tournaments</a>';
        html += '</div>';
        html += '</div>';

        if (liveLocal.length > 0) {
            html += '<div class="section-header"><h2 class="section-title"><span class="live-dot"></span> Local Live</h2></div>';
            html += '<div class="grid-auto stagger-children">';
            liveLocal.forEach(function (m) { html += MatchCard.renderLocalCard(m); });
            html += '</div>';
        }

        if (otherLocal.length > 0) {
            html += '<div class="section-header" style="margin-top:24px"><h2 class="section-title">Local Matches</h2></div>';
            html += '<div class="grid-auto stagger-children">';
            otherLocal.forEach(function (m) { html += MatchCard.renderLocalCard(m); });
            html += '</div>';
        }

        if (localMatches.length === 0) {
            html += '<div class="empty-state">';
            html += '<div class="empty-state-icon">&#127951;</div>';
            html += '<div class="empty-state-title">No Local Matches Yet</div>';
            html += '<div class="empty-state-desc">Create teams and start a tournament!</div>';
            html += '<br><a href="#/teams" class="btn btn-primary">&#128101; Create Teams</a>';
            html += '</div>';
        }

        html += '</div>';
        app.innerHTML = html;
    }

    function changeApiKey() {
        var settings = Store.getSettings();
        settings.apiKey = '';
        Store.saveSettings(settings);
        render();
    }

    function showSetup() {
        var settings = Store.getSettings();
        settings.skippedSetup = false;
        Store.saveSettings(settings);
        render();
    }

    return {
        render: render,
        saveApiKey: saveApiKey,
        skipSetup: skipSetup,
        changeApiKey: changeApiKey,
        showSetup: showSetup
    };
})();

// Dashboard styles
(function () {
    var style = document.createElement('style');
    style.textContent = '' +
        '.dashboard-hero{display:flex;align-items:center;justify-content:space-between;padding:24px 0;margin-bottom:8px;flex-wrap:wrap;gap:16px}' +
        '.hero-title{font-size:1.8rem;font-weight:800}' +
        '.hero-subtitle{color:var(--text-secondary);font-size:.9rem;margin-top:4px}' +
        '.hero-actions{display:flex;gap:8px;flex-wrap:wrap}' +
        '.api-usage-bar{display:flex;align-items:center;gap:10px;padding:8px 14px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);margin-bottom:20px;font-size:.75rem;color:var(--text-muted)}' +
        '.api-usage-track{flex:1;height:4px;background:rgba(255,255,255,.05);border-radius:2px;min-width:60px}' +
        '.api-usage-fill{height:100%;background:var(--accent-green);border-radius:2px;transition:width .3s ease}' +
        '.setup-steps{display:flex;flex-direction:column;gap:10px}' +
        '.setup-step{display:flex;align-items:center;gap:12px;padding:10px;background:rgba(255,255,255,.02);border-radius:var(--radius-sm);font-size:.85rem;color:var(--text-secondary)}' +
        '.setup-step-num{width:28px;height:28px;border-radius:50%;background:var(--accent-blue);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;flex-shrink:0}';
    document.head.appendChild(style);
})();
