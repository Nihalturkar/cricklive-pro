/* ============ MODAL COMPONENT ============ */
var Modal = (function () {
    var root = null;

    function getRoot() {
        if (!root) root = document.getElementById('modalRoot');
        return root;
    }

    function open(options) {
        var title = options.title || '';
        var content = options.content || '';
        var onConfirm = options.onConfirm;
        var confirmText = options.confirmText || 'Confirm';
        var confirmClass = options.confirmClass || 'btn-primary';
        var showCancel = options.showCancel !== false;
        var size = options.size || 'normal'; // normal, large, small

        var sizeClass = size === 'large' ? 'modal-large' : size === 'small' ? 'modal-small' : '';

        var html = '<div class="modal-backdrop" onclick="Modal.close()">' +
            '<div class="modal-content ' + sizeClass + '" onclick="event.stopPropagation()">' +
            '<div class="modal-header">' +
            '<h3 class="modal-title">' + title + '</h3>' +
            '<button class="modal-close" onclick="Modal.close()">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' + content + '</div>' +
            '<div class="modal-footer">';

        if (showCancel) {
            html += '<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>';
        }
        if (onConfirm) {
            html += '<button class="btn ' + confirmClass + '" id="modalConfirmBtn">' + confirmText + '</button>';
        }

        html += '</div></div></div>';

        getRoot().innerHTML = html;
        getRoot().style.display = 'block';

        if (onConfirm) {
            document.getElementById('modalConfirmBtn').addEventListener('click', function () {
                onConfirm();
            });
        }

        // Close on escape
        document.addEventListener('keydown', handleEscape);

        return getRoot();
    }

    function handleEscape(e) {
        if (e.key === 'Escape') close();
    }

    function close() {
        var r = getRoot();
        r.innerHTML = '';
        r.style.display = 'none';
        document.removeEventListener('keydown', handleEscape);
    }

    function getBody() {
        return getRoot().querySelector('.modal-body');
    }

    return {
        open: open,
        close: close,
        getBody: getBody
    };
})();

// Modal styles injected
(function () {
    var style = document.createElement('style');
    style.textContent = '' +
        '.modal-backdrop{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);' +
        'backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;' +
        'padding:20px;animation:modalFadeIn .2s ease}' +
        '.modal-content{background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-xl);' +
        'width:100%;max-width:500px;max-height:90vh;display:flex;flex-direction:column;animation:modalSlideUp .3s ease;' +
        'box-shadow:var(--shadow-lg)}' +
        '.modal-large{max-width:700px}' +
        '.modal-small{max-width:360px}' +
        '.modal-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 12px;' +
        'border-bottom:1px solid var(--border-color)}' +
        '.modal-title{font-size:1.1rem;font-weight:700}' +
        '.modal-close{background:none;border:none;color:var(--text-secondary);font-size:1.5rem;cursor:pointer;' +
        'padding:0 4px;line-height:1;transition:var(--transition-fast)}' +
        '.modal-close:hover{color:var(--text-primary)}' +
        '.modal-body{padding:20px 24px;overflow-y:auto;flex:1}' +
        '.modal-footer{display:flex;justify-content:flex-end;gap:10px;padding:12px 24px 20px;' +
        'border-top:1px solid var(--border-color)}';
    document.head.appendChild(style);
})();
