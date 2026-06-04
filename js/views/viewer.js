/* ============ VIEWER MODE (Read-only for Spectators) ============ */
var ViewerView = (function () {

    var refreshTimer = null;
    var REFRESH_INTERVAL = 3000; // 3 seconds

    function render(params) {
        var matchId = params.id;
        var app = document.getElementById('app');

        // Hide header nav, show minimal viewer header
        document.querySelector('.app-header').classList.add('viewer-mode');

        var match = Store.getMatch(matchId);
        if (!match) {
            app.innerHTML = '<div class="match-center"><div class="empty-state">' +
                '<div class="empty-state-icon">&#128556;</div>' +
                '<div class="empty-state-title">Match not found</div>' +
                '<div class="empty-state-desc">This match link may have expired or been deleted.</div>' +
                '</div></div>';
            return;
        }

        renderViewerUI(app, match);

        // Auto-refresh for live matches
        if (match.status === 'live') {
            startAutoRefresh(matchId);
        }

        // Listen for real-time updates via BroadcastChannel
        if (typeof BroadcastChannel !== 'undefined') {
            var channel = new BroadcastChannel('cricklive_updates');
            channel.onmessage = function (e) {
                if (e.data && e.data.type === 'match_update' && e.data.matchId === matchId) {
                    var freshMatch = Store.getMatch(matchId);
                    if (freshMatch) renderViewerUI(app, freshMatch);
                }
            };
        }

        return function cleanup() {
            stopAutoRefresh();
            document.querySelector('.app-header').classList.remove('viewer-mode');
        };
    }

    function renderViewerUI(app, match) {
        var isLive = match.status === 'live';
        var ci = match.currentInnings || 0;
        var innings = match.innings || [];
        var currentInn = innings[ci] || {};

        var html = '<div class="viewer-container">';

        // Viewer header bar
        html += '<div class="viewer-header-bar">';
        html += '<div class="viewer-live-indicator">';
        if (isLive) {
            html += '<span class="live-dot"></span> <span style="color:var(--accent-green);font-weight:700;font-size:.8rem">LIVE</span>';
        } else if (match.status === 'completed') {
            html += '<span style="color:var(--accent-yellow);font-weight:600;font-size:.8rem">COMPLETED</span>';
        }
        html += '</div>';
        html += '<div class="viewer-badge">&#128250; Spectator View</div>';
        html += '</div>';

        // Match Header (big, broadcast style)
        html += '<div class="viewer-match-card">';

        // Teams Row
        html += '<div class="viewer-teams">';
        html += '<div class="viewer-team">';
        html += '<div class="team-logo" style="background:' + (match.team1Color || '#2979ff') + ';width:56px;height:56px;font-size:.9rem">' + (match.team1Short || 'T1') + '</div>';
        html += '<div class="viewer-team-name">' + (match.team1Name || 'Team 1') + '</div>';
        html += '</div>';

        html += '<div class="viewer-vs">';
        html += '<span class="badge badge-local">' + (match.format || 'T20') + '</span>';
        html += '<div style="color:var(--text-dim);font-size:.75rem;margin-top:4px">VS</div>';
        html += '</div>';

        html += '<div class="viewer-team">';
        html += '<div class="team-logo" style="background:' + (match.team2Color || '#ff9100') + ';width:56px;height:56px;font-size:.9rem">' + (match.team2Short || 'T2') + '</div>';
        html += '<div class="viewer-team-name">' + (match.team2Name || 'Team 2') + '</div>';
        html += '</div>';
        html += '</div>';

        // Big Score
        html += '<div class="viewer-score-section">';

        // First innings
        var t1Name = innings[0] && innings[0].battingTeamId === match.team1Id ? match.team1Short : match.team2Short;
        html += '<div class="viewer-innings-score">';
        html += '<span class="viewer-team-label">' + (t1Name || 'T1') + '</span>';
        html += '<span class="viewer-score ' + (ci === 0 ? 'current' : '') + '">' +
            (innings[0] ? innings[0].score + '/' + innings[0].wickets : '0/0') + '</span>';
        html += '<span class="viewer-overs">(' + (innings[0] ? innings[0].overs + '.' + innings[0].balls : '0.0') + ' ov)</span>';
        html += '</div>';

        if (ci === 1 || match.status === 'completed') {
            var t2Name = innings[1] && innings[1].battingTeamId === match.team1Id ? match.team1Short : match.team2Short;
            html += '<div class="viewer-innings-score">';
            html += '<span class="viewer-team-label">' + (t2Name || 'T2') + '</span>';
            html += '<span class="viewer-score ' + (ci === 1 ? 'current' : '') + '">' +
                (innings[1] ? innings[1].score + '/' + innings[1].wickets : '0/0') + '</span>';
            html += '<span class="viewer-overs">(' + (innings[1] ? innings[1].overs + '.' + innings[1].balls : '0.0') + ' ov)</span>';
            html += '</div>';
        }

        // Run rates
        if (isLive) {
            var totalBalls = currentInn.overs * 6 + currentInn.balls;
            var crr = totalBalls > 0 ? (currentInn.score / (totalBalls / 6)).toFixed(2) : '0.00';
            html += '<div class="viewer-run-rates">';
            html += '<span>CRR: ' + crr + '</span>';
            if (ci === 1 && innings[0]) {
                var target = innings[0].score + 1;
                var need = target - currentInn.score;
                var ballsLeft = (match.oversPerInnings * 6) - totalBalls;
                var rrr = ballsLeft > 0 ? (need / (ballsLeft / 6)).toFixed(2) : '0.00';
                html += '<span>RRR: ' + rrr + '</span>';
            }
            html += '</div>';
        }

        // Target / Result
        if (match.result) {
            html += '<div class="viewer-result">' + match.result + '</div>';
        } else if (isLive && ci === 1 && innings[0]) {
            var target2 = innings[0].score + 1;
            var need2 = target2 - currentInn.score;
            var totalBalls2 = currentInn.overs * 6 + currentInn.balls;
            var ballsLeft2 = (match.oversPerInnings * 6) - totalBalls2;
            html += '<div class="viewer-target">' + (innings[1].battingTeamId === match.team1Id ? match.team1Name : match.team2Name) +
                ' need <strong>' + need2 + '</strong> runs in <strong>' + ballsLeft2 + '</strong> balls</div>';
        }

        html += '</div>'; // viewer-score-section
        html += '</div>'; // viewer-match-card

        // Batsmen Panel
        if (isLive && currentInn.batsmen) {
            var batsmenList = [];
            if (currentInn.currentStriker && currentInn.batsmen[currentInn.currentStriker]) {
                var b = currentInn.batsmen[currentInn.currentStriker];
                batsmenList.push({ name: b.name, runs: b.runs || 0, balls: b.balls || 0, fours: b.fours || 0, sixes: b.sixes || 0, isStriker: true });
            }
            if (currentInn.currentNonStriker && currentInn.batsmen[currentInn.currentNonStriker]) {
                var nb = currentInn.batsmen[currentInn.currentNonStriker];
                batsmenList.push({ name: nb.name, runs: nb.runs || 0, balls: nb.balls || 0, fours: nb.fours || 0, sixes: nb.sixes || 0, isStriker: false });
            }
            if (batsmenList.length > 0) html += BatsmanPanel.render(batsmenList);
        }

        // Bowler Panel
        if (isLive && currentInn.currentBowler && currentInn.bowlers && currentInn.bowlers[currentInn.currentBowler]) {
            var bw = currentInn.bowlers[currentInn.currentBowler];
            html += BowlerPanel.render([{
                name: bw.name || currentInn.currentBowler,
                overs: bw.overs + '.' + (bw.balls || 0),
                maidens: bw.maidens || 0,
                runs: bw.runs || 0,
                wickets: bw.wickets || 0
            }]);
        }

        // Over dots
        if (currentInn.ballLog && currentInn.ballLog.length > 0) {
            html += OverTimeline.renderFromBallLog(currentInn.ballLog);
        }

        // Tabs
        html += '<div class="tabs">';
        html += '<button class="tab active" onclick="MatchCenterView.switchTab(this, \'viewer-scorecard\')">&#128202; Scorecard</button>';
        html += '<button class="tab" onclick="MatchCenterView.switchTab(this, \'viewer-commentary\')">&#128172; Commentary</button>';
        html += '</div>';

        // Scorecard Tab
        html += '<div class="tab-content active" id="tab-viewer-scorecard">';
        innings.forEach(function (inn, idx) {
            if (!inn || (inn.score === 0 && inn.wickets === 0 && idx > ci)) return;
            var battingTeam = inn.battingTeamId === match.team1Id ? match.team1Name : match.team2Name;
            html += '<h4 style="margin:16px 0 8px;font-size:.9rem;color:var(--text-secondary)">' + battingTeam + ' Innings</h4>';
            html += '<div class="table-wrap"><table class="data-table">';
            html += '<thead><tr><th>Batter</th><th class="text-center">R</th><th class="text-center">B</th><th class="text-center">4s</th><th class="text-center">6s</th><th class="text-center">SR</th></tr></thead><tbody>';

            var batsmenKeys = Object.keys(inn.batsmen || {});
            if (batsmenKeys.length > 0) {
                batsmenKeys.forEach(function (key) {
                    var b = inn.batsmen[key];
                    var sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '-';
                    html += '<tr><td>' + (b.name || key) + (b.howOut !== 'not out' ? ' <span style="color:var(--text-muted);font-size:.7rem">(' + b.howOut + ')</span>' : '') +
                        '</td><td class="text-center" style="font-weight:700">' + b.runs +
                        '</td><td class="text-center">' + b.balls + '</td><td class="text-center">' + (b.fours || 0) +
                        '</td><td class="text-center">' + (b.sixes || 0) + '</td><td class="text-center">' + sr + '</td></tr>';
                });
            }
            html += '</tbody></table></div>';

            // Bowling
            html += '<h4 style="margin:12px 0 8px;font-size:.85rem;color:var(--text-muted)">Bowling</h4>';
            html += '<div class="table-wrap"><table class="data-table">';
            html += '<thead><tr><th>Bowler</th><th class="text-center">O</th><th class="text-center">R</th><th class="text-center">W</th><th class="text-center">Econ</th></tr></thead><tbody>';
            var bowlerKeys = Object.keys(inn.bowlers || {});
            if (bowlerKeys.length > 0) {
                bowlerKeys.forEach(function (key) {
                    var bw = inn.bowlers[key];
                    var econ = (bw.overs + bw.balls / 6) > 0 ? (bw.runs / (bw.overs + bw.balls / 6)).toFixed(2) : '-';
                    html += '<tr><td>' + (bw.name || key) + '</td><td class="text-center">' + bw.overs + '.' + (bw.balls || 0) +
                        '</td><td class="text-center">' + bw.runs +
                        '</td><td class="text-center" style="font-weight:700;color:var(--accent-green)">' + bw.wickets +
                        '</td><td class="text-center">' + econ + '</td></tr>';
                });
            }
            html += '</tbody></table></div>';
        });
        html += '</div>';

        // Commentary Tab
        html += '<div class="tab-content" id="tab-viewer-commentary">';
        if (currentInn.ballLog && currentInn.ballLog.length > 0) {
            var commItems = currentInn.ballLog.slice().reverse().map(function (b) {
                var overStr = b.over + '.' + b.ball;
                var type = b.wicket ? 'wicket' : b.runs === 6 ? 'six' : b.runs === 4 ? 'boundary' : 'normal';
                return { over: overStr, text: b.commentary || ('Ball ' + overStr), runs: b.runs || 0, type: type };
            });
            html += Commentary.render(commItems);
        } else {
            html += '<div class="empty-state"><div class="empty-state-desc">No balls bowled yet</div></div>';
        }
        html += '</div>';

        // Last updated timestamp
        html += '<div class="viewer-footer">';
        html += '<span>&#128338; Updated: ' + new Date().toLocaleTimeString() + '</span>';
        if (isLive) html += '<span class="viewer-auto-refresh"><span class="live-dot"></span> Auto-refreshing every 3s</span>';
        html += '</div>';

        html += '</div>'; // viewer-container
        app.innerHTML = html;
    }

    function startAutoRefresh(matchId) {
        stopAutoRefresh();
        refreshTimer = setInterval(function () {
            var match = Store.getMatch(matchId);
            if (match) {
                var app = document.getElementById('app');
                renderViewerUI(app, match);
                if (match.status !== 'live') stopAutoRefresh();
            }
        }, REFRESH_INTERVAL);
    }

    function stopAutoRefresh() {
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
    }

    return {
        render: render,
        stopAutoRefresh: stopAutoRefresh
    };
})();

// Viewer styles
(function () {
    var style = document.createElement('style');
    style.textContent = '' +
        '.viewer-mode .nav-links{display:none!important}' +
        '.viewer-mode .menu-toggle{display:none!important}' +
        '.viewer-container{max-width:600px;margin:0 auto;padding:12px}' +
        '.viewer-header-bar{display:flex;justify-content:space-between;align-items:center;padding:8px 0;margin-bottom:8px}' +
        '.viewer-badge{font-size:.7rem;padding:4px 12px;background:rgba(124,77,255,.12);color:var(--accent-purple);border-radius:20px;font-weight:600}' +
        '.viewer-match-card{background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-xl);padding:20px;margin-bottom:16px;position:relative;overflow:hidden}' +
        '.viewer-match-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--accent-green),var(--accent-cyan),var(--accent-blue))}' +
        '.viewer-teams{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}' +
        '.viewer-team{text-align:center;flex:1}' +
        '.viewer-team .team-logo{margin:0 auto 8px}' +
        '.viewer-team-name{font-size:.85rem;font-weight:600}' +
        '.viewer-vs{text-align:center;flex-shrink:0;padding:0 16px}' +
        '.viewer-score-section{text-align:center;padding-top:12px;border-top:1px solid var(--border-color)}' +
        '.viewer-innings-score{display:flex;align-items:baseline;justify-content:center;gap:10px;margin-bottom:8px}' +
        '.viewer-team-label{font-size:.75rem;color:var(--text-muted);font-weight:600;min-width:30px}' +
        '.viewer-score{font-size:2.2rem;font-weight:900;color:var(--text-muted)}' +
        '.viewer-score.current{color:var(--text-primary)}' +
        '.viewer-overs{font-size:.8rem;color:var(--text-secondary)}' +
        '.viewer-run-rates{display:flex;justify-content:center;gap:16px;font-size:.8rem;color:var(--text-secondary);margin-top:4px}' +
        '.viewer-run-rates span{padding:2px 8px;background:rgba(255,255,255,.03);border-radius:var(--radius-sm)}' +
        '.viewer-target{margin-top:12px;padding:10px;background:rgba(0,230,118,.06);border-radius:var(--radius-sm);color:var(--accent-green);font-size:.85rem}' +
        '.viewer-result{margin-top:12px;padding:10px;background:rgba(255,214,0,.06);border-radius:var(--radius-sm);color:var(--accent-yellow);font-size:.9rem;font-weight:600}' +
        '.viewer-footer{display:flex;justify-content:space-between;align-items:center;padding:16px 0 8px;font-size:.7rem;color:var(--text-dim);flex-wrap:wrap;gap:8px}' +
        '.viewer-auto-refresh{display:flex;align-items:center;gap:6px}';
    document.head.appendChild(style);
})();
