/* ============ TOAST NOTIFICATIONS ============ */
var Toast = (function () {
    var container = null;

    function getContainer() {
        if (!container) container = document.getElementById('toastContainer');
        return container;
    }

    function show(options) {
        var message = options.message || '';
        var type = options.type || 'info'; // info, wicket, boundary, six, success, error
        var duration = options.duration || 3000;

        var icons = {
            info: '&#8505;&#65039;',
            wicket: '&#128308;',
            boundary: '&#127944;',
            six: '&#127775;',
            success: '&#9989;',
            error: '&#10060;'
        };

        var colors = {
            info: 'var(--accent-blue)',
            wicket: 'var(--accent-red)',
            boundary: 'var(--accent-green)',
            six: 'var(--accent-yellow)',
            success: 'var(--accent-green)',
            error: 'var(--accent-red)'
        };

        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.style.borderLeftColor = colors[type];
        toast.innerHTML = '<span class="toast-icon">' + (icons[type] || '') + '</span>' +
            '<span class="toast-message">' + message + '</span>';

        getContainer().appendChild(toast);

        setTimeout(function () {
            toast.classList.add('toast-exit');
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, duration);
    }

    return { show: show };
})();

// Toast styles
(function () {
    var style = document.createElement('style');
    style.textContent = '' +
        '.toast-container{position:fixed;top:80px;right:20px;z-index:1100;display:flex;flex-direction:column;gap:8px;pointer-events:none}' +
        '.toast{display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--bg-card);' +
        'border:1px solid var(--border-color);border-left:3px solid var(--accent-blue);border-radius:var(--radius-md);' +
        'box-shadow:var(--shadow-md);animation:toastIn .3s ease;pointer-events:auto;min-width:250px}' +
        '.toast-exit{animation:toastOut .3s ease forwards}' +
        '.toast-icon{font-size:1.1rem}' +
        '.toast-message{font-size:0.85rem;color:var(--text-primary);font-weight:500}';
    document.head.appendChild(style);
})();
