/* ============ CRICKET API + MOCK DATA ============ */
var CricketAPI = (function () {
    var BASE_URL = 'https://api.cricapi.com/v1';
    var cache = {};
    var pollingIntervals = {};

    function getApiKey() {
        return Store.getSettings().apiKey || '';
    }

    function fetchWithCache(endpoint, params, ttl) {
        var key = endpoint + JSON.stringify(params || {});
        var cached = cache[key];
        if (cached && Date.now() - cached.time < (ttl || 30000)) {
            return Promise.resolve(cached.data);
        }

        var apiKey = getApiKey();
        if (!apiKey) {
            return Promise.resolve(null);
        }

        var url = BASE_URL + endpoint + '?apikey=' + encodeURIComponent(apiKey);
        if (params) {
            Object.keys(params).forEach(function (k) {
                url += '&' + k + '=' + encodeURIComponent(params[k]);
            });
        }

        return fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.status === 'success') {
                    cache[key] = { data: data.data, time: Date.now() };
                    return data.data;
                }
                return null;
            })
            .catch(function () {
                return null;
            });
    }

    function getCurrentMatches() {
        var apiKey = getApiKey();
        if (!apiKey) return Promise.resolve(getMockMatches());

        return fetchWithCache('/currentMatches', {}, 60000).then(function (data) {
            if (!data || data.length === 0) return getMockMatches();
            return data.map(transformApiMatch);
        });
    }

    function getMatchInfo(matchId) {
        return fetchWithCache('/match_info', { id: matchId }, 30000).then(function (data) {
            if (!data) return null;
            return transformApiMatch(data);
        });
    }

    function transformApiMatch(raw) {
        if (!raw) return null;
        var teams = (raw.teams || []);
        var score = raw.score || [];

        return {
            id: raw.id,
            type: 'api',
            name: raw.name || '',
            status: raw.status || '',
            matchType: raw.matchType || 'T20',
            venue: raw.venue || '',
            date: raw.date || '',
            dateTimeGMT: raw.dateTimeGMT || '',
            matchStarted: raw.matchStarted,
            matchEnded: raw.matchEnded,
            teams: teams,
            score: score.map(function (s) {
                return {
                    team: s.inning ? s.inning.replace(/ Inning.*/, '') : '',
                    runs: s.r || 0,
                    wickets: s.w || 0,
                    overs: s.o || 0
                };
            })
        };
    }

    function startPolling(id, callback, interval) {
        stopPolling(id);
        var fn = function () {
            getMatchInfo(id).then(callback);
        };
        fn();
        pollingIntervals[id] = setInterval(fn, interval || 30000);
    }

    function stopPolling(id) {
        if (pollingIntervals[id]) {
            clearInterval(pollingIntervals[id]);
            delete pollingIntervals[id];
        }
    }

    function stopAllPolling() {
        Object.keys(pollingIntervals).forEach(stopPolling);
    }

    // ---- MOCK DATA (for demo without API key) ----
    function getMockMatches() {
        return [
            {
                id: 'mock_1',
                type: 'mock',
                name: 'India vs Australia, 3rd T20I',
                status: 'India needs 32 runs in 10 balls',
                matchType: 'T20',
                venue: 'Wankhede Stadium, Mumbai',
                date: '2026-06-04',
                matchStarted: true,
                matchEnded: false,
                teams: ['India', 'Australia'],
                score: [
                    { team: 'Australia', runs: 217, wickets: 8, overs: 20 },
                    { team: 'India', runs: 185, wickets: 4, overs: 18.2 }
                ],
                mockDetail: {
                    batsmen: [
                        { name: 'V Kohli', runs: 72, balls: 41, fours: 6, sixes: 4, isStriker: true },
                        { name: 'H Pandya', runs: 28, balls: 14, fours: 2, sixes: 2, isStriker: false }
                    ],
                    bowlers: [
                        { name: 'M Starc', overs: 3.2, maidens: 0, runs: 42, wickets: 1, economy: 12.6 }
                    ],
                    recentOvers: [
                        { over: 18, balls: ['1', '0', '4', '6', 'W', '2'] },
                        { over: 17, balls: ['4', '1', '2', '0', '6', '1'] }
                    ],
                    commentary: [
                        { over: '18.2', text: 'Starc to Kohli, 2 runs, pushed through covers', runs: 2, type: 'normal' },
                        { over: '18.1', text: 'Starc to Pandya, OUT! Caught at deep midwicket', runs: 0, type: 'wicket' },
                        { over: '17.6', text: 'Cummins to Kohli, SIX! Smashed over long-on!', runs: 6, type: 'six' },
                        { over: '17.5', text: 'Cummins to Kohli, FOUR! Driven through covers', runs: 4, type: 'boundary' },
                        { over: '17.4', text: 'Cummins to Kohli, no run, dot ball', runs: 0, type: 'normal' },
                        { over: '17.3', text: 'Cummins to Pandya, 1 run, flicked to leg', runs: 1, type: 'normal' },
                        { over: '17.2', text: 'Cummins to Kohli, 2 runs, pulled to deep square', runs: 2, type: 'normal' },
                        { over: '17.1', text: 'Cummins to Kohli, FOUR! Cut past point', runs: 4, type: 'boundary' }
                    ]
                }
            },
            {
                id: 'mock_2',
                type: 'mock',
                name: 'England vs South Africa, 2nd ODI',
                status: 'South Africa won by 5 wickets',
                matchType: 'ODI',
                venue: 'Lords, London',
                date: '2026-06-04',
                matchStarted: true,
                matchEnded: true,
                teams: ['England', 'South Africa'],
                score: [
                    { team: 'England', runs: 287, wickets: 10, overs: 48.3 },
                    { team: 'South Africa', runs: 291, wickets: 5, overs: 46.2 }
                ],
                mockDetail: {
                    batsmen: [
                        { name: 'Q de Kock', runs: 104, balls: 98, fours: 12, sixes: 3, isStriker: false },
                        { name: 'D Miller', runs: 67, balls: 52, fours: 5, sixes: 4, isStriker: true }
                    ],
                    bowlers: [
                        { name: 'J Archer', overs: 9.2, maidens: 1, runs: 62, wickets: 2, economy: 6.64 }
                    ],
                    recentOvers: [
                        { over: 46, balls: ['1', '4', '0', '2'] }
                    ],
                    commentary: [
                        { over: '46.2', text: 'Archer to Miller, FOUR! Winning runs!', runs: 4, type: 'boundary' },
                        { over: '46.1', text: 'Archer to de Kock, 1 run', runs: 1, type: 'normal' }
                    ]
                }
            },
            {
                id: 'mock_3',
                type: 'mock',
                name: 'Pakistan vs New Zealand, 1st Test Day 2',
                status: 'Pakistan trail by 128 runs',
                matchType: 'Test',
                venue: 'Rawalpindi Cricket Stadium',
                date: '2026-06-03',
                matchStarted: true,
                matchEnded: false,
                teams: ['Pakistan', 'New Zealand'],
                score: [
                    { team: 'New Zealand', runs: 342, wickets: 10, overs: 95.4 },
                    { team: 'Pakistan', runs: 214, wickets: 6, overs: 62 }
                ],
                mockDetail: {
                    batsmen: [
                        { name: 'B Azam', runs: 89, balls: 142, fours: 10, sixes: 1, isStriker: true },
                        { name: 'M Rizwan', runs: 34, balls: 67, fours: 3, sixes: 0, isStriker: false }
                    ],
                    bowlers: [
                        { name: 'T Southee', overs: 18, maidens: 4, runs: 52, wickets: 3, economy: 2.89 }
                    ],
                    recentOvers: [
                        { over: 62, balls: ['0', '0', '1', '0', '4', '0'] }
                    ],
                    commentary: [
                        { over: '62.6', text: 'Southee to Rizwan, no run, defended', runs: 0, type: 'normal' },
                        { over: '62.5', text: 'Southee to Azam, FOUR! Exquisite cover drive', runs: 4, type: 'boundary' }
                    ]
                }
            }
        ];
    }

    function getMockMatchDetail(id) {
        var matches = getMockMatches();
        return matches.find(function (m) { return m.id === id; }) || null;
    }

    return {
        getCurrentMatches: getCurrentMatches,
        getMatchInfo: getMatchInfo,
        startPolling: startPolling,
        stopPolling: stopPolling,
        stopAllPolling: stopAllPolling,
        getMockMatches: getMockMatches,
        getMockMatchDetail: getMockMatchDetail,
        getApiKey: getApiKey
    };
})();
