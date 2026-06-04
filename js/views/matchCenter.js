/* ============ MATCH CENTER VIEW (Hotstar-style) ============ */
var MatchCenterView = (function () {

    function renderApiMatch(params) {
        var id = params.id;
        var app = document.getElementById('app');
        app.innerHTML = '<div class="match-center"><div class="loading-spinner"></div></div>';

        var matchData = CricketAPI.getMockMatchDetail(id);
        if (matchData) {
            renderFullMatch(app, matchData);
        } else {
            CricketAPI.getMatchInfo(id).then(function (data) {
                if (data) renderFullMatch(app, data);
                else app.innerHTML = '<div class="match-center"><div class="empty-state"><div class="empty-state-icon">&#128556;</div><div class="empty-state-title">Match not found</div><br><a href="#/" class="btn btn-primary">Go Back</a></div></div>';
            });
        }
    }

    function renderFullMatch(app, match) {
        var isLive = match.matchStarted && !match.matchEnded;
        var scores = match.score || [];
        var detail = match.mockDetail || {};
        var team1 = match.teams[0] || 'TBA';
        var team2 = match.teams[1] || 'TBA';
        var t1Short = team1.substring(0, 3).toUpperCase();
        var t2Short = team2.substring(0, 3).toUpperCase();
        var t1Color = MatchCard.getTeamColor(team1);
        var t2Color = MatchCard.getTeamColor(team2);

        var typeBadge = (match.matchType || 'T20').toUpperCase();

        var html = '<div class="match-center">';
        html += '<a class="match-back" onclick="history.back()">&#8592; Back</a>';

        // Match Header
        html += '<div class="match-header ' + (isLive ? 'live' : '') + '">';
        html += '<div class="match-teams-row">';
        html += '<div class="match-team">';
        html += '<div class="team-logo" style="background:' + t1Color + '">' + t1Short + '</div>';
        html += '<div><div class="team-name">' + team1 + '</div><div class="team-name-short">' + t1Short + '</div></div>';
        html += '</div>';
        html += '<div class="match-vs"><div class="vs-text">VS</div><div class="match-info-badge"><span class="badge badge-' + typeBadge.toLowerCase() + '">' + typeBadge + '</span></div></div>';
        html += '<div class="match-team away">';
        html += '<div class="team-logo" style="background:' + t2Color + '">' + t2Short + '</div>';
        html += '<div><div class="team-name">' + team2 + '</div><div class="team-name-short">' + t2Short + '</div></div>';
        html += '</div>';
        html += '</div>';

        if (match.venue) {
            html += '<div style="text-align:center;font-size:.75rem;color:var(--text-muted);margin-top:4px">&#128205; ' + match.venue + '</div>';
        }

        // Score Display
        html += '<div class="score-display">';
        html += '<div class="score-main">';

        if (scores[0]) {
            var isBatting0 = isLive && scores.length === 1;
            html += '<div class="score-team">';
            html += '<div class="team-short">' + scores[0].team + '</div>';
            html += '<div class="score-runs ' + (isBatting0 ? 'batting' : 'not-batting') + '">' + scores[0].runs + '/' + scores[0].wickets + '</div>';
            html += '<div class="score-overs">(' + scores[0].overs + ' ov)</div>';
            html += '</div>';
        }

        if (scores.length > 1) {
            html += '<div class="score-divider">&amp;</div>';
        }

        if (scores[1]) {
            var isBatting1 = isLive;
            html += '<div class="score-team">';
            html += '<div class="team-short">' + scores[1].team + '</div>';
            html += '<div class="score-runs ' + (isBatting1 ? 'batting' : 'not-batting') + '">' + scores[1].runs + '/' + scores[1].wickets + '</div>';
            html += '<div class="score-overs">(' + scores[1].overs + ' ov)</div>';
            html += '</div>';
        }

        html += '</div>';

        // CRR / RRR
        if (isLive && scores.length > 0) {
            var currentScore = scores[scores.length - 1];
            var crr = currentScore.overs > 0 ? (currentScore.runs / currentScore.overs).toFixed(2) : '0.00';
            html += '<div class="score-extras"><span>CRR: ' + crr + '</span>';
            if (scores.length > 1) {
                var target = scores[0].runs + 1;
                var totalOvers = match.matchType === 'ODI' ? 50 : match.matchType === 'Test' ? 0 : 20;
                if (totalOvers > 0) {
                    var ballsLeft = (totalOvers * 6) - Math.floor(currentScore.overs) * 6 - Math.round((currentScore.overs % 1) * 10);
                    var oversLeft = ballsLeft / 6;
                    var need = target - currentScore.runs;
                    var rrr = oversLeft > 0 ? (need / oversLeft).toFixed(2) : '0.00';
                    html += '<span>RRR: ' + rrr + '</span>';
                }
            }
            html += '</div>';
        }

        // Status
        html += '<div class="match-status-text ' + (isLive ? 'live' : 'completed') + '">';
        if (isLive) html += '<span class="live-dot"></span> ';
        html += match.status + '</div>';

        html += '</div>'; // score-display
        html += '</div>'; // match-header

        // Batsmen Panel
        if (detail.batsmen) {
            html += BatsmanPanel.render(detail.batsmen);
        }

        // Bowler Panel
        if (detail.bowlers) {
            html += BowlerPanel.render(detail.bowlers);
        }

        // Over Timeline
        if (detail.recentOvers) {
            html += OverTimeline.render(detail.recentOvers);
        }

        // Tabs: Commentary | Info
        html += '<div class="tabs">';
        html += '<button class="tab active" onclick="MatchCenterView.switchTab(this, \'commentary\')">&#128172; Commentary</button>';
        html += '<button class="tab" onclick="MatchCenterView.switchTab(this, \'info\')">&#8505;&#65039; Info</button>';
        html += '</div>';

        // Commentary Tab
        html += '<div class="tab-content active" id="tab-commentary">';
        if (detail.commentary) {
            html += Commentary.render(detail.commentary);
        } else {
            html += '<div class="empty-state"><div class="empty-state-desc">Commentary not available for API matches on free tier</div></div>';
        }
        html += '</div>';

        // Info Tab
        html += '<div class="tab-content" id="tab-info">';
        html += '<div class="card" style="margin-top:8px">';
        html += '<div style="font-size:.85rem;color:var(--text-secondary);line-height:2">';
        html += '<strong>Match:</strong> ' + (match.name || '') + '<br>';
        html += '<strong>Venue:</strong> ' + (match.venue || 'N/A') + '<br>';
        html += '<strong>Date:</strong> ' + (match.date || 'N/A') + '<br>';
        html += '<strong>Format:</strong> ' + (match.matchType || 'N/A') + '<br>';
        html += '</div></div>';
        html += '</div>';

        html += '</div>'; // match-center
        app.innerHTML = html;
    }

    function renderLocalMatch(params) {
        var id = params.id;
        var app = document.getElementById('app');
        var match = Store.getMatch(id);

        if (!match) {
            app.innerHTML = '<div class="match-center"><div class="empty-state"><div class="empty-state-icon">&#128556;</div>' +
                '<div class="empty-state-title">Match not found</div><br><a href="#/" class="btn btn-primary">Go Back</a></div></div>';
            return;
        }

        var isLive = match.status === 'live';
        var ci = match.currentInnings || 0;
        var innings = match.innings || [];
        var currentInn = innings[ci] || {};

        var html = '<div class="match-center">';
        html += '<a class="match-back" onclick="history.back()">&#8592; Back</a>';

        // Header
        html += '<div class="match-header ' + (isLive ? 'live' : '') + '">';
        html += '<div class="match-teams-row">';
        html += '<div class="match-team">';
        html += '<div class="team-logo" style="background:' + (match.team1Color || '#2979ff') + '">' + (match.team1Short || 'T1') + '</div>';
        html += '<div><div class="team-name">' + (match.team1Name || 'Team 1') + '</div><div class="team-name-short">' + (match.team1Short || 'T1') + '</div></div>';
        html += '</div>';
        html += '<div class="match-vs"><div class="vs-text">VS</div><div class="match-info-badge"><span class="badge badge-local">' + (match.format || 'T20') + '</span></div></div>';
        html += '<div class="match-team away">';
        html += '<div class="team-logo" style="background:' + (match.team2Color || '#ff9100') + '">' + (match.team2Short || 'T2') + '</div>';
        html += '<div><div class="team-name">' + (match.team2Name || 'Team 2') + '</div><div class="team-name-short">' + (match.team2Short || 'T2') + '</div></div>';
        html += '</div>';
        html += '</div>';

        // Scores
        html += '<div class="score-display"><div class="score-main">';

        // First innings
        var t1Name = innings[0] && innings[0].battingTeamId === match.team1Id ? match.team1Short : match.team2Short;
        html += '<div class="score-team">';
        html += '<div class="team-short">' + (t1Name || 'T1') + '</div>';
        html += '<div class="score-runs ' + (ci === 0 ? 'batting' : 'not-batting') + '">' +
            (innings[0] ? innings[0].score + '/' + innings[0].wickets : '0/0') + '</div>';
        html += '<div class="score-overs">(' + (innings[0] ? innings[0].overs + '.' + innings[0].balls : '0.0') + ' ov)</div>';
        html += '</div>';

        // Second innings
        if (ci === 1 || match.status === 'completed') {
            html += '<div class="score-divider">&amp;</div>';
            var t2Name = innings[1] && innings[1].battingTeamId === match.team1Id ? match.team1Short : match.team2Short;
            html += '<div class="score-team">';
            html += '<div class="team-short">' + (t2Name || 'T2') + '</div>';
            html += '<div class="score-runs ' + (ci === 1 ? 'batting' : 'not-batting') + '">' +
                (innings[1] ? innings[1].score + '/' + innings[1].wickets : '0/0') + '</div>';
            html += '<div class="score-overs">(' + (innings[1] ? innings[1].overs + '.' + innings[1].balls : '0.0') + ' ov)</div>';
            html += '</div>';
        }

        html += '</div>';

        // CRR
        if (isLive && currentInn.overs !== undefined) {
            var totalBalls = currentInn.overs * 6 + currentInn.balls;
            var crr = totalBalls > 0 ? (currentInn.score / (totalBalls / 6)).toFixed(2) : '0.00';
            html += '<div class="score-extras"><span>CRR: ' + crr + '</span>';
            if (ci === 1 && innings[0]) {
                var target = innings[0].score + 1;
                var need = target - currentInn.score;
                var ballsLeft = (match.oversPerInnings * 6) - totalBalls;
                var rrr = ballsLeft > 0 ? (need / (ballsLeft / 6)).toFixed(2) : '0.00';
                html += '<span>RRR: ' + rrr + '</span><span>Need: ' + need + ' in ' + ballsLeft + ' balls</span>';
            }
            html += '</div>';
        }

        // Status
        if (match.result) {
            html += '<div class="match-status-text completed">' + match.result + '</div>';
        } else if (isLive) {
            html += '<div class="match-status-text live"><span class="live-dot"></span> In Progress</div>';
        }

        html += '</div></div>'; // score-display, match-header

        // Current batsmen
        if (isLive && currentInn.batsmen) {
            var batsmenList = [];
            if (currentInn.currentStriker && currentInn.batsmen[currentInn.currentStriker]) {
                var b = currentInn.batsmen[currentInn.currentStriker];
                batsmenList.push({ name: b.name || currentInn.currentStriker, runs: b.runs || 0, balls: b.balls || 0, fours: b.fours || 0, sixes: b.sixes || 0, isStriker: true });
            }
            if (currentInn.currentNonStriker && currentInn.batsmen[currentInn.currentNonStriker]) {
                var nb = currentInn.batsmen[currentInn.currentNonStriker];
                batsmenList.push({ name: nb.name || currentInn.currentNonStriker, runs: nb.runs || 0, balls: nb.balls || 0, fours: nb.fours || 0, sixes: nb.sixes || 0, isStriker: false });
            }
            if (batsmenList.length > 0) html += BatsmanPanel.render(batsmenList);
        }

        // Current bowler
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

        // Over timeline from ball log
        if (currentInn.ballLog && currentInn.ballLog.length > 0) {
            html += OverTimeline.renderFromBallLog(currentInn.ballLog);
        }

        // Action buttons
        html += '<div style="display:flex;gap:10px;justify-content:center;margin:20px 0;flex-wrap:wrap">';
        if (isLive) {
            html += '<a href="#/scorer/' + match.id + '" class="btn btn-success btn-lg">&#127951; Open Scorer</a>';
        }
        html += '<button class="btn btn-outline btn-lg" onclick="ShareMatch.openShareModal(\'' + match.id + '\')">&#128228; Share Match</button>';
        html += '</div>';

        // Tabs
        html += '<div class="tabs">';
        html += '<button class="tab active" onclick="MatchCenterView.switchTab(this, \'scorecard-full\')">&#128202; Scorecard</button>';
        html += '<button class="tab" onclick="MatchCenterView.switchTab(this, \'commentary-local\')">&#128172; Commentary</button>';
        html += '</div>';

        // Full Scorecard Tab
        html += '<div class="tab-content active" id="tab-scorecard-full">';
        innings.forEach(function (inn, idx) {
            if (!inn || (inn.score === 0 && inn.wickets === 0 && idx > ci)) return;
            var battingTeam = inn.battingTeamId === match.team1Id ? match.team1Name : match.team2Name;
            html += '<h4 style="margin:16px 0 8px;font-size:.9rem;color:var(--text-secondary)">' + battingTeam + ' Innings</h4>';
            html += '<div class="table-wrap"><table class="data-table">';
            html += '<thead><tr><th>Batter</th><th class="text-center">R</th><th class="text-center">B</th><th class="text-center">4s</th><th class="text-center">6s</th><th class="text-center">SR</th><th>Out</th></tr></thead><tbody>';

            var batsmenKeys = Object.keys(inn.batsmen || {});
            if (batsmenKeys.length > 0) {
                batsmenKeys.forEach(function (key) {
                    var b = inn.batsmen[key];
                    var sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '-';
                    html += '<tr><td>' + (b.name || key) + '</td><td class="text-center" style="font-weight:700">' + b.runs +
                        '</td><td class="text-center">' + b.balls + '</td><td class="text-center">' + (b.fours || 0) +
                        '</td><td class="text-center">' + (b.sixes || 0) + '</td><td class="text-center">' + sr +
                        '</td><td style="font-size:.75rem;color:var(--text-muted)">' + (b.howOut || 'not out') + '</td></tr>';
                });
            } else {
                html += '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No batting data</td></tr>';
            }

            html += '</tbody></table></div>';

            // Bowling
            html += '<h4 style="margin:16px 0 8px;font-size:.85rem;color:var(--text-muted)">Bowling</h4>';
            html += '<div class="table-wrap"><table class="data-table">';
            html += '<thead><tr><th>Bowler</th><th class="text-center">O</th><th class="text-center">M</th><th class="text-center">R</th><th class="text-center">W</th><th class="text-center">Econ</th></tr></thead><tbody>';

            var bowlerKeys = Object.keys(inn.bowlers || {});
            if (bowlerKeys.length > 0) {
                bowlerKeys.forEach(function (key) {
                    var bw = inn.bowlers[key];
                    var totalOv = bw.overs + '.' + (bw.balls || 0);
                    var econ = (bw.overs + bw.balls / 6) > 0 ? (bw.runs / (bw.overs + bw.balls / 6)).toFixed(2) : '-';
                    html += '<tr><td>' + (bw.name || key) + '</td><td class="text-center">' + totalOv +
                        '</td><td class="text-center">' + (bw.maidens || 0) + '</td><td class="text-center">' + bw.runs +
                        '</td><td class="text-center" style="font-weight:700;color:var(--accent-green)">' + bw.wickets +
                        '</td><td class="text-center">' + econ + '</td></tr>';
                });
            } else {
                html += '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No bowling data</td></tr>';
            }
            html += '</tbody></table></div>';
        });
        html += '</div>';

        // Commentary Tab
        html += '<div class="tab-content" id="tab-commentary-local">';
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

        html += '</div>'; // match-center
        app.innerHTML = html;
    }

    function switchTab(btn, tabId) {
        var parent = btn.parentElement;
        parent.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        btn.classList.add('active');

        // Find all tab-content siblings
        var container = parent.parentElement;
        container.querySelectorAll('.tab-content').forEach(function (tc) { tc.classList.remove('active'); });
        var target = document.getElementById('tab-' + tabId);
        if (target) target.classList.add('active');
    }

    return {
        renderApiMatch: renderApiMatch,
        renderLocalMatch: renderLocalMatch,
        switchTab: switchTab
    };
})();
