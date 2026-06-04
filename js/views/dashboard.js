/* ============ DASHBOARD VIEW ============ */
var DashboardView = (function () {

    function render() {
        var app = document.getElementById('app');
        app.innerHTML = '<div class="container"><div class="loading-spinner"></div></div>';

        CricketAPI.getCurrentMatches().then(function (apiMatches) {
            var localMatches = Store.getRecentMatches(10);
            var liveLocal = localMatches.filter(function (m) { return m.status === 'live'; });
            var otherLocal = localMatches.filter(function (m) { return m.status !== 'live'; });

            var html = '<div class="container">';

            // Hero / Quick Actions
            html += '<div class="dashboard-hero">';
            html += '<div class="hero-left">';
            html += '<h1 class="hero-title">&#127951; Cricket Live</h1>';
            html += '<p class="hero-subtitle">Live scores, tournaments & local matches</p>';
            html += '</div>';
            html += '<div class="hero-actions">';
            html += '<a href="#/teams" class="btn btn-outline btn-sm">&#128101; Teams</a>';
            html += '<a href="#/tournaments" class="btn btn-outline btn-sm">&#127942; Tournaments</a>';
            html += '</div>';
            html += '</div>';

            // API Key prompt
            if (!CricketAPI.getApiKey()) {
                html += '<div class="api-key-banner card">';
                html += '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">';
                html += '<span style="font-size:1.5rem">&#128273;</span>';
                html += '<div style="flex:1;min-width:200px">';
                html += '<div style="font-weight:600;margin-bottom:4px">Set API Key for Live Scores</div>';
                html += '<div style="font-size:.8rem;color:var(--text-secondary)">Get a free key from cricapi.com (100 requests/day). Currently showing demo data.</div>';
                html += '</div>';
                html += '<div style="display:flex;gap:8px;align-items:center">';
                html += '<input type="text" class="form-input" id="apiKeyInput" placeholder="Enter API key..." style="width:200px;padding:8px 12px">';
                html += '<button class="btn btn-primary btn-sm" onclick="DashboardView.saveApiKey()">Save</button>';
                html += '</div></div></div>';
            }

            // Live International Matches
            var liveApi = apiMatches.filter(function (m) { return m.matchStarted && !m.matchEnded; });
            var completedApi = apiMatches.filter(function (m) { return m.matchEnded; });

            if (liveApi.length > 0) {
                html += '<div class="section-header"><h2 class="section-title"><span class="live-dot"></span> Live Matches</h2></div>';
                html += '<div class="grid-auto stagger-children">';
                liveApi.forEach(function (m) { html += MatchCard.renderApiCard(m); });
                html += '</div>';
            }

            // Live Local Matches
            if (liveLocal.length > 0) {
                html += '<div class="section-header" style="margin-top:32px"><h2 class="section-title"><span class="live-dot"></span> Local Live Matches</h2></div>';
                html += '<div class="grid-auto stagger-children">';
                liveLocal.forEach(function (m) { html += MatchCard.renderLocalCard(m); });
                html += '</div>';
            }

            // Completed / Recent API Matches
            if (completedApi.length > 0) {
                html += '<div class="section-header" style="margin-top:32px"><h2 class="section-title">Recent International</h2></div>';
                html += '<div class="grid-auto stagger-children">';
                completedApi.forEach(function (m) { html += MatchCard.renderApiCard(m); });
                html += '</div>';
            }

            // Recent local
            if (otherLocal.length > 0) {
                html += '<div class="section-header" style="margin-top:32px">';
                html += '<h2 class="section-title">Local Matches</h2>';
                html += '</div>';
                html += '<div class="grid-auto stagger-children">';
                otherLocal.forEach(function (m) { html += MatchCard.renderLocalCard(m); });
                html += '</div>';
            }

            // Empty state
            if (apiMatches.length === 0 && localMatches.length === 0) {
                html += '<div class="empty-state">';
                html += '<div class="empty-state-icon">&#127951;</div>';
                html += '<div class="empty-state-title">Welcome to CrickLive Pro!</div>';
                html += '<div class="empty-state-desc">Create teams and start a local tournament, or add an API key for live international scores.</div>';
                html += '<br><a href="#/teams" class="btn btn-primary">&#128101; Create Teams</a>';
                html += '</div>';
            }

            html += '</div>';
            app.innerHTML = html;
        });
    }

    function saveApiKey() {
        var input = document.getElementById('apiKeyInput');
        if (input && input.value.trim()) {
            var settings = Store.getSettings();
            settings.apiKey = input.value.trim();
            Store.saveSettings(settings);
            Toast.show({ message: 'API Key saved! Refreshing...', type: 'success' });
            setTimeout(function () { render(); ScoreTicker.update(); }, 500);
        }
    }

    return {
        render: render,
        saveApiKey: saveApiKey
    };
})();

// Dashboard styles
(function () {
    var style = document.createElement('style');
    style.textContent = '' +
        '.dashboard-hero{display:flex;align-items:center;justify-content:space-between;padding:24px 0;margin-bottom:8px;flex-wrap:wrap;gap:16px}' +
        '.hero-title{font-size:1.8rem;font-weight:800}' +
        '.hero-subtitle{color:var(--text-secondary);font-size:.9rem;margin-top:4px}' +
        '.hero-actions{display:flex;gap:8px}' +
        '.api-key-banner{margin-bottom:24px;border-color:rgba(255,214,0,.15)}';
    document.head.appendChild(style);
})();
