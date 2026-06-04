/* ============ OVER TIMELINE COMPONENT ============ */
var OverTimeline = (function () {

    function getBallClass(ball) {
        var b = String(ball).toLowerCase();
        if (b === 'w' || b === 'W') return 'wicket';
        if (b === 'wd' || b === 'wide') return 'wide';
        if (b === 'nb' || b === 'noball') return 'noball';
        var num = parseInt(b);
        if (num === 0) return 'dot-ball';
        if (num === 4) return 'run-4';
        if (num === 6) return 'run-6';
        if (num >= 1 && num <= 3) return 'run-' + Math.min(num, 3);
        return 'dot-ball';
    }

    function getBallText(ball) {
        var b = String(ball).toLowerCase();
        if (b === 'w') return 'W';
        if (b === 'wd' || b === 'wide') return 'WD';
        if (b === 'nb' || b === 'noball') return 'NB';
        return String(ball);
    }

    function render(overs) {
        if (!overs || overs.length === 0) return '';

        var html = '<div class="over-timeline">';
        html += '<div class="panel-title">&#127944; This Over</div>';

        overs.forEach(function (overData) {
            var overNum = overData.over;
            var balls = overData.balls || [];
            var overRuns = 0;

            html += '<div class="over-row">';
            html += '<span class="over-label">Over ' + overNum + '</span>';
            html += '<div class="over-dots">';

            balls.forEach(function (ball) {
                var ballClass = getBallClass(ball);
                var ballText = getBallText(ball);
                var num = parseInt(ball);
                if (!isNaN(num)) overRuns += num;

                html += '<div class="ball-dot ' + ballClass + '">' + ballText + '</div>';
            });

            html += '</div>';
            html += '<span class="over-runs">' + overRuns + ' runs</span>';
            html += '</div>';
        });

        html += '</div>';
        return html;
    }

    function renderFromBallLog(ballLog, currentOver) {
        if (!ballLog || ballLog.length === 0) return '';

        // Group balls by over
        var overMap = {};
        ballLog.forEach(function (b) {
            var ov = b.over;
            if (!overMap[ov]) overMap[ov] = [];
            var text = b.wicket ? 'W' : b.extras ? (b.extras.type === 'wide' ? 'WD' : 'NB') : String(b.runs);
            overMap[ov].push(text);
        });

        var overNums = Object.keys(overMap).map(Number).sort(function(a,b){return b-a;}).slice(0, 3);

        var overs = overNums.map(function (num) {
            return { over: num + 1, balls: overMap[num] };
        });

        return render(overs);
    }

    return {
        render: render,
        renderFromBallLog: renderFromBallLog,
        getBallClass: getBallClass
    };
})();
