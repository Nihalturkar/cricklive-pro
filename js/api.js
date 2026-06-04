/* ============ CRICKET API - REAL DATA ONLY ============ */
var CricketAPI = (function () {
    var BASE_URL = 'https://api.cricapi.com/v1';
    var cache = {};
    var pollingIntervals = {};
    var requestCount = 0;
    var requestCountDate = '';

    function getApiKey() {
        return Store.getSettings().apiKey || '';
    }

    // Track daily API usage (100/day free limit)
    function trackRequest() {
        var today = new Date().toISOString().split('T')[0];
        if (requestCountDate !== today) {
            requestCount = 0;
            requestCountDate = today;
        }
        requestCount++;
        try {
            localStorage.setItem('cricklive_api_usage', JSON.stringify({ count: requestCount, date: today }));
        } catch (e) {}
    }

    function getUsage() {
        try {
            var data = JSON.parse(localStorage.getItem('cricklive_api_usage') || '{}');
            var today = new Date().toISOString().split('T')[0];
            if (data.date === today) {
                requestCount = data.count || 0;
                requestCountDate = today;
            }
        } catch (e) {}
        return { used: requestCount, limit: 100, remaining: Math.max(0, 100 - requestCount) };
    }

    function fetchAPI(endpoint, params, ttl) {
        var cacheKey = endpoint + JSON.stringify(params || {});
        var cached = cache[cacheKey];
        if (cached && Date.now() - cached.time < (ttl || 30000)) {
            return Promise.resolve(cached.data);
        }

        var apiKey = getApiKey();
        if (!apiKey) {
            return Promise.resolve(null);
        }

        // Check daily limit
        var usage = getUsage();
        if (usage.remaining <= 0) {
            console.warn('CricAPI: Daily limit reached (100/day)');
            return Promise.resolve(null);
        }

        var url = BASE_URL + endpoint + '?apikey=' + encodeURIComponent(apiKey);
        if (params) {
            Object.keys(params).forEach(function (k) {
                url += '&' + k + '=' + encodeURIComponent(params[k]);
            });
        }

        trackRequest();

        return fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.status === 'success' && data.data) {
                    cache[cacheKey] = { data: data.data, time: Date.now() };
                    return data.data;
                }
                // Handle errors
                if (data.reason) {
                    console.warn('CricAPI Error:', data.reason);
                }
                return null;
            })
            .catch(function (err) {
                console.error('CricAPI Fetch Error:', err);
                return null;
            });
    }

    // =====================================================
    //  ENDPOINTS
    // =====================================================

    // Get all current/recent matches
    function getCurrentMatches() {
        if (!getApiKey()) return Promise.resolve([]);

        return fetchAPI('/currentMatches', { offset: 0 }, 120000).then(function (data) {
            if (!data || !Array.isArray(data)) return [];
            return data
                .filter(function (m) { return m && m.id; })
                .map(transformMatch);
        });
    }

    // Get list of all matches (upcoming + recent)
    function getMatches() {
        if (!getApiKey()) return Promise.resolve([]);

        return fetchAPI('/matches', { offset: 0 }, 120000).then(function (data) {
            if (!data || !Array.isArray(data)) return [];
            return data
                .filter(function (m) { return m && m.id; })
                .map(transformMatch);
        });
    }

    // Get specific match info
    function getMatchInfo(matchId) {
        if (!getApiKey()) return Promise.resolve(null);

        return fetchAPI('/match_info', { id: matchId }, 30000).then(function (data) {
            if (!data) return null;
            return transformMatch(data);
        });
    }

    // Get match scorecard (detailed batting/bowling)
    function getMatchScorecard(matchId) {
        if (!getApiKey()) return Promise.resolve(null);

        return fetchAPI('/match_scorecard', { id: matchId }, 30000).then(function (data) {
            if (!data) return null;
            return transformScorecard(data);
        });
    }

    // Get current series list
    function getSeriesList() {
        if (!getApiKey()) return Promise.resolve([]);

        return fetchAPI('/series', { offset: 0 }, 300000).then(function (data) {
            if (!data || !Array.isArray(data)) return [];
            return data;
        });
    }

    // =====================================================
    //  DATA TRANSFORMERS
    // =====================================================

    /*
     * CricAPI v1 match object fields:
     * id, name, matchType (t20/odi/test), status,
     * venue, date, dateTimeGMT,
     * teams: ["India", "Australia"],
     * teamInfo: [{name, shortname, img}],
     * score: [{r, w, o, inning: "India Inning 1"}],
     * matchStarted (bool), matchEnded (bool),
     * fantasyEnabled, bbbEnabled, hasSquad,
     * series_id, ...
     */

    function transformMatch(raw) {
        if (!raw) return null;

        var teams = raw.teams || [];
        var teamInfo = raw.teamInfo || [];
        var scores = raw.score || [];

        // Extract team images from teamInfo
        var teamImages = {};
        var teamShortNames = {};
        teamInfo.forEach(function (ti) {
            if (ti && ti.name) {
                teamImages[ti.name] = ti.img || '';
                teamShortNames[ti.name] = ti.shortname || ti.name.substring(0, 3).toUpperCase();
            }
        });

        // Parse scores
        var parsedScores = scores.map(function (s) {
            var inningStr = s.inning || '';
            // "India Inning 1" -> "India"
            var teamName = inningStr.replace(/\s+Inning.*$/i, '').trim();
            return {
                team: teamName,
                inning: inningStr,
                runs: s.r || 0,
                wickets: s.w || 0,
                overs: s.o || 0
            };
        });

        // Determine match format badge
        var matchType = (raw.matchType || '').toLowerCase();
        var formatBadge = 'T20';
        if (matchType === 'odi') formatBadge = 'ODI';
        else if (matchType === 'test') formatBadge = 'TEST';
        else if (matchType === 't20') formatBadge = 'T20';
        else formatBadge = matchType.toUpperCase() || 'T20';

        return {
            id: raw.id,
            type: 'api',
            name: raw.name || '',
            status: raw.status || '',
            matchType: formatBadge,
            venue: raw.venue || '',
            date: raw.date || '',
            dateTimeGMT: raw.dateTimeGMT || '',
            matchStarted: raw.matchStarted === true,
            matchEnded: raw.matchEnded === true,
            teams: teams,
            teamInfo: teamInfo,
            teamImages: teamImages,
            teamShortNames: teamShortNames,
            score: parsedScores,
            seriesId: raw.series_id || '',
            bbbEnabled: raw.bbbEnabled || false,
            hasSquad: raw.hasSquad || false
        };
    }

    function transformScorecard(raw) {
        if (!raw) return null;

        var base = transformMatch(raw);
        if (!base) return null;

        // Scorecard has additional detailed innings data
        // scorecard: [{batsman, bowler, ...}] per innings
        base.scorecard = raw.scorecard || [];
        return base;
    }

    // =====================================================
    //  POLLING (for live match auto-update)
    // =====================================================

    function startPolling(matchId, callback, interval) {
        stopPolling(matchId);

        // Use smart interval: 60s for live to save API quota
        var pollInterval = interval || 60000;

        var fn = function () {
            // Check if we still have API quota
            var usage = getUsage();
            if (usage.remaining <= 5) {
                console.warn('CricAPI: Low quota, stopping poll');
                stopPolling(matchId);
                return;
            }
            getMatchInfo(matchId).then(function (data) {
                if (data && callback) callback(data);
            });
        };

        fn(); // Immediate first call
        pollingIntervals[matchId] = setInterval(fn, pollInterval);
    }

    function stopPolling(matchId) {
        if (pollingIntervals[matchId]) {
            clearInterval(pollingIntervals[matchId]);
            delete pollingIntervals[matchId];
        }
    }

    function stopAllPolling() {
        Object.keys(pollingIntervals).forEach(stopPolling);
    }

    // =====================================================
    //  API KEY VALIDATION
    // =====================================================

    function validateApiKey(key) {
        var url = BASE_URL + '/matches?apikey=' + encodeURIComponent(key) + '&offset=0';
        return fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                return data.status === 'success';
            })
            .catch(function () {
                return false;
            });
    }

    // =====================================================
    //  PUBLIC API
    // =====================================================

    return {
        getApiKey: getApiKey,
        getCurrentMatches: getCurrentMatches,
        getMatches: getMatches,
        getMatchInfo: getMatchInfo,
        getMatchScorecard: getMatchScorecard,
        getSeriesList: getSeriesList,
        startPolling: startPolling,
        stopPolling: stopPolling,
        stopAllPolling: stopAllPolling,
        validateApiKey: validateApiKey,
        getUsage: getUsage
    };
})();
