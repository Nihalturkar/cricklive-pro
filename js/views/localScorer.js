/* ============ LOCAL SCORER VIEW (Ball-by-Ball) ============ */
var LocalScorerView = (function () {

    var currentMatchId = null;
    var freeHit = false;

    function render(params) {
        currentMatchId = params.matchId || params.id;
        var match = Store.getMatch(currentMatchId);
        var app = document.getElementById('app');

        if (!match) {
            app.innerHTML = '<div class="container"><div class="empty-state"><div class="empty-state-title">Match not found</div><br><a href="#/" class="btn btn-primary">Go Back</a></div></div>';
            return;
        }

        // Check Admin PIN before allowing scorer access
        if (ShareMatch.hasAdminPin(currentMatchId) && !ShareMatch.isAdminUnlocked(currentMatchId)) {
            app.innerHTML = '<div class="container"><div class="loading-spinner"></div></div>';
            ShareMatch.promptAdminPin(currentMatchId, function () {
                renderAfterAuth(app, match);
            });
            return;
        }

        renderAfterAuth(app, match);
    }

    function renderAfterAuth(app, match) {
        // If not started, show toss setup
        if (match.status === 'not_started') {
            renderTossSetup(app, match);
            return;
        }

        // If completed
        if (match.status === 'completed') {
            Router.navigate('#/local-match/' + currentMatchId);
            return;
        }

        renderScoringInterface(app, match);
    }

    function renderTossSetup(app, match) {
        var html = '<div class="container" style="max-width:600px;margin:0 auto">';
        html += '<h2 class="section-title" style="margin-bottom:20px">&#127942; Match Setup</h2>';

        html += '<div class="card" style="margin-bottom:16px">';
        html += '<div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:20px">';
        html += '<div style="text-align:center"><div class="team-logo" style="background:' + match.team1Color + '">' + match.team1Short + '</div><div style="font-size:.85rem;margin-top:6px">' + match.team1Name + '</div></div>';
        html += '<div style="color:var(--text-dim);font-weight:700">VS</div>';
        html += '<div style="text-align:center"><div class="team-logo" style="background:' + match.team2Color + '">' + match.team2Short + '</div><div style="font-size:.85rem;margin-top:6px">' + match.team2Name + '</div></div>';
        html += '</div>';

        html += '<div class="form-group">';
        html += '<label class="form-label">Toss Won By</label>';
        html += '<select class="form-select" id="tossWinner">';
        html += '<option value="' + match.team1Id + '">' + match.team1Name + '</option>';
        html += '<option value="' + match.team2Id + '">' + match.team2Name + '</option>';
        html += '</select></div>';

        html += '<div class="form-group">';
        html += '<label class="form-label">Chose to</label>';
        html += '<select class="form-select" id="tossDecision">';
        html += '<option value="bat">Bat</option>';
        html += '<option value="bowl">Bowl</option>';
        html += '</select></div>';

        html += '<div class="form-group">';
        html += '<label class="form-label">Opening Batsman 1 (Striker)</label>';
        html += '<select class="form-select" id="opener1"></select></div>';

        html += '<div class="form-group">';
        html += '<label class="form-label">Opening Batsman 2 (Non-Striker)</label>';
        html += '<select class="form-select" id="opener2"></select></div>';

        html += '<div class="form-group">';
        html += '<label class="form-label">Opening Bowler</label>';
        html += '<select class="form-select" id="openingBowler"></select></div>';

        html += '<button class="btn btn-success btn-lg" style="width:100%;margin-top:12px" onclick="LocalScorerView.startMatch()">&#127951; Start Match</button>';
        html += '</div></div>';

        app.innerHTML = html;

        // Populate dropdowns
        populateTossDropdowns(match);

        document.getElementById('tossWinner').addEventListener('change', function () {
            populateTossDropdowns(match);
        });
        document.getElementById('tossDecision').addEventListener('change', function () {
            populateTossDropdowns(match);
        });
    }

    function populateTossDropdowns(match) {
        var tossWinner = document.getElementById('tossWinner').value;
        var tossDecision = document.getElementById('tossDecision').value;

        var battingTeamId, bowlingTeamId;
        if (tossDecision === 'bat') {
            battingTeamId = tossWinner;
            bowlingTeamId = tossWinner === match.team1Id ? match.team2Id : match.team1Id;
        } else {
            bowlingTeamId = tossWinner;
            battingTeamId = tossWinner === match.team1Id ? match.team2Id : match.team1Id;
        }

        var battingPlayers = battingTeamId === match.team1Id ? match.team1Players : match.team2Players;
        var bowlingPlayers = bowlingTeamId === match.team1Id ? match.team1Players : match.team2Players;

        var op1 = document.getElementById('opener1');
        var op2 = document.getElementById('opener2');
        var ob = document.getElementById('openingBowler');

        op1.innerHTML = battingPlayers.map(function (p) { return '<option value="' + p.id + '">' + p.name + '</option>'; }).join('');
        op2.innerHTML = battingPlayers.map(function (p) { return '<option value="' + p.id + '">' + p.name + '</option>'; }).join('');
        if (battingPlayers.length > 1) op2.selectedIndex = 1;

        ob.innerHTML = bowlingPlayers.map(function (p) { return '<option value="' + p.id + '">' + p.name + '</option>'; }).join('');
    }

    function startMatch() {
        var match = Store.getMatch(currentMatchId);
        if (!match) return;

        var tossWinner = document.getElementById('tossWinner').value;
        var tossDecision = document.getElementById('tossDecision').value;
        var opener1 = document.getElementById('opener1').value;
        var opener2 = document.getElementById('opener2').value;
        var openingBowler = document.getElementById('openingBowler').value;

        if (opener1 === opener2) {
            Toast.show({ message: 'Select different batsmen!', type: 'error' });
            return;
        }

        var battingTeamId, bowlingTeamId;
        if (tossDecision === 'bat') {
            battingTeamId = tossWinner;
            bowlingTeamId = tossWinner === match.team1Id ? match.team2Id : match.team1Id;
        } else {
            bowlingTeamId = tossWinner;
            battingTeamId = tossWinner === match.team1Id ? match.team2Id : match.team1Id;
        }

        var battingPlayers = battingTeamId === match.team1Id ? match.team1Players : match.team2Players;
        var bowlingPlayers = bowlingTeamId === match.team1Id ? match.team1Players : match.team2Players;

        var b1 = battingPlayers.find(function (p) { return p.id === opener1; });
        var b2 = battingPlayers.find(function (p) { return p.id === opener2; });
        var bw = bowlingPlayers.find(function (p) { return p.id === openingBowler; });

        match.tossWonBy = tossWinner;
        match.tossDecision = tossDecision;
        match.status = 'live';

        // Setup first innings
        match.innings[0].battingTeamId = battingTeamId;
        match.innings[0].bowlingTeamId = bowlingTeamId;
        match.innings[0].currentStriker = opener1;
        match.innings[0].currentNonStriker = opener2;
        match.innings[0].currentBowler = openingBowler;

        match.innings[0].batsmen[opener1] = { name: b1.name, runs: 0, balls: 0, fours: 0, sixes: 0, howOut: 'not out' };
        match.innings[0].batsmen[opener2] = { name: b2.name, runs: 0, balls: 0, fours: 0, sixes: 0, howOut: 'not out' };
        match.innings[0].bowlers[openingBowler] = { name: bw.name, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 };

        // Setup second innings teams
        match.innings[1].battingTeamId = bowlingTeamId;
        match.innings[1].bowlingTeamId = battingTeamId;

        match.currentInnings = 0;
        Store.saveMatch(match);

        Toast.show({ message: 'Match started!', type: 'success' });

        // Prompt to set admin PIN after first match start
        if (!ShareMatch.hasAdminPin(currentMatchId)) {
            ShareMatch.promptSetPin(currentMatchId, function () {
                render({ matchId: currentMatchId });
            });
        } else {
            render({ matchId: currentMatchId });
        }
    }

    function renderScoringInterface(app, match) {
        var ci = match.currentInnings;
        var inn = match.innings[ci];
        var battingTeamName = inn.battingTeamId === match.team1Id ? match.team1Name : match.team2Name;
        var battingTeamShort = inn.battingTeamId === match.team1Id ? match.team1Short : match.team2Short;
        var totalBalls = inn.overs * 6 + inn.balls;
        var crr = totalBalls > 0 ? (inn.score / (totalBalls / 6)).toFixed(2) : '0.00';

        var striker = inn.batsmen[inn.currentStriker] || {};
        var nonStriker = inn.batsmen[inn.currentNonStriker] || {};
        var bowler = inn.bowlers[inn.currentBowler] || {};

        var html = '<div class="scorer-container">';

        // Mini Score Header
        html += '<div class="scorer-header">';
        html += '<a class="match-back" style="margin-bottom:8px" onclick="Router.navigate(\'#/local-match/' + match.id + '\')">&#8592; Match Center</a>';
        html += '<div class="scorer-score-bar">';
        html += '<div>';
        html += '<div class="scorer-team-name">' + battingTeamName + ' <span class="badge badge-local">Innings ' + (ci + 1) + '</span></div>';
        html += '<div class="scorer-big-score" id="scorerMainScore">' + inn.score + '/' + inn.wickets + '</div>';
        html += '<div class="scorer-overs">Overs: ' + inn.overs + '.' + inn.balls + ' / ' + match.oversPerInnings + ' &bull; CRR: ' + crr + '</div>';
        html += '</div>';

        // Target info
        if (ci === 1 && match.innings[0]) {
            var target = match.innings[0].score + 1;
            var need = target - inn.score;
            var ballsLeft = (match.oversPerInnings * 6) - totalBalls;
            html += '<div class="scorer-target">Target: ' + target + '<br><span style="color:var(--accent-green)">Need ' + need + ' in ' + ballsLeft + ' balls</span></div>';
        }

        html += '</div>';

        // Free hit indicator
        if (freeHit) {
            html += '<div class="free-hit-bar">&#128165; FREE HIT</div>';
        }

        // Batsmen info
        html += '<div class="scorer-batsmen">';
        html += '<div class="scorer-batsman' + (inn.currentStriker ? ' active' : '') + '">';
        html += '<span class="striker-icon">&#127951;</span> ' + (striker.name || '?') + ': <strong>' + (striker.runs || 0) + '</strong>(' + (striker.balls || 0) + ')';
        html += '</div>';
        html += '<div class="scorer-batsman">';
        html += (nonStriker.name || '?') + ': <strong>' + (nonStriker.runs || 0) + '</strong>(' + (nonStriker.balls || 0) + ')';
        html += '</div>';
        html += '</div>';

        // Bowler info
        html += '<div class="scorer-bowler-info">';
        html += '&#127936; ' + (bowler.name || '?') + ': ' + (bowler.overs || 0) + '.' + (bowler.balls || 0) + ' - ' + (bowler.runs || 0) + '/' + (bowler.wickets || 0);
        html += '</div>';

        // Over dots (current over)
        var currentOverBalls = getCurrentOverBalls(inn);
        if (currentOverBalls.length > 0) {
            html += '<div class="scorer-over-dots">';
            currentOverBalls.forEach(function (b) {
                var cls = OverTimeline.getBallClass(b);
                html += '<div class="ball-dot ' + cls + '">' + b + '</div>';
            });
            html += '</div>';
        }

        html += '</div>'; // scorer-header

        // Scoring Buttons
        html += '<div class="scorer-controls">';

        // Runs
        html += '<div class="scorer-section-label">Runs</div>';
        html += '<div class="scorer-grid">';
        [0, 1, 2, 3, 4, 6].forEach(function (r) {
            var cls = r === 4 ? 'scorer-btn four' : r === 6 ? 'scorer-btn six' : r === 0 ? 'scorer-btn dot' : 'scorer-btn run';
            html += '<button class="' + cls + '" onclick="LocalScorerView.scoreBall({runs:' + r + '})">' + r + '</button>';
        });
        html += '</div>';

        // Extras
        html += '<div class="scorer-section-label">Extras</div>';
        html += '<div class="scorer-grid">';
        html += '<button class="scorer-btn extra" onclick="LocalScorerView.scoreBall({extras:{type:\'wide\',runs:1}})">Wide</button>';
        html += '<button class="scorer-btn extra" onclick="LocalScorerView.scoreBall({extras:{type:\'noBall\',runs:1}})">No Ball</button>';
        html += '<button class="scorer-btn extra" onclick="LocalScorerView.scoreBall({extras:{type:\'bye\',runs:1}})">1 Bye</button>';
        html += '<button class="scorer-btn extra" onclick="LocalScorerView.scoreBall({extras:{type:\'legBye\',runs:1}})">1 LB</button>';
        html += '</div>';

        // Wide + runs
        html += '<div class="scorer-grid" style="margin-top:6px">';
        html += '<button class="scorer-btn extra" onclick="LocalScorerView.scoreBall({extras:{type:\'wide\',runs:2}})">Wd+1</button>';
        html += '<button class="scorer-btn extra" onclick="LocalScorerView.scoreBall({extras:{type:\'wide\',runs:5}})">Wd+4</button>';
        html += '<button class="scorer-btn extra" onclick="LocalScorerView.scoreBall({extras:{type:\'noBall\',runs:1},batsmanRuns:1})">NB+1</button>';
        html += '<button class="scorer-btn extra" onclick="LocalScorerView.scoreBall({extras:{type:\'noBall\',runs:1},batsmanRuns:4})">NB+4</button>';
        html += '</div>';

        // Wicket
        html += '<div class="scorer-section-label">Wicket</div>';
        html += '<button class="scorer-btn wicket-btn" onclick="LocalScorerView.openWicketModal()">&#128308; WICKET</button>';

        // Actions
        html += '<div class="scorer-actions">';
        html += '<button class="btn btn-ghost" onclick="LocalScorerView.undoLastBall()">&#8617; Undo</button>';
        html += '<button class="btn btn-outline" onclick="ShareMatch.openShareModal(\'' + match.id + '\')">&#128228; Share</button>';
        html += '<button class="btn btn-outline" onclick="LocalScorerView.endInnings()">End Innings</button>';
        html += '</div>';

        // PIN setup prompt (if not already set)
        if (!ShareMatch.hasAdminPin(match.id)) {
            html += '<div class="scorer-pin-prompt" onclick="ShareMatch.promptSetPin(\'' + match.id + '\')">';
            html += '&#128274; Set Admin PIN to protect scorer access';
            html += '</div>';
        }

        html += '</div>'; // scorer-controls
        app.innerHTML = html;
    }

    function getCurrentOverBalls(inn) {
        var balls = [];
        var log = inn.ballLog || [];
        var currentOver = inn.overs;
        for (var i = log.length - 1; i >= 0; i--) {
            if (log[i].over === currentOver) {
                var text = log[i].wicket ? 'W' : log[i].extras ? (log[i].extras.type === 'wide' ? 'WD' : 'NB') : String(log[i].runs);
                balls.unshift(text);
            } else if (log[i].over < currentOver) {
                break;
            }
        }
        return balls;
    }

    function scoreBall(ballData) {
        var match = Store.getMatch(currentMatchId);
        if (!match || match.status !== 'live') return;

        var ci = match.currentInnings;
        var inn = match.innings[ci];
        var isExtra = ballData.extras && (ballData.extras.type === 'wide' || ballData.extras.type === 'noBall');
        var isWide = ballData.extras && ballData.extras.type === 'wide';
        var isNoBall = ballData.extras && ballData.extras.type === 'noBall';
        var isBye = ballData.extras && (ballData.extras.type === 'bye' || ballData.extras.type === 'legBye');
        var runs = ballData.runs || 0;
        var extraRuns = ballData.extras ? ballData.extras.runs : 0;
        var batsmanRuns = ballData.batsmanRuns || 0;

        var totalRuns = runs + extraRuns + batsmanRuns;

        // Create ball log entry
        var ballEntry = {
            over: inn.overs,
            ball: inn.balls,
            runs: runs,
            batsmanRuns: batsmanRuns,
            extras: ballData.extras || null,
            wicket: ballData.wicket || null,
            batsmanId: inn.currentStriker,
            bowlerId: inn.currentBowler,
            totalRuns: totalRuns,
            freeHit: freeHit,
            commentary: generateCommentary(ballData, inn)
        };

        inn.ballLog.push(ballEntry);

        // Update score
        inn.score += totalRuns;

        // Update extras
        if (ballData.extras) {
            var exType = ballData.extras.type;
            if (exType === 'wide') inn.extras.wides += extraRuns;
            else if (exType === 'noBall') inn.extras.noBalls += extraRuns;
            else if (exType === 'bye') inn.extras.byes += extraRuns;
            else if (exType === 'legBye') inn.extras.legByes += extraRuns;
            inn.extras.total += extraRuns;
        }

        // Update batsman stats (only for actual bat runs, not byes/leg byes)
        var strikerStats = inn.batsmen[inn.currentStriker];
        if (strikerStats) {
            if (!isWide) {
                // Ball counts for batsman (except wide)
                strikerStats.balls++;
            }
            // Runs to batsman (actual runs or batsmanRuns from NB)
            var batsRuns = isBye ? 0 : (isNoBall ? batsmanRuns : runs);
            strikerStats.runs += batsRuns;
            if (batsRuns === 4) strikerStats.fours++;
            if (batsRuns === 6) strikerStats.sixes++;
        }

        // Update bowler stats
        var bowlerStats = inn.bowlers[inn.currentBowler];
        if (bowlerStats) {
            // Bowler concedes: runs + extras (wide/noBall runs count against bowler; byes/legbyes don't)
            if (isWide || isNoBall) {
                bowlerStats.runs += totalRuns;
            } else if (isBye) {
                // Byes don't count against bowler, but ball counts
                // runs from bat go to bowler, extra (bye) doesn't
            } else {
                bowlerStats.runs += runs;
            }

            // Legal delivery?
            if (!isWide && !isNoBall) {
                bowlerStats.balls++;
                if (bowlerStats.balls >= 6) {
                    bowlerStats.overs++;
                    bowlerStats.balls = 0;
                }
            }
        }

        // Free hit: after no ball, next ball is free hit
        if (isNoBall) {
            freeHit = true;
        } else if (!isWide) {
            freeHit = false;
        }

        // Handle wicket
        if (ballData.wicket) {
            inn.wickets++;
            var outBatsmanId = ballData.wicket.batsmanId || inn.currentStriker;
            if (inn.batsmen[outBatsmanId]) {
                inn.batsmen[outBatsmanId].howOut = ballData.wicket.howOut || 'out';
            }
            inn.fallOfWickets.push({
                wicketNum: inn.wickets,
                score: inn.score,
                overs: inn.overs + '.' + inn.balls,
                batsmanId: outBatsmanId
            });

            Toast.show({ message: 'WICKET! ' + (inn.batsmen[outBatsmanId] ? inn.batsmen[outBatsmanId].name : '') + ' is out!', type: 'wicket' });
        }

        // Update overs (legal delivery)
        if (!isWide && !isNoBall) {
            inn.balls++;
            if (inn.balls >= 6) {
                inn.overs++;
                inn.balls = 0;
            }
        }

        // Strike rotation
        var runsForRotation = isBye ? extraRuns : (isNoBall ? batsmanRuns : runs);
        if (!isWide) {
            if (runsForRotation % 2 === 1) {
                // Swap striker
                var temp = inn.currentStriker;
                inn.currentStriker = inn.currentNonStriker;
                inn.currentNonStriker = temp;
            }
        }

        // End of over? swap striker + ask new bowler
        if (inn.balls === 0 && inn.overs > 0 && !isWide && !isNoBall) {
            // Swap ends at end of over
            var temp2 = inn.currentStriker;
            inn.currentStriker = inn.currentNonStriker;
            inn.currentNonStriker = temp2;

            // Check maiden
            if (bowlerStats) {
                var overBalls = inn.ballLog.filter(function (b) { return b.over === inn.overs - 1 && !b.extras; });
                var overRuns = overBalls.reduce(function (s, b) { return s + b.runs; }, 0);
                if (overRuns === 0 && overBalls.length === 6) bowlerStats.maidens++;
            }

            Store.saveMatch(match);
            promptNewBowler(match);
            return;
        }

        // Handle new batsman after wicket
        if (ballData.wicket) {
            Store.saveMatch(match);
            promptNewBatsman(match, ballData.wicket.batsmanId || inn.currentStriker);
            return;
        }

        // Check innings end conditions
        if (checkInningsEnd(match)) return;

        Store.saveMatch(match);
        ShareMatch.broadcastUpdate(currentMatchId);
        ScoreTicker.update();
        render({ matchId: currentMatchId });

        // Celebrations
        if (runs === 4) Toast.show({ message: 'FOUR!', type: 'boundary', duration: 1500 });
        if (runs === 6 || batsmanRuns === 6) Toast.show({ message: 'SIX!', type: 'six', duration: 1500 });
    }

    function generateCommentary(ballData, inn) {
        var striker = inn.batsmen[inn.currentStriker];
        var bowler = inn.bowlers[inn.currentBowler];
        var sName = striker ? striker.name : 'Batsman';
        var bName = bowler ? bowler.name : 'Bowler';
        var ov = inn.overs + '.' + (inn.balls + 1);

        if (ballData.wicket) return ov + ' ' + bName + ' to ' + sName + ', OUT! ' + (ballData.wicket.howOut || 'Wicket');
        if (ballData.extras && ballData.extras.type === 'wide') return ov + ' ' + bName + ', Wide ball, ' + ballData.extras.runs + ' runs';
        if (ballData.extras && ballData.extras.type === 'noBall') return ov + ' ' + bName + ', No ball! ' + (ballData.batsmanRuns || 0) + ' runs';
        if (ballData.runs === 6) return ov + ' ' + bName + ' to ' + sName + ', SIX! Massive hit!';
        if (ballData.runs === 4) return ov + ' ' + bName + ' to ' + sName + ', FOUR! Beautiful shot!';
        if (ballData.runs === 0) return ov + ' ' + bName + ' to ' + sName + ', no run, dot ball';
        return ov + ' ' + bName + ' to ' + sName + ', ' + ballData.runs + ' run' + (ballData.runs > 1 ? 's' : '');
    }

    function checkInningsEnd(match) {
        var ci = match.currentInnings;
        var inn = match.innings[ci];
        var totalBalls = inn.overs * 6 + inn.balls;
        var maxBalls = match.oversPerInnings * 6;
        var battingPlayers = inn.battingTeamId === match.team1Id ? match.team1Players : match.team2Players;

        // All out
        var allOut = inn.wickets >= battingPlayers.length - 1;
        // Overs completed
        var oversComplete = totalBalls >= maxBalls;
        // Target chased (2nd innings)
        var targetChased = ci === 1 && match.innings[0] && inn.score > match.innings[0].score;

        if (allOut || oversComplete || targetChased) {
            if (ci === 0) {
                // End first innings, start second
                match.currentInnings = 1;
                Store.saveMatch(match);
                Toast.show({ message: 'Innings Over! Target: ' + (inn.score + 1), type: 'info', duration: 3000 });
                promptSecondInningsSetup(match);
                return true;
            } else {
                // Match over
                endMatch(match);
                return true;
            }
        }
        return false;
    }

    function endMatch(match) {
        match.status = 'completed';
        var inn1 = match.innings[0];
        var inn2 = match.innings[1];

        var team1BattedFirst = inn1.battingTeamId === match.team1Id;
        var firstBatTeam = team1BattedFirst ? match.team1Name : match.team2Name;
        var secondBatTeam = team1BattedFirst ? match.team2Name : match.team1Name;

        if (inn2.score > inn1.score) {
            var wicketsLeft = (inn2.battingTeamId === match.team1Id ? match.team1Players.length : match.team2Players.length) - 1 - inn2.wickets;
            match.result = secondBatTeam + ' won by ' + wicketsLeft + ' wickets';
        } else if (inn1.score > inn2.score) {
            match.result = firstBatTeam + ' won by ' + (inn1.score - inn2.score) + ' runs';
        } else {
            match.result = 'Match Tied!';
        }

        Store.saveMatch(match);
        ScoreTicker.update();
        Toast.show({ message: match.result, type: 'success', duration: 5000 });
        Router.navigate('#/local-match/' + match.id);
    }

    function endInnings() {
        var match = Store.getMatch(currentMatchId);
        if (!match) return;

        Modal.open({
            title: 'End Innings',
            content: '<p style="color:var(--text-secondary)">Are you sure you want to end the current innings?</p>',
            confirmText: 'End Innings',
            confirmClass: 'btn-danger',
            size: 'small',
            onConfirm: function () {
                Modal.close();
                var ci = match.currentInnings;
                if (ci === 0) {
                    match.currentInnings = 1;
                    Store.saveMatch(match);
                    Toast.show({ message: 'Innings Over! Target: ' + (match.innings[0].score + 1), type: 'info' });
                    promptSecondInningsSetup(match);
                } else {
                    endMatch(match);
                }
            }
        });
    }

    function promptNewBowler(match) {
        var ci = match.currentInnings;
        var inn = match.innings[ci];
        var bowlingPlayers = inn.bowlingTeamId === match.team1Id ? match.team1Players : match.team2Players;
        var lastBowler = inn.currentBowler;

        var html = '<div class="form-group">';
        html += '<label class="form-label">Select New Bowler</label>';
        html += '<select class="form-select" id="newBowlerSelect">';
        bowlingPlayers.forEach(function (p) {
            if (p.id !== lastBowler) {
                var existing = inn.bowlers[p.id];
                var info = existing ? ' (' + existing.overs + '.' + existing.balls + ' - ' + existing.runs + '/' + existing.wickets + ')' : '';
                html += '<option value="' + p.id + '">' + p.name + info + '</option>';
            }
        });
        html += '</select></div>';

        Modal.open({
            title: 'New Over - Select Bowler',
            content: html,
            confirmText: 'Confirm',
            confirmClass: 'btn-primary',
            showCancel: false,
            size: 'small',
            onConfirm: function () {
                var bowlerId = document.getElementById('newBowlerSelect').value;
                var bowlerPlayer = bowlingPlayers.find(function (p) { return p.id === bowlerId; });

                if (!inn.bowlers[bowlerId]) {
                    inn.bowlers[bowlerId] = { name: bowlerPlayer.name, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 };
                }
                inn.currentBowler = bowlerId;

                Store.saveMatch(match);
                Modal.close();

                if (checkInningsEnd(match)) return;
                render({ matchId: currentMatchId });
            }
        });
    }

    function promptNewBatsman(match, outBatsmanId) {
        var ci = match.currentInnings;
        var inn = match.innings[ci];
        var battingPlayers = inn.battingTeamId === match.team1Id ? match.team1Players : match.team2Players;

        var available = battingPlayers.filter(function (p) {
            return !inn.batsmen[p.id] || (inn.batsmen[p.id].howOut === 'not out' && p.id !== outBatsmanId);
        }).filter(function (p) {
            return p.id !== inn.currentStriker && p.id !== inn.currentNonStriker;
        });

        // Check if match should end (all out)
        if (available.length === 0) {
            if (checkInningsEnd(match)) return;
            render({ matchId: currentMatchId });
            return;
        }

        var html = '<div class="form-group">';
        html += '<label class="form-label">Select New Batsman</label>';
        html += '<select class="form-select" id="newBatsmanSelect">';
        available.forEach(function (p) {
            html += '<option value="' + p.id + '">' + p.name + '</option>';
        });
        html += '</select></div>';

        Modal.open({
            title: 'New Batsman',
            content: html,
            confirmText: 'Send to Crease',
            confirmClass: 'btn-primary',
            showCancel: false,
            size: 'small',
            onConfirm: function () {
                var newBatId = document.getElementById('newBatsmanSelect').value;
                var newBatPlayer = battingPlayers.find(function (p) { return p.id === newBatId; });

                inn.batsmen[newBatId] = { name: newBatPlayer.name, runs: 0, balls: 0, fours: 0, sixes: 0, howOut: 'not out' };

                if (inn.currentStriker === outBatsmanId) {
                    inn.currentStriker = newBatId;
                } else {
                    inn.currentNonStriker = newBatId;
                }

                Store.saveMatch(match);
                Modal.close();

                if (checkInningsEnd(match)) return;
                render({ matchId: currentMatchId });
            }
        });
    }

    function promptSecondInningsSetup(match) {
        var battingTeamId = match.innings[1].battingTeamId;
        var bowlingTeamId = match.innings[1].bowlingTeamId;
        var battingPlayers = battingTeamId === match.team1Id ? match.team1Players : match.team2Players;
        var bowlingPlayers = bowlingTeamId === match.team1Id ? match.team1Players : match.team2Players;
        var battingTeamName = battingTeamId === match.team1Id ? match.team1Name : match.team2Name;

        var html = '<p style="margin-bottom:16px;color:var(--text-secondary)"><strong>' + battingTeamName + '</strong> batting. Target: <strong>' + (match.innings[0].score + 1) + '</strong></p>';

        html += '<div class="form-group">';
        html += '<label class="form-label">Opening Batsman 1 (Striker)</label>';
        html += '<select class="form-select" id="inn2opener1">';
        battingPlayers.forEach(function (p) { html += '<option value="' + p.id + '">' + p.name + '</option>'; });
        html += '</select></div>';

        html += '<div class="form-group">';
        html += '<label class="form-label">Opening Batsman 2</label>';
        html += '<select class="form-select" id="inn2opener2">';
        battingPlayers.forEach(function (p) { html += '<option value="' + p.id + '">' + p.name + '</option>'; });
        html += '</select></div>';

        html += '<div class="form-group">';
        html += '<label class="form-label">Opening Bowler</label>';
        html += '<select class="form-select" id="inn2bowler">';
        bowlingPlayers.forEach(function (p) { html += '<option value="' + p.id + '">' + p.name + '</option>'; });
        html += '</select></div>';

        Modal.open({
            title: '2nd Innings Setup',
            content: html,
            confirmText: 'Start 2nd Innings',
            confirmClass: 'btn-success',
            showCancel: false,
            size: 'normal',
            onConfirm: function () {
                var op1 = document.getElementById('inn2opener1').value;
                var op2 = document.getElementById('inn2opener2').value;
                var bw = document.getElementById('inn2bowler').value;

                if (op1 === op2) { Toast.show({ message: 'Select different batsmen!', type: 'error' }); return; }

                var b1 = battingPlayers.find(function (p) { return p.id === op1; });
                var b2 = battingPlayers.find(function (p) { return p.id === op2; });
                var bwPlayer = bowlingPlayers.find(function (p) { return p.id === bw; });

                match.innings[1].currentStriker = op1;
                match.innings[1].currentNonStriker = op2;
                match.innings[1].currentBowler = bw;
                match.innings[1].batsmen[op1] = { name: b1.name, runs: 0, balls: 0, fours: 0, sixes: 0, howOut: 'not out' };
                match.innings[1].batsmen[op2] = { name: b2.name, runs: 0, balls: 0, fours: 0, sixes: 0, howOut: 'not out' };
                match.innings[1].bowlers[bw] = { name: bwPlayer.name, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 };

                freeHit = false;
                Store.saveMatch(match);
                Modal.close();
                render({ matchId: currentMatchId });
            }
        });

        // Set second option by default
        setTimeout(function () {
            var sel = document.getElementById('inn2opener2');
            if (sel && sel.options.length > 1) sel.selectedIndex = 1;
        }, 100);
    }

    function openWicketModal() {
        var match = Store.getMatch(currentMatchId);
        if (!match) return;
        var ci = match.currentInnings;
        var inn = match.innings[ci];

        if (freeHit) {
            // On free hit, only run out is allowed
            Toast.show({ message: 'Free hit! Only Run Out allowed', type: 'info' });
        }

        var html = '<div class="form-group">';
        html += '<label class="form-label">Dismissal Type</label>';
        html += '<select class="form-select" id="wicketType">';
        if (!freeHit) {
            html += '<option value="Bowled">Bowled</option>';
            html += '<option value="Caught">Caught</option>';
            html += '<option value="LBW">LBW</option>';
            html += '<option value="Stumped">Stumped</option>';
            html += '<option value="Hit Wicket">Hit Wicket</option>';
        }
        html += '<option value="Run Out"' + (freeHit ? ' selected' : '') + '>Run Out</option>';
        html += '<option value="Retired Hurt">Retired Hurt</option>';
        html += '</select></div>';

        html += '<div class="form-group">';
        html += '<label class="form-label">Runs scored on this ball</label>';
        html += '<select class="form-select" id="wicketRuns">';
        for (var i = 0; i <= 3; i++) html += '<option value="' + i + '">' + i + '</option>';
        html += '</select></div>';

        html += '<div class="form-group" id="runOutBatsmanGroup" style="display:none">';
        html += '<label class="form-label">Which batsman is out?</label>';
        html += '<select class="form-select" id="runOutBatsman">';
        html += '<option value="striker">' + (inn.batsmen[inn.currentStriker] ? inn.batsmen[inn.currentStriker].name : 'Striker') + '</option>';
        html += '<option value="nonStriker">' + (inn.batsmen[inn.currentNonStriker] ? inn.batsmen[inn.currentNonStriker].name : 'Non-Striker') + '</option>';
        html += '</select></div>';

        Modal.open({
            title: 'Wicket!',
            content: html,
            confirmText: 'Confirm Wicket',
            confirmClass: 'btn-danger',
            onConfirm: function () {
                var type = document.getElementById('wicketType').value;
                var runs = parseInt(document.getElementById('wicketRuns').value) || 0;
                var outBatsmanId = inn.currentStriker;

                if (type === 'Run Out') {
                    var who = document.getElementById('runOutBatsman').value;
                    outBatsmanId = who === 'striker' ? inn.currentStriker : inn.currentNonStriker;
                }

                Modal.close();
                scoreBall({
                    runs: runs,
                    wicket: {
                        howOut: type,
                        batsmanId: outBatsmanId
                    }
                });
            }
        });

        // Show run out batsman selector
        setTimeout(function () {
            var sel = document.getElementById('wicketType');
            if (sel) {
                sel.addEventListener('change', function () {
                    var group = document.getElementById('runOutBatsmanGroup');
                    group.style.display = sel.value === 'Run Out' ? 'block' : 'none';
                });
                if (freeHit) {
                    var group = document.getElementById('runOutBatsmanGroup');
                    if (group) group.style.display = 'block';
                }
            }
        }, 50);
    }

    function undoLastBall() {
        var match = Store.getMatch(currentMatchId);
        if (!match) return;
        var ci = match.currentInnings;
        var inn = match.innings[ci];

        if (!inn.ballLog || inn.ballLog.length === 0) {
            Toast.show({ message: 'Nothing to undo', type: 'info' });
            return;
        }

        // Remove last ball
        var lastBall = inn.ballLog.pop();

        // Recompute entire innings from ball log
        var freshInn = Store.createEmptyInnings(inn.battingTeamId, inn.bowlingTeamId);
        freshInn.currentStriker = inn.currentStriker;
        freshInn.currentNonStriker = inn.currentNonStriker;
        freshInn.currentBowler = inn.currentBowler;

        // Copy batsmen and bowlers structure but reset stats
        Object.keys(inn.batsmen).forEach(function (key) {
            freshInn.batsmen[key] = { name: inn.batsmen[key].name, runs: 0, balls: 0, fours: 0, sixes: 0, howOut: 'not out' };
        });
        Object.keys(inn.bowlers).forEach(function (key) {
            freshInn.bowlers[key] = { name: inn.bowlers[key].name, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 };
        });

        // Replay all remaining balls - simplified: just revert score by last ball's contribution
        // For simplicity, revert the stats of last ball
        inn.score -= lastBall.totalRuns;

        if (lastBall.extras) {
            var exType = lastBall.extras.type;
            if (exType === 'wide') inn.extras.wides -= lastBall.extras.runs;
            else if (exType === 'noBall') inn.extras.noBalls -= lastBall.extras.runs;
            else if (exType === 'bye') inn.extras.byes -= lastBall.extras.runs;
            else if (exType === 'legBye') inn.extras.legByes -= lastBall.extras.runs;
            inn.extras.total -= lastBall.extras.runs;
        }

        var isWide = lastBall.extras && lastBall.extras.type === 'wide';
        var isNoBall = lastBall.extras && lastBall.extras.type === 'noBall';
        var isBye = lastBall.extras && (lastBall.extras.type === 'bye' || lastBall.extras.type === 'legBye');

        // Revert batsman stats
        if (inn.batsmen[lastBall.batsmanId]) {
            var bat = inn.batsmen[lastBall.batsmanId];
            if (!isWide) bat.balls--;
            var bRuns = isBye ? 0 : (isNoBall ? (lastBall.batsmanRuns || 0) : (lastBall.runs || 0));
            bat.runs -= bRuns;
            if (bRuns === 4) bat.fours--;
            if (bRuns === 6) bat.sixes--;
        }

        // Revert bowler stats
        if (inn.bowlers[lastBall.bowlerId]) {
            var bw = inn.bowlers[lastBall.bowlerId];
            if (isWide || isNoBall) {
                bw.runs -= lastBall.totalRuns;
            } else if (!isBye) {
                bw.runs -= lastBall.runs;
            }
            if (!isWide && !isNoBall) {
                bw.balls--;
                if (bw.balls < 0) {
                    bw.overs--;
                    bw.balls = 5;
                }
            }
        }

        // Revert overs
        if (!isWide && !isNoBall) {
            inn.balls--;
            if (inn.balls < 0) {
                inn.overs--;
                inn.balls = 5;
            }
        }

        // Revert wicket
        if (lastBall.wicket) {
            inn.wickets--;
            if (inn.batsmen[lastBall.wicket.batsmanId]) {
                inn.batsmen[lastBall.wicket.batsmanId].howOut = 'not out';
            }
            inn.fallOfWickets.pop();
        }

        // Revert strike rotation
        var runsForRotation = isBye ? (lastBall.extras ? lastBall.extras.runs : 0) : (isNoBall ? (lastBall.batsmanRuns || 0) : lastBall.runs);
        if (!isWide && runsForRotation % 2 === 1) {
            var temp = inn.currentStriker;
            inn.currentStriker = inn.currentNonStriker;
            inn.currentNonStriker = temp;
        }

        freeHit = false;

        Store.saveMatch(match);
        Toast.show({ message: 'Last ball undone', type: 'info' });
        render({ matchId: currentMatchId });
    }

    return {
        render: render,
        startMatch: startMatch,
        scoreBall: scoreBall,
        openWicketModal: openWicketModal,
        undoLastBall: undoLastBall,
        endInnings: endInnings
    };
})();

// Scorer styles
(function () {
    var style = document.createElement('style');
    style.textContent = '' +
        '.scorer-container{max-width:500px;margin:0 auto;padding:12px}' +
        '.scorer-header{background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-xl);padding:16px;margin-bottom:12px}' +
        '.scorer-score-bar{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}' +
        '.scorer-team-name{font-size:.8rem;color:var(--text-secondary);margin-bottom:4px;display:flex;align-items:center;gap:8px}' +
        '.scorer-big-score{font-size:2.5rem;font-weight:900;line-height:1}' +
        '.scorer-overs{font-size:.8rem;color:var(--text-secondary);margin-top:4px}' +
        '.scorer-target{text-align:right;font-size:.85rem;font-weight:600;color:var(--accent-yellow)}' +
        '.scorer-batsmen{display:flex;gap:12px;margin-top:12px;flex-wrap:wrap}' +
        '.scorer-batsman{padding:8px 12px;background:rgba(255,255,255,.03);border-radius:var(--radius-sm);font-size:.8rem;flex:1;min-width:140px}' +
        '.scorer-batsman.active{border-left:2px solid var(--accent-yellow)}' +
        '.scorer-bowler-info{margin-top:8px;padding:8px 12px;background:rgba(255,255,255,.03);border-radius:var(--radius-sm);font-size:.8rem;color:var(--text-secondary)}' +
        '.scorer-over-dots{display:flex;gap:6px;margin-top:12px;justify-content:center;flex-wrap:wrap}' +
        '.free-hit-bar{background:rgba(255,145,0,.15);color:var(--accent-orange);text-align:center;padding:8px;border-radius:var(--radius-sm);font-weight:700;font-size:.85rem;margin-bottom:8px;animation:pulse 1s infinite}' +
        '.scorer-controls{background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-xl);padding:16px}' +
        '.scorer-section-label{font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:12px 0 8px}' +
        '.scorer-section-label:first-child{margin-top:0}' +
        '.scorer-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}' +
        '.scorer-btn{padding:14px 8px;border-radius:var(--radius-md);text-align:center;font-weight:700;font-size:1.1rem;border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);cursor:pointer;transition:var(--transition-fast);min-height:48px;display:flex;align-items:center;justify-content:center}' +
        '.scorer-btn:hover{transform:scale(1.05)}' +
        '.scorer-btn:active{transform:scale(0.95)}' +
        '.scorer-btn.dot{color:var(--text-muted)}' +
        '.scorer-btn.run{color:var(--accent-blue)}' +
        '.scorer-btn.four{background:rgba(0,230,118,.1);color:var(--accent-green);border-color:rgba(0,230,118,.2);font-size:1.3rem}' +
        '.scorer-btn.six{background:rgba(255,214,0,.1);color:var(--accent-yellow);border-color:rgba(255,214,0,.2);font-size:1.3rem}' +
        '.scorer-btn.extra{font-size:.75rem;background:var(--bg-input);color:var(--text-secondary)}' +
        '.wicket-btn{display:block;width:100%;padding:14px;border-radius:var(--radius-md);text-align:center;font-weight:700;font-size:1rem;background:rgba(255,23,68,.1);color:var(--accent-red);border:1px solid rgba(255,23,68,.2);cursor:pointer;text-transform:uppercase;letter-spacing:2px;transition:var(--transition-fast)}' +
        '.wicket-btn:hover{background:rgba(255,23,68,.2)}' +
        '.scorer-actions{display:flex;gap:10px;margin-top:16px;justify-content:center}' +
        '.scorer-pin-prompt{margin-top:12px;text-align:center;padding:10px;background:rgba(255,214,0,.06);border:1px dashed rgba(255,214,0,.2);border-radius:var(--radius-md);color:var(--accent-yellow);font-size:.8rem;cursor:pointer;transition:var(--transition-fast)}' +
        '.scorer-pin-prompt:hover{background:rgba(255,214,0,.1)}';
    document.head.appendChild(style);
})();
