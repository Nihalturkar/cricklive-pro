/* ============ MATCH CARD COMPONENT ============ */
var MatchCard = (function () {

    function getTeamColor(teamName) {
        var colors = {
            'India': '#0066cc', 'Australia': '#ffd600', 'England': '#1a237e',
            'South Africa': '#006a4e', 'New Zealand': '#000000', 'Pakistan': '#01411c',
            'Sri Lanka': '#0000b3', 'West Indies': '#7b0041', 'Bangladesh': '#006a4e',
            'Afghanistan': '#0066cc', 'Zimbabwe': '#d40000', 'Ireland': '#169b62'
        };
        return colors[teamName] || '#' + Math.floor(Math.random() * 8388607 + 8388608).toString(16);
    }

    function renderApiCard(match) {
        var isLive = match.matchStarted && !match.matchEnded;
        var scores = match.score || [];
        var typeBadge = (match.matchType || 'T20').toUpperCase();
        var badgeClass = 'badge-' + typeBadge.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!['badge-t20', 'badge-odi', 'badge-test'].includes(badgeClass)) badgeClass = 'badge-t20';

        var team1 = match.teams[0] || 'TBA';
        var team2 = match.teams[1] || 'TBA';
        var team1Short = team1.substring(0, 3).toUpperCase();
        var team2Short = team2.substring(0, 3).toUpperCase();

        var html = '<div class="card card-clickable match-card card-enter" onclick="Router.navigate(\'#/match/' + match.id + '\')">';

        // Top bar
        html += '<div class="match-card-top">';
        html += '<span class="badge ' + badgeClass + '">' + typeBadge + '</span>';
        if (isLive) {
            html += '<span class="live-badge"><span class="live-dot"></span>LIVE</span>';
        } else if (match.matchEnded) {
            html += '<span class="badge" style="background:rgba(255,214,0,0.1);color:var(--accent-yellow)">Completed</span>';
        }
        html += '</div>';

        // Teams & Scores
        html += '<div class="match-card-teams">';

        // Team 1
        html += '<div class="match-card-team">';
        html += '<div class="team-logo team-logo-sm" style="background:' + getTeamColor(team1) + '">' + team1Short + '</div>';
        html += '<div class="match-card-team-info">';
        html += '<div class="match-card-team-name">' + team1 + '</div>';
        if (scores[0]) {
            html += '<div class="match-card-score">' + scores[0].runs + '/' + scores[0].wickets +
                ' <span class="match-card-overs">(' + scores[0].overs + ')</span></div>';
        }
        html += '</div></div>';

        // Team 2
        html += '<div class="match-card-team">';
        html += '<div class="team-logo team-logo-sm" style="background:' + getTeamColor(team2) + '">' + team2Short + '</div>';
        html += '<div class="match-card-team-info">';
        html += '<div class="match-card-team-name">' + team2 + '</div>';
        if (scores[1]) {
            html += '<div class="match-card-score">' + scores[1].runs + '/' + scores[1].wickets +
                ' <span class="match-card-overs">(' + scores[1].overs + ')</span></div>';
        }
        html += '</div></div>';

        html += '</div>';

        // Status
        if (match.status) {
            html += '<div class="match-card-status ' + (isLive ? 'live' : '') + '">' + match.status + '</div>';
        }

        html += '</div>';
        return html;
    }

    function renderLocalCard(match) {
        var isLive = match.status === 'live';
        var innings = match.innings || [];
        var ci = match.currentInnings || 0;

        var html = '<div class="card card-clickable match-card card-enter" onclick="Router.navigate(\'#/local-match/' + match.id + '\')">';

        // Top bar
        html += '<div class="match-card-top">';
        html += '<span class="badge badge-local">LOCAL ' + (match.format || 'T20') + '</span>';
        if (isLive) {
            html += '<span class="live-badge"><span class="live-dot"></span>LIVE</span>';
        } else if (match.status === 'completed') {
            html += '<span class="badge" style="background:rgba(255,214,0,0.1);color:var(--accent-yellow)">Completed</span>';
        } else {
            html += '<span class="badge" style="background:rgba(255,255,255,0.05);color:var(--text-muted)">Not Started</span>';
        }
        html += '</div>';

        // Teams
        html += '<div class="match-card-teams">';

        html += '<div class="match-card-team">';
        html += '<div class="team-logo team-logo-sm" style="background:' + (match.team1Color || '#2979ff') + '">' +
            (match.team1Short || 'T1') + '</div>';
        html += '<div class="match-card-team-info">';
        html += '<div class="match-card-team-name">' + (match.team1Name || 'Team 1') + '</div>';
        if (innings[0]) {
            html += '<div class="match-card-score">' + innings[0].score + '/' + innings[0].wickets +
                ' <span class="match-card-overs">(' + innings[0].overs + '.' + innings[0].balls + ')</span></div>';
        }
        html += '</div></div>';

        html += '<div class="match-card-team">';
        html += '<div class="team-logo team-logo-sm" style="background:' + (match.team2Color || '#ff9100') + '">' +
            (match.team2Short || 'T2') + '</div>';
        html += '<div class="match-card-team-info">';
        html += '<div class="match-card-team-name">' + (match.team2Name || 'Team 2') + '</div>';
        if (innings[1] && (innings[1].score > 0 || innings[1].wickets > 0 || ci === 1)) {
            html += '<div class="match-card-score">' + innings[1].score + '/' + innings[1].wickets +
                ' <span class="match-card-overs">(' + innings[1].overs + '.' + innings[1].balls + ')</span></div>';
        }
        html += '</div></div>';

        html += '</div>';

        // Status
        if (match.result) {
            html += '<div class="match-card-status">' + match.result + '</div>';
        } else if (isLive && ci === 1 && innings[0]) {
            var target = innings[0].score + 1;
            var need = target - innings[1].score;
            var ballsLeft = (match.oversPerInnings * 6) - (innings[1].overs * 6 + innings[1].balls);
            html += '<div class="match-card-status live">Need ' + need + ' runs in ' + ballsLeft + ' balls</div>';
        }

        html += '</div>';
        return html;
    }

    return {
        renderApiCard: renderApiCard,
        renderLocalCard: renderLocalCard,
        getTeamColor: getTeamColor
    };
})();

// Match card styles
(function () {
    var style = document.createElement('style');
    style.textContent = '' +
        '.match-card{padding:16px;min-width:0}' +
        '.match-card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}' +
        '.match-card-teams{display:flex;flex-direction:column;gap:10px}' +
        '.match-card-team{display:flex;align-items:center;gap:10px}' +
        '.match-card-team-name{font-size:.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '.match-card-score{font-size:1.05rem;font-weight:800;margin-top:2px}' +
        '.match-card-overs{font-size:.75rem;color:var(--text-secondary);font-weight:400}' +
        '.match-card-status{margin-top:12px;padding-top:10px;border-top:1px solid var(--border-color);' +
        'font-size:.78rem;color:var(--text-secondary);line-height:1.4}' +
        '.match-card-status.live{color:var(--accent-green)}';
    document.head.appendChild(style);
})();
