/* ============ TOURNAMENTS VIEW ============ */
var TournamentsView = (function () {

    function render() {
        var app = document.getElementById('app');
        var tournaments = Store.getTournaments();

        var html = '<div class="container">';
        html += '<div class="flex-between" style="margin-bottom:24px;flex-wrap:wrap;gap:12px">';
        html += '<div><h1 class="section-title">&#127942; Tournaments</h1><p class="section-subtitle">Organize local tournaments</p></div>';
        html += '<button class="btn btn-primary" onclick="TournamentsView.openCreateModal()">+ New Tournament</button>';
        html += '</div>';

        if (tournaments.length === 0) {
            html += '<div class="empty-state">';
            html += '<div class="empty-state-icon">&#127942;</div>';
            html += '<div class="empty-state-title">No Tournaments Yet</div>';
            html += '<div class="empty-state-desc">Create teams first, then organize a tournament!</div>';
            html += '<br><button class="btn btn-primary" onclick="TournamentsView.openCreateModal()">+ New Tournament</button>';
            html += '</div>';
        } else {
            html += '<div class="grid-auto stagger-children">';
            tournaments.forEach(function (t) {
                html += renderTournamentCard(t);
            });
            html += '</div>';
        }

        html += '</div>';
        app.innerHTML = html;
    }

    function renderTournamentCard(tournament) {
        var teams = (tournament.teamIds || []).map(function (id) { return Store.getTeam(id); }).filter(Boolean);
        var matches = (tournament.matchIds || []).map(function (id) { return Store.getMatch(id); }).filter(Boolean);
        var completed = matches.filter(function (m) { return m.status === 'completed'; }).length;
        var live = matches.filter(function (m) { return m.status === 'live'; }).length;

        var html = '<div class="card card-clickable card-enter" onclick="Router.navigate(\'#/tournaments/' + tournament.id + '\')">';

        html += '<div class="flex-between" style="margin-bottom:12px">';
        html += '<div style="font-weight:700;font-size:1.1rem">&#127942; ' + tournament.name + '</div>';
        html += '<span class="badge badge-' + (tournament.format || 'T20').toLowerCase() + '">' + (tournament.format || 'T20') + '</span>';
        html += '</div>';

        html += '<div style="display:flex;gap:16px;font-size:.8rem;color:var(--text-secondary);margin-bottom:12px">';
        html += '<span>&#128101; ' + teams.length + ' teams</span>';
        html += '<span>&#127951; ' + matches.length + ' matches</span>';
        if (live > 0) html += '<span style="color:var(--accent-green)"><span class="live-dot"></span> ' + live + ' live</span>';
        html += '<span>' + completed + '/' + matches.length + ' done</span>';
        html += '</div>';

        // Team logos row
        if (teams.length > 0) {
            html += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
            teams.forEach(function (team) {
                html += '<div class="team-logo team-logo-sm" style="background:' + (team.logoColor || '#2979ff') + ';width:28px;height:28px;font-size:.55rem">' + (team.shortName || '??') + '</div>';
            });
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function renderDetail(params) {
        var id = params.id;
        var app = document.getElementById('app');
        var tournament = Store.getTournament(id);

        if (!tournament) {
            app.innerHTML = '<div class="container"><div class="empty-state"><div class="empty-state-title">Tournament not found</div><br><a href="#/tournaments" class="btn btn-primary">Back</a></div></div>';
            return;
        }

        var teams = (tournament.teamIds || []).map(function (tid) { return Store.getTeam(tid); }).filter(Boolean);
        var matches = (tournament.matchIds || []).map(function (mid) { return Store.getMatch(mid); }).filter(Boolean);

        var html = '<div class="container">';
        html += '<a class="match-back" onclick="Router.navigate(\'#/tournaments\')">&#8592; Back to Tournaments</a>';

        html += '<div class="flex-between" style="margin:16px 0 24px;flex-wrap:wrap;gap:12px">';
        html += '<div><h1 class="section-title">&#127942; ' + tournament.name + '</h1>';
        html += '<p class="section-subtitle">' + (tournament.format || 'T20') + ' &bull; ' + teams.length + ' teams &bull; ' + (tournament.oversPerInnings || 20) + ' overs</p></div>';
        html += '<button class="btn btn-danger btn-sm" onclick="TournamentsView.confirmDeleteTournament(\'' + id + '\')">Delete Tournament</button>';
        html += '</div>';

        // Tabs
        html += '<div class="tabs">';
        html += '<button class="tab active" onclick="MatchCenterView.switchTab(this, \'matches\')">&#127951; Matches</button>';
        html += '<button class="tab" onclick="MatchCenterView.switchTab(this, \'points\')">&#128202; Points Table</button>';
        html += '</div>';

        // Matches Tab
        html += '<div class="tab-content active" id="tab-matches">';
        if (matches.length === 0) {
            html += '<div class="empty-state"><div class="empty-state-desc">No matches yet. Generate fixtures!</div>';
            html += '<br><button class="btn btn-primary" onclick="TournamentsView.generateFixtures(\'' + id + '\')">Generate Fixtures</button></div>';
        } else {
            html += '<div style="display:flex;flex-direction:column;gap:10px">';
            matches.forEach(function (m, idx) {
                var statusClass = m.status === 'live' ? 'border-color:var(--accent-green)' : m.status === 'completed' ? 'border-color:rgba(255,214,0,.2)' : '';
                html += '<div class="card" style="padding:14px;' + statusClass + '">';
                html += '<div class="flex-between">';
                html += '<div style="display:flex;align-items:center;gap:10px">';
                html += '<span style="font-size:.75rem;color:var(--text-muted);font-weight:600">Match ' + (idx + 1) + '</span>';
                html += '<div class="team-logo team-logo-sm" style="background:' + (m.team1Color || '#2979ff') + ';width:24px;height:24px;font-size:.5rem">' + (m.team1Short || 'T1') + '</div>';
                html += '<span style="font-weight:600;font-size:.85rem">' + (m.team1Name || 'Team 1') + '</span>';

                var inn0 = m.innings && m.innings[0];
                if (inn0 && (inn0.score > 0 || m.status !== 'not_started')) {
                    html += '<span style="font-weight:700;margin-left:4px">' + inn0.score + '/' + inn0.wickets + '</span>';
                }

                html += '<span style="color:var(--text-dim);margin:0 6px">vs</span>';
                html += '<div class="team-logo team-logo-sm" style="background:' + (m.team2Color || '#ff9100') + ';width:24px;height:24px;font-size:.5rem">' + (m.team2Short || 'T2') + '</div>';
                html += '<span style="font-weight:600;font-size:.85rem">' + (m.team2Name || 'Team 2') + '</span>';

                var inn1 = m.innings && m.innings[1];
                if (inn1 && (inn1.score > 0 || m.currentInnings === 1)) {
                    html += '<span style="font-weight:700;margin-left:4px">' + inn1.score + '/' + inn1.wickets + '</span>';
                }

                html += '</div>';

                // Actions
                html += '<div style="display:flex;gap:6px;align-items:center">';
                if (m.status === 'not_started') {
                    html += '<button class="btn btn-success btn-sm" onclick="event.stopPropagation();Router.navigate(\'#/scorer/' + m.id + '\')">Start</button>';
                } else if (m.status === 'live') {
                    html += '<span class="live-badge" style="margin-right:6px"><span class="live-dot"></span>LIVE</span>';
                    html += '<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();Router.navigate(\'#/scorer/' + m.id + '\')">Score</button>';
                } else {
                    html += '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();Router.navigate(\'#/local-match/' + m.id + '\')">View</button>';
                }
                html += '</div>';

                html += '</div>';
                if (m.result) html += '<div style="font-size:.78rem;color:var(--accent-yellow);margin-top:6px">' + m.result + '</div>';
                html += '</div>';
            });
            html += '</div>';
        }
        html += '</div>';

        // Points Table Tab
        html += '<div class="tab-content" id="tab-points">';
        html += renderPointsTable(tournament, teams, matches);
        html += '</div>';

        html += '</div>';
        app.innerHTML = html;
    }

    function renderPointsTable(tournament, teams, matches) {
        var points = {};
        teams.forEach(function (t) {
            points[t.id] = { team: t, played: 0, won: 0, lost: 0, tied: 0, nr: 0, pts: 0 };
        });

        matches.forEach(function (m) {
            if (m.status !== 'completed') return;
            if (points[m.team1Id]) points[m.team1Id].played++;
            if (points[m.team2Id]) points[m.team2Id].played++;

            // Determine winner from result
            if (m.result && m.result.includes(m.team1Name + ' won')) {
                if (points[m.team1Id]) { points[m.team1Id].won++; points[m.team1Id].pts += 2; }
                if (points[m.team2Id]) { points[m.team2Id].lost++; }
            } else if (m.result && m.result.includes(m.team2Name + ' won')) {
                if (points[m.team2Id]) { points[m.team2Id].won++; points[m.team2Id].pts += 2; }
                if (points[m.team1Id]) { points[m.team1Id].lost++; }
            } else if (m.result && m.result.includes('Tie')) {
                if (points[m.team1Id]) { points[m.team1Id].tied++; points[m.team1Id].pts += 1; }
                if (points[m.team2Id]) { points[m.team2Id].tied++; points[m.team2Id].pts += 1; }
            }
        });

        var sorted = Object.values(points).sort(function (a, b) { return b.pts - a.pts || b.won - a.won; });

        var html = '<div class="table-wrap"><table class="data-table">';
        html += '<thead><tr><th>#</th><th>Team</th><th class="text-center">P</th><th class="text-center">W</th><th class="text-center">L</th><th class="text-center">T</th><th class="text-center">Pts</th></tr></thead><tbody>';

        sorted.forEach(function (row, idx) {
            html += '<tr>';
            html += '<td style="font-weight:700;color:var(--text-muted)">' + (idx + 1) + '</td>';
            html += '<td><div style="display:flex;align-items:center;gap:8px">';
            html += '<div class="team-logo team-logo-sm" style="background:' + (row.team.logoColor || '#2979ff') + ';width:24px;height:24px;font-size:.5rem">' + (row.team.shortName || '??') + '</div>';
            html += '<span style="font-weight:600">' + row.team.name + '</span></div></td>';
            html += '<td class="text-center">' + row.played + '</td>';
            html += '<td class="text-center" style="color:var(--accent-green)">' + row.won + '</td>';
            html += '<td class="text-center" style="color:var(--accent-red)">' + row.lost + '</td>';
            html += '<td class="text-center">' + row.tied + '</td>';
            html += '<td class="text-center" style="font-weight:800;font-size:1rem">' + row.pts + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        return html;
    }

    function openCreateModal() {
        var teams = Store.getTeams();
        if (teams.length < 2) {
            Toast.show({ message: 'You need at least 2 teams. Create teams first!', type: 'error', duration: 4000 });
            Router.navigate('#/teams');
            return;
        }

        var html = '<div class="form-group">';
        html += '<label class="form-label">Tournament Name</label>';
        html += '<input type="text" class="form-input" id="tournamentName" placeholder="e.g. Gully Premier League">';
        html += '</div>';

        html += '<div class="form-row">';
        html += '<div class="form-group">';
        html += '<label class="form-label">Format</label>';
        html += '<select class="form-select" id="tournamentFormat" onchange="TournamentsView.onFormatChange()">';
        html += '<option value="T20">T20 (20 overs)</option>';
        html += '<option value="T10">T10 (10 overs)</option>';
        html += '<option value="ODI">ODI (50 overs)</option>';
        html += '<option value="Custom">Custom</option>';
        html += '</select></div>';
        html += '<div class="form-group">';
        html += '<label class="form-label">Overs per Innings</label>';
        html += '<input type="number" class="form-input" id="tournamentOvers" value="20" min="1" max="50">';
        html += '</div></div>';

        html += '<div class="form-group">';
        html += '<label class="form-label">Select Teams (min 2)</label>';
        html += '<div style="display:flex;flex-direction:column;gap:6px">';
        teams.forEach(function (t) {
            html += '<label style="display:flex;align-items:center;gap:10px;padding:8px;background:rgba(255,255,255,.02);border-radius:var(--radius-sm);cursor:pointer">';
            html += '<input type="checkbox" class="team-checkbox" value="' + t.id + '">';
            html += '<div class="team-logo team-logo-sm" style="background:' + (t.logoColor || '#2979ff') + ';width:28px;height:28px;font-size:.55rem">' + (t.shortName || '??') + '</div>';
            html += '<span style="font-weight:600">' + t.name + '</span>';
            html += '<span style="font-size:.75rem;color:var(--text-muted)">(' + (t.players || []).length + ' players)</span>';
            html += '</label>';
        });
        html += '</div></div>';

        Modal.open({
            title: 'Create Tournament',
            content: html,
            confirmText: 'Create & Generate Fixtures',
            confirmClass: 'btn-primary',
            size: 'large',
            onConfirm: function () {
                var name = document.getElementById('tournamentName').value.trim();
                var format = document.getElementById('tournamentFormat').value;
                var overs = parseInt(document.getElementById('tournamentOvers').value) || 20;

                if (!name) { Toast.show({ message: 'Tournament name is required', type: 'error' }); return; }

                var selectedTeams = [];
                document.querySelectorAll('.team-checkbox:checked').forEach(function (cb) {
                    selectedTeams.push(cb.value);
                });

                if (selectedTeams.length < 2) { Toast.show({ message: 'Select at least 2 teams', type: 'error' }); return; }

                // Create tournament
                var tournament = Store.saveTournament({
                    name: name,
                    format: format,
                    oversPerInnings: overs,
                    teamIds: selectedTeams,
                    matchIds: [],
                    status: 'upcoming'
                });

                // Generate round-robin fixtures
                generateFixturesForTournament(tournament);

                Toast.show({ message: 'Tournament "' + name + '" created!', type: 'success' });
                Modal.close();
                Router.navigate('#/tournaments/' + tournament.id);
            }
        });
    }

    function onFormatChange() {
        var format = document.getElementById('tournamentFormat').value;
        var oversInput = document.getElementById('tournamentOvers');
        if (format === 'T20') oversInput.value = 20;
        else if (format === 'T10') oversInput.value = 10;
        else if (format === 'ODI') oversInput.value = 50;
    }

    function generateFixturesForTournament(tournament) {
        var teamIds = tournament.teamIds || [];
        var matchIds = [];

        // Round-robin: each team plays every other team once
        for (var i = 0; i < teamIds.length; i++) {
            for (var j = i + 1; j < teamIds.length; j++) {
                var match = Store.createNewMatch(
                    teamIds[i], teamIds[j],
                    tournament.format,
                    tournament.oversPerInnings,
                    tournament.id
                );
                if (match) matchIds.push(match.id);
            }
        }

        tournament.matchIds = matchIds;
        tournament.status = 'ongoing';
        Store.saveTournament(tournament);
    }

    function generateFixtures(id) {
        var tournament = Store.getTournament(id);
        if (!tournament) return;
        generateFixturesForTournament(tournament);
        Toast.show({ message: 'Fixtures generated!', type: 'success' });
        renderDetail({ id: id });
    }

    function confirmDeleteTournament(id) {
        var tournament = Store.getTournament(id);
        if (!tournament) return;

        Modal.open({
            title: 'Delete Tournament',
            content: '<p style="color:var(--text-secondary)">Delete <strong>' + tournament.name + '</strong> and all its matches? This cannot be undone.</p>',
            confirmText: 'Delete',
            confirmClass: 'btn-danger',
            size: 'small',
            onConfirm: function () {
                // Delete all tournament matches
                (tournament.matchIds || []).forEach(function (mid) {
                    Store.deleteMatch(mid);
                });
                Store.deleteTournament(id);
                Toast.show({ message: 'Tournament deleted', type: 'info' });
                Modal.close();
                Router.navigate('#/tournaments');
            }
        });
    }

    return {
        render: render,
        renderDetail: renderDetail,
        openCreateModal: openCreateModal,
        onFormatChange: onFormatChange,
        generateFixtures: generateFixtures,
        confirmDeleteTournament: confirmDeleteTournament
    };
})();
