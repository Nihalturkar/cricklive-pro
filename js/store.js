/* ============ LOCALSTORAGE DATA LAYER ============ */
var Store = (function () {
    var PREFIX = 'cricklive_';

    function _get(key) {
        try {
            var data = localStorage.getItem(PREFIX + key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Store get error:', key, e);
            return null;
        }
    }

    function _set(key, value) {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value));
        } catch (e) {
            console.error('Store set error:', key, e);
        }
    }

    function _remove(key) {
        localStorage.removeItem(PREFIX + key);
    }

    function _uuid() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // ---- Teams ----
    function getTeams() {
        return _get('teams') || [];
    }

    function getTeam(id) {
        return getTeams().find(function (t) { return t.id === id; });
    }

    function saveTeam(team) {
        var teams = getTeams();
        if (!team.id) {
            team.id = _uuid();
            team.createdAt = new Date().toISOString();
            teams.push(team);
        } else {
            var idx = teams.findIndex(function (t) { return t.id === team.id; });
            if (idx >= 0) teams[idx] = team;
            else teams.push(team);
        }
        _set('teams', teams);
        return team;
    }

    function deleteTeam(id) {
        var teams = getTeams().filter(function (t) { return t.id !== id; });
        _set('teams', teams);
    }

    // ---- Tournaments ----
    function getTournaments() {
        return _get('tournaments') || [];
    }

    function getTournament(id) {
        return getTournaments().find(function (t) { return t.id === id; });
    }

    function saveTournament(tournament) {
        var tournaments = getTournaments();
        if (!tournament.id) {
            tournament.id = _uuid();
            tournament.createdAt = new Date().toISOString();
            tournaments.push(tournament);
        } else {
            var idx = tournaments.findIndex(function (t) { return t.id === tournament.id; });
            if (idx >= 0) tournaments[idx] = tournament;
            else tournaments.push(tournament);
        }
        _set('tournaments', tournaments);
        return tournament;
    }

    function deleteTournament(id) {
        var tournaments = getTournaments().filter(function (t) { return t.id !== id; });
        _set('tournaments', tournaments);
    }

    // ---- Matches ----
    function getMatches() {
        return _get('matches') || [];
    }

    function getMatch(id) {
        return getMatches().find(function (m) { return m.id === id; });
    }

    function saveMatch(match) {
        var matches = getMatches();
        if (!match.id) {
            match.id = _uuid();
            match.createdAt = new Date().toISOString();
            matches.push(match);
        } else {
            var idx = matches.findIndex(function (m) { return m.id === match.id; });
            if (idx >= 0) matches[idx] = match;
            else matches.push(match);
        }
        _set('matches', matches);
        return match;
    }

    function deleteMatch(id) {
        var matches = getMatches().filter(function (m) { return m.id !== id; });
        _set('matches', matches);
        _remove('match_balls_' + id);
    }

    function getLiveLocalMatches() {
        return getMatches().filter(function (m) { return m.status === 'live'; });
    }

    function getRecentMatches(limit) {
        return getMatches()
            .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
            .slice(0, limit || 10);
    }

    // ---- Settings ----
    function getSettings() {
        return _get('settings') || { apiKey: '' };
    }

    function saveSettings(settings) {
        _set('settings', settings);
    }

    // ---- Create New Match Helper ----
    function createNewMatch(team1Id, team2Id, format, oversPerInnings, tournamentId) {
        var team1 = getTeam(team1Id);
        var team2 = getTeam(team2Id);
        if (!team1 || !team2) return null;

        var match = {
            team1Id: team1Id,
            team2Id: team2Id,
            team1Name: team1.name,
            team2Name: team2.name,
            team1Short: team1.shortName,
            team2Short: team2.shortName,
            team1Color: team1.logoColor || '#2979ff',
            team2Color: team2.logoColor || '#ff9100',
            team1Players: team1.players || [],
            team2Players: team2.players || [],
            format: format || 'T20',
            oversPerInnings: oversPerInnings || 20,
            tournamentId: tournamentId || null,
            tossWonBy: null,
            tossDecision: null,
            innings: [
                createEmptyInnings(team1Id, team2Id),
                createEmptyInnings(team2Id, team1Id)
            ],
            currentInnings: 0,
            status: 'not_started',
            result: '',
            manOfMatch: null
        };

        return saveMatch(match);
    }

    function createEmptyInnings(battingTeamId, bowlingTeamId) {
        return {
            battingTeamId: battingTeamId,
            bowlingTeamId: bowlingTeamId,
            score: 0,
            wickets: 0,
            overs: 0,
            balls: 0,
            extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
            batsmen: {},
            bowlers: {},
            currentStriker: null,
            currentNonStriker: null,
            currentBowler: null,
            ballLog: [],
            fallOfWickets: [],
            partnerships: []
        };
    }

    return {
        getTeams: getTeams,
        getTeam: getTeam,
        saveTeam: saveTeam,
        deleteTeam: deleteTeam,
        getTournaments: getTournaments,
        getTournament: getTournament,
        saveTournament: saveTournament,
        deleteTournament: deleteTournament,
        getMatches: getMatches,
        getMatch: getMatch,
        saveMatch: saveMatch,
        deleteMatch: deleteMatch,
        getLiveLocalMatches: getLiveLocalMatches,
        getRecentMatches: getRecentMatches,
        getSettings: getSettings,
        saveSettings: saveSettings,
        createNewMatch: createNewMatch,
        createEmptyInnings: createEmptyInnings
    };
})();
