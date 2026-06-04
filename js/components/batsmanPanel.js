/* ============ BATSMAN PANEL COMPONENT ============ */
var BatsmanPanel = (function () {

    function render(batsmen) {
        if (!batsmen || batsmen.length === 0) return '';

        var html = '<div class="batsman-panel">';
        html += '<div class="panel-title">&#127951; Batting</div>';

        // Header row
        html += '<div class="batsman-row" style="border-bottom:1px solid var(--border-color)">';
        html += '<div class="stat-header" style="text-align:left">Batter</div>';
        html += '<div class="stat-header">R</div>';
        html += '<div class="stat-header">B</div>';
        html += '<div class="stat-header">4s</div>';
        html += '<div class="stat-header">6s</div>';
        html += '<div class="stat-header">SR</div>';
        html += '</div>';

        batsmen.forEach(function (b) {
            var sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
            var isStriker = b.isStriker;

            html += '<div class="batsman-row' + (isStriker ? ' striker-row' : '') + '">';
            html += '<div class="player-name">';
            if (isStriker) html += '<span class="striker-icon">&#127951;</span>';
            html += b.name + '</div>';
            html += '<div class="stat-value highlight">' + b.runs + '</div>';
            html += '<div class="stat-value">' + b.balls + '</div>';
            html += '<div class="stat-value">' + (b.fours || 0) + '</div>';
            html += '<div class="stat-value">' + (b.sixes || 0) + '</div>';
            html += '<div class="stat-value">' + sr + '</div>';
            html += '</div>';
        });

        html += '</div>';
        return html;
    }

    return { render: render };
})();
