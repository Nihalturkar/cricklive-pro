/* ============ BOWLER PANEL COMPONENT ============ */
var BowlerPanel = (function () {

    function render(bowlers) {
        if (!bowlers || bowlers.length === 0) return '';

        var html = '<div class="bowler-panel">';
        html += '<div class="panel-title">&#127936; Bowling</div>';

        // Header row
        html += '<div class="bowler-row" style="border-bottom:1px solid var(--border-color)">';
        html += '<div class="stat-header" style="text-align:left">Bowler</div>';
        html += '<div class="stat-header">O</div>';
        html += '<div class="stat-header">M</div>';
        html += '<div class="stat-header">R</div>';
        html += '<div class="stat-header">W</div>';
        html += '<div class="stat-header">Econ</div>';
        html += '</div>';

        bowlers.forEach(function (b) {
            var econ = b.overs > 0 ? (b.runs / parseFloat(b.overs)).toFixed(2) : '0.00';

            html += '<div class="bowler-row">';
            html += '<div class="player-name">' + b.name + '</div>';
            html += '<div class="stat-value">' + b.overs + '</div>';
            html += '<div class="stat-value">' + (b.maidens || 0) + '</div>';
            html += '<div class="stat-value">' + b.runs + '</div>';
            html += '<div class="stat-value highlight">' + b.wickets + '</div>';
            html += '<div class="stat-value">' + econ + '</div>';
            html += '</div>';
        });

        html += '</div>';
        return html;
    }

    return { render: render };
})();
