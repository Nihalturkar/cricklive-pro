/* ============ APP ENTRY POINT ============ */
(function () {
    // Register routes
    Router.addRoute('/', function () { DashboardView.render(); });
    Router.addRoute('/dashboard', function () { DashboardView.render(); });
    Router.addRoute('/match/:id', function (params) { MatchCenterView.renderApiMatch(params); });
    Router.addRoute('/local-match/:id', function (params) { MatchCenterView.renderLocalMatch(params); });
    Router.addRoute('/tournaments', function () { TournamentsView.render(); });
    Router.addRoute('/tournaments/:id', function (params) { TournamentsView.renderDetail(params); });
    Router.addRoute('/teams', function () { TeamManagerView.render(); });
    Router.addRoute('/scorer/:matchId', function (params) { LocalScorerView.render(params); });
    Router.addRoute('/viewer/:id', function (params) { return ViewerView.render(params); });

    // Mobile menu toggle
    var menuBtn = document.getElementById('menuToggle');
    var navLinks = document.getElementById('navLinks');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', function () {
            navLinks.classList.toggle('open');
        });
    }

    // Initialize router
    Router.init();

    // Start ticker
    ScoreTicker.start();
})();
