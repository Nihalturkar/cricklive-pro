/* ============ HASH ROUTER ============ */
var Router = (function () {
    var routes = {};
    var currentCleanup = null;

    function addRoute(pattern, handler) {
        routes[pattern] = handler;
    }

    function navigate(hash) {
        window.location.hash = hash;
    }

    function matchRoute(hash) {
        var path = hash.replace(/^#/, '') || '/';

        // Exact match first
        if (routes[path]) {
            return { handler: routes[path], params: {} };
        }

        // Pattern match with params
        var routeKeys = Object.keys(routes);
        for (var i = 0; i < routeKeys.length; i++) {
            var pattern = routeKeys[i];
            var regex = pattern.replace(/:([^/]+)/g, '([^/]+)');
            var match = path.match(new RegExp('^' + regex + '$'));

            if (match) {
                var paramNames = [];
                var paramMatch;
                var paramRegex = /:([^/]+)/g;
                while ((paramMatch = paramRegex.exec(pattern)) !== null) {
                    paramNames.push(paramMatch[1]);
                }

                var params = {};
                paramNames.forEach(function (name, idx) {
                    params[name] = match[idx + 1];
                });

                return { handler: routes[pattern], params: params };
            }
        }

        return null;
    }

    function handleRoute() {
        // Cleanup previous view
        if (currentCleanup && typeof currentCleanup === 'function') {
            currentCleanup();
            currentCleanup = null;
        }

        CricketAPI.stopAllPolling();

        var hash = window.location.hash || '#/';
        var result = matchRoute(hash);

        // Update active nav
        var navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(function (link) {
            var route = link.getAttribute('data-route');
            var isActive = hash === '#' + route || (route !== '/' && hash.startsWith('#' + route));
            link.classList.toggle('active', isActive);
        });

        // Close mobile nav
        var nav = document.getElementById('navLinks');
        if (nav) nav.classList.remove('open');

        if (result) {
            var cleanup = result.handler(result.params);
            if (typeof cleanup === 'function') {
                currentCleanup = cleanup;
            }
        } else {
            // 404
            var app = document.getElementById('app');
            app.innerHTML = '<div class="container"><div class="empty-state">' +
                '<div class="empty-state-icon">&#128556;</div>' +
                '<div class="empty-state-title">Page Not Found</div>' +
                '<div class="empty-state-desc">The page you\'re looking for doesn\'t exist.</div>' +
                '<br><a href="#/" class="btn btn-primary">Go Home</a></div></div>';
        }
    }

    function init() {
        window.addEventListener('hashchange', handleRoute);
        // Initial route
        if (!window.location.hash) {
            window.location.hash = '#/';
        }
        handleRoute();
    }

    return {
        addRoute: addRoute,
        navigate: navigate,
        init: init,
        handleRoute: handleRoute
    };
})();
