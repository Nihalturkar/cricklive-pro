/* ============ SCORE TICKER COMPONENT ============ */
var ScoreTicker = (function () {
    var refreshInterval = null;

    function renderTickerItem(match, isLocal) {
        var route = isLocal ? '#/local-match/' + match.id : '#/match/' + match.id;

        if (isLocal) {
            var inn = match.innings || [];
            var html = '<div class="ticker-item" onclick="Router.navigate(\'' + route + '\')">';
            html += '<div class="ticker-team">';
            html += '<span class="ticker-team-name">' + (match.team1Short || 'T1') + '</span>';
            if (inn[0]) html += ' <span class="ticker-score">' + inn[0].score + '/' + inn[0].wickets + '</span>';
            html += '</div>';
            html += '<span class="ticker-vs">vs</span>';
            html += '<div class="ticker-team">';
            html += '<span class="ticker-team-name">' + (match.team2Short || 'T2') + '</span>';
            if (inn[1] && (inn[1].score > 0 || match.currentInnings === 1)) {
                html += ' <span class="ticker-score">' + inn[1].score + '/' + inn[1].wickets + '</span>';
            }
            html += '</div>';
            if (match.status === 'live') html += '<span class="ticker-status"><span class="live-dot"></span> LIVE</span>';
            html += '</div>';
            return html;
        }

        // API match
        var scores = match.score || [];
        var isLive = match.matchStarted && !match.matchEnded;
        var html2 = '<div class="ticker-item" onclick="Router.navigate(\'' + route + '\')">';
        var t1 = (match.teams[0] || 'TBA').substring(0, 3).toUpperCase();
        var t2 = (match.teams[1] || 'TBA').substring(0, 3).toUpperCase();

        html2 += '<div class="ticker-team">';
        html2 += '<span class="ticker-team-name">' + t1 + '</span>';
        if (scores[0]) html2 += ' <span class="ticker-score">' + scores[0].runs + '/' + scores[0].wickets + '</span>';
        html2 += '</div>';
        html2 += '<span class="ticker-vs">vs</span>';
        html2 += '<div class="ticker-team">';
        html2 += '<span class="ticker-team-name">' + t2 + '</span>';
        if (scores[1]) html2 += ' <span class="ticker-score">' + scores[1].runs + '/' + scores[1].wickets + '</span>';
        html2 += '</div>';
        if (isLive) html2 += '<span class="ticker-status"><span class="live-dot"></span> LIVE</span>';
        html2 += '</div>';
        return html2;
    }

    function update() {
        var track = document.getElementById('tickerTrack');
        if (!track) return;

        CricketAPI.getCurrentMatches().then(function (apiMatches) {
            var localMatches = Store.getLiveLocalMatches();
            var allItems = '';

            apiMatches.forEach(function (m) {
                allItems += renderTickerItem(m, false);
            });

            localMatches.forEach(function (m) {
                allItems += renderTickerItem(m, true);
            });

            // Also show recent completed local matches
            var recentLocal = Store.getRecentMatches(5);
            recentLocal.forEach(function (m) {
                if (m.status !== 'live') {
                    allItems += renderTickerItem(m, true);
                }
            });

            if (!allItems) {
                track.innerHTML = '<span class="ticker-empty">No matches right now</span>';
                track.style.animation = 'none';
                return;
            }

            // Duplicate for seamless loop
            track.innerHTML = allItems + allItems;

            var itemCount = track.children.length / 2;
            var duration = Math.max(15, itemCount * 8);
            track.style.setProperty('--ticker-duration', duration + 's');
            track.style.animation = 'tickerScroll ' + duration + 's linear infinite';
        });
    }

    function start() {
        update();
        refreshInterval = setInterval(update, 60000);
    }

    function stop() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    }

    return {
        update: update,
        start: start,
        stop: stop
    };
})();
