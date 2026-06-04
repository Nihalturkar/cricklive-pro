/* ============ COMMENTARY FEED COMPONENT ============ */
var Commentary = (function () {

    function getTypeClass(type) {
        switch (type) {
            case 'boundary': case 'four': return 'boundary';
            case 'six': return 'six';
            case 'wicket': return 'wicket-fall';
            default: return '';
        }
    }

    function getRunsBadge(runs, type) {
        if (type === 'wicket') return '<span class="commentary-runs-badge" style="background:rgba(255,23,68,0.2);color:var(--accent-red)">W</span>';
        if (type === 'six') return '<span class="commentary-runs-badge" style="background:rgba(255,214,0,0.2);color:var(--accent-yellow)">6</span>';
        if (type === 'boundary' || type === 'four') return '<span class="commentary-runs-badge" style="background:rgba(0,230,118,0.2);color:var(--accent-green)">4</span>';
        if (runs === 0) return '<span class="commentary-runs-badge" style="background:rgba(255,255,255,0.05);color:var(--text-muted)">0</span>';
        return '<span class="commentary-runs-badge" style="background:rgba(79,172,254,0.15);color:var(--accent-blue)">' + runs + '</span>';
    }

    function render(items) {
        if (!items || items.length === 0) {
            return '<div class="commentary-feed"><div class="empty-state"><div class="empty-state-icon">&#128172;</div>' +
                '<div class="empty-state-title">No Commentary Yet</div></div></div>';
        }

        var html = '<div class="commentary-feed">';

        items.forEach(function (item) {
            var typeClass = getTypeClass(item.type);
            html += '<div class="commentary-item ' + typeClass + '">';
            html += '<div class="commentary-over">' + item.over + '</div>';
            html += '<div class="commentary-content">' + item.text + '</div>';
            html += getRunsBadge(item.runs, item.type);
            html += '</div>';
        });

        html += '</div>';
        return html;
    }

    return { render: render };
})();
