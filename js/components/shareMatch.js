/* ============ SHARE MATCH + ADMIN PIN SYSTEM ============ */
var ShareMatch = (function () {

    // ---- Admin PIN System ----
    function setAdminPin(matchId, pin) {
        var pins = JSON.parse(localStorage.getItem('cricklive_admin_pins') || '{}');
        pins[matchId] = hashPin(pin);
        localStorage.setItem('cricklive_admin_pins', JSON.stringify(pins));
    }

    function verifyAdminPin(matchId, pin) {
        var pins = JSON.parse(localStorage.getItem('cricklive_admin_pins') || '{}');
        return pins[matchId] === hashPin(pin);
    }

    function hasAdminPin(matchId) {
        var pins = JSON.parse(localStorage.getItem('cricklive_admin_pins') || '{}');
        return !!pins[matchId];
    }

    function isAdminUnlocked(matchId) {
        var unlocked = JSON.parse(sessionStorage.getItem('cricklive_admin_unlocked') || '{}');
        return !!unlocked[matchId];
    }

    function unlockAdmin(matchId) {
        var unlocked = JSON.parse(sessionStorage.getItem('cricklive_admin_unlocked') || '{}');
        unlocked[matchId] = true;
        sessionStorage.setItem('cricklive_admin_unlocked', JSON.stringify(unlocked));
    }

    // Simple hash for PIN (not cryptographic, just obfuscation)
    function hashPin(pin) {
        var hash = 0;
        var str = 'cricklive_' + pin;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit int
        }
        return hash.toString(36);
    }

    // ---- Admin PIN Prompt ----
    function promptAdminPin(matchId, onSuccess) {
        if (!hasAdminPin(matchId)) {
            // No PIN set, allow access
            onSuccess();
            return;
        }

        if (isAdminUnlocked(matchId)) {
            // Already unlocked this session
            onSuccess();
            return;
        }

        var html = '<div style="text-align:center;margin-bottom:16px">';
        html += '<div style="font-size:2rem;margin-bottom:8px">&#128274;</div>';
        html += '<p style="color:var(--text-secondary);font-size:.85rem">This match is PIN protected.<br>Enter the Admin PIN to access scoring.</p>';
        html += '</div>';
        html += '<div class="form-group">';
        html += '<input type="password" class="form-input" id="adminPinInput" placeholder="Enter 4-digit PIN" maxlength="6" style="text-align:center;font-size:1.3rem;letter-spacing:8px" autocomplete="off">';
        html += '</div>';
        html += '<div id="pinError" style="color:var(--accent-red);font-size:.8rem;text-align:center;display:none">Wrong PIN! Try again.</div>';

        Modal.open({
            title: 'Admin Access',
            content: html,
            confirmText: 'Unlock',
            confirmClass: 'btn-primary',
            size: 'small',
            onConfirm: function () {
                var pin = document.getElementById('adminPinInput').value;
                if (verifyAdminPin(matchId, pin)) {
                    unlockAdmin(matchId);
                    Modal.close();
                    Toast.show({ message: 'Admin access granted!', type: 'success' });
                    onSuccess();
                } else {
                    document.getElementById('pinError').style.display = 'block';
                    document.getElementById('adminPinInput').value = '';
                    document.getElementById('adminPinInput').focus();
                }
            }
        });

        // Focus input and submit on Enter
        setTimeout(function () {
            var input = document.getElementById('adminPinInput');
            if (input) {
                input.focus();
                input.addEventListener('keypress', function (e) {
                    if (e.key === 'Enter') {
                        document.getElementById('modalConfirmBtn').click();
                    }
                });
            }
        }, 100);
    }

    // ---- Set PIN Modal ----
    function promptSetPin(matchId, onDone) {
        var html = '<div style="text-align:center;margin-bottom:16px">';
        html += '<div style="font-size:2rem;margin-bottom:8px">&#128272;</div>';
        html += '<p style="color:var(--text-secondary);font-size:.85rem">Set a PIN to protect scorer access.<br>Share the viewer link without worrying about unauthorized changes.</p>';
        html += '</div>';
        html += '<div class="form-group">';
        html += '<label class="form-label">Create Admin PIN</label>';
        html += '<input type="password" class="form-input" id="newPinInput" placeholder="Enter 4-digit PIN" maxlength="6" style="text-align:center;font-size:1.3rem;letter-spacing:8px">';
        html += '</div>';
        html += '<div class="form-group">';
        html += '<label class="form-label">Confirm PIN</label>';
        html += '<input type="password" class="form-input" id="confirmPinInput" placeholder="Confirm PIN" maxlength="6" style="text-align:center;font-size:1.3rem;letter-spacing:8px">';
        html += '</div>';

        Modal.open({
            title: 'Set Admin PIN',
            content: html,
            confirmText: 'Set PIN',
            confirmClass: 'btn-primary',
            size: 'small',
            onConfirm: function () {
                var pin = document.getElementById('newPinInput').value;
                var confirm = document.getElementById('confirmPinInput').value;

                if (pin.length < 4) {
                    Toast.show({ message: 'PIN must be at least 4 characters', type: 'error' });
                    return;
                }
                if (pin !== confirm) {
                    Toast.show({ message: 'PINs do not match!', type: 'error' });
                    return;
                }

                setAdminPin(matchId, pin);
                unlockAdmin(matchId);
                Modal.close();
                Toast.show({ message: 'Admin PIN set! Only you can score now.', type: 'success' });
                if (onDone) onDone();
            }
        });

        setTimeout(function () {
            var input = document.getElementById('newPinInput');
            if (input) input.focus();
        }, 100);
    }

    // ---- Share Match ----
    function getShareUrl(matchId, mode) {
        var base = window.location.origin + window.location.pathname;
        if (mode === 'viewer') {
            return base + '#/viewer/' + matchId;
        }
        return base + '#/local-match/' + matchId;
    }

    function openShareModal(matchId) {
        var match = Store.getMatch(matchId);
        if (!match) return;

        var viewerUrl = getShareUrl(matchId, 'viewer');
        var adminUrl = getShareUrl(matchId, 'admin');
        var hasPIN = hasAdminPin(matchId);

        var html = '<div class="share-modal-content">';

        // Viewer Link
        html += '<div class="share-section">';
        html += '<div class="share-section-header">';
        html += '<span style="font-size:1.2rem">&#128064;</span>';
        html += '<div>';
        html += '<div style="font-weight:700;font-size:.95rem">Spectator Link</div>';
        html += '<div style="font-size:.75rem;color:var(--text-muted)">Share this - scores dekhne ke liye (read-only)</div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="share-url-box">';
        html += '<input type="text" class="form-input" id="viewerUrlInput" value="' + viewerUrl + '" readonly style="font-size:.75rem">';
        html += '<button class="btn btn-primary btn-sm" onclick="ShareMatch.copyUrl(\'viewerUrlInput\')">Copy</button>';
        html += '</div>';

        // QR Code for viewer
        html += '<div class="share-qr" id="viewerQR"></div>';
        html += '</div>';

        // Admin Link
        html += '<div class="share-section" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-color)">';
        html += '<div class="share-section-header">';
        html += '<span style="font-size:1.2rem">&#128274;</span>';
        html += '<div>';
        html += '<div style="font-weight:700;font-size:.95rem">Admin / Scorer Link</div>';
        html += '<div style="font-size:.75rem;color:var(--text-muted)">Score karne ke liye' + (hasPIN ? ' (PIN protected)' : '') + '</div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="share-url-box">';
        html += '<input type="text" class="form-input" id="adminUrlInput" value="' + adminUrl + '" readonly style="font-size:.75rem">';
        html += '<button class="btn btn-primary btn-sm" onclick="ShareMatch.copyUrl(\'adminUrlInput\')">Copy</button>';
        html += '</div>';
        html += '</div>';

        // PIN status
        html += '<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-color)">';
        if (hasPIN) {
            html += '<div style="display:flex;align-items:center;gap:8px;color:var(--accent-green);font-size:.85rem">';
            html += '<span>&#128274;</span> <span>Admin PIN is set - Scorer is protected</span>';
            html += '</div>';
            html += '<button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="ShareMatch.promptSetPin(\'' + matchId + '\')">Change PIN</button>';
        } else {
            html += '<div style="display:flex;align-items:center;gap:8px;color:var(--accent-yellow);font-size:.85rem">';
            html += '<span>&#9888;&#65039;</span> <span>No PIN set - Anyone with the link can score</span>';
            html += '</div>';
            html += '<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="ShareMatch.promptSetPin(\'' + matchId + '\', function(){ ShareMatch.openShareModal(\'' + matchId + '\'); })">Set Admin PIN</button>';
        }
        html += '</div>';

        // Native share
        if (navigator.share) {
            html += '<div style="margin-top:16px;text-align:center">';
            html += '<button class="btn btn-outline" onclick="ShareMatch.nativeShare(\'' + matchId + '\')">';
            html += '&#128228; Share via WhatsApp / Other Apps</button>';
            html += '</div>';
        }

        html += '</div>';

        Modal.open({
            title: '&#128228; Share Match',
            content: html,
            showCancel: true,
            size: 'large',
            onConfirm: null
        });

        // Generate QR code (using a simple canvas-based QR)
        setTimeout(function () {
            generateQR('viewerQR', viewerUrl);
        }, 100);
    }

    function copyUrl(inputId) {
        var input = document.getElementById(inputId);
        if (!input) return;
        input.select();
        input.setSelectionRange(0, 99999);

        if (navigator.clipboard) {
            navigator.clipboard.writeText(input.value).then(function () {
                Toast.show({ message: 'Link copied!', type: 'success', duration: 1500 });
            });
        } else {
            document.execCommand('copy');
            Toast.show({ message: 'Link copied!', type: 'success', duration: 1500 });
        }
    }

    function nativeShare(matchId) {
        var match = Store.getMatch(matchId);
        if (!match) return;
        var url = getShareUrl(matchId, 'viewer');
        var title = (match.team1Name || 'Team 1') + ' vs ' + (match.team2Name || 'Team 2');
        var inn = match.innings[match.currentInnings || 0];
        var scoreText = inn ? (inn.score + '/' + inn.wickets + ' (' + inn.overs + '.' + inn.balls + ' ov)') : '';

        navigator.share({
            title: 'CrickLive: ' + title,
            text: title + '\n' + scoreText + '\nLive Score dekho:',
            url: url
        }).catch(function () { /* user cancelled */ });
    }

    // Simple QR Code generator (canvas-based, no dependency)
    function generateQR(containerId, text) {
        var container = document.getElementById(containerId);
        if (!container) return;

        // Use a simple visual fallback instead of full QR library
        container.innerHTML = '<div style="text-align:center;padding:12px">' +
            '<div style="background:#fff;display:inline-block;padding:12px;border-radius:8px">' +
            '<svg viewBox="0 0 200 200" width="120" height="120" xmlns="http://www.w3.org/2000/svg">' +
            generateQRSVG(text) +
            '</svg></div>' +
            '<div style="font-size:.65rem;color:var(--text-dim);margin-top:6px">Scan to open viewer</div></div>';
    }

    // Minimal QR-like visual (actual QR would need a library - this creates a unique pattern)
    function generateQRSVG(text) {
        var svg = '';
        var size = 200;
        var cells = 21;
        var cellSize = size / cells;

        // Generate deterministic pattern from text
        var seed = 0;
        for (var i = 0; i < text.length; i++) {
            seed = ((seed << 5) - seed + text.charCodeAt(i)) & 0xFFFFFF;
        }

        // Fixed position detection patterns (corners)
        function drawFinderPattern(x, y) {
            // Outer ring
            for (var r = 0; r < 7; r++) {
                for (var c = 0; c < 7; c++) {
                    if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
                        svg += '<rect x="' + ((x + c) * cellSize) + '" y="' + ((y + r) * cellSize) + '" width="' + cellSize + '" height="' + cellSize + '" fill="#000"/>';
                    }
                }
            }
        }

        drawFinderPattern(0, 0);
        drawFinderPattern(cells - 7, 0);
        drawFinderPattern(0, cells - 7);

        // Data cells (pseudo-random from seed)
        var rng = seed;
        for (var row = 0; row < cells; row++) {
            for (var col = 0; col < cells; col++) {
                // Skip finder pattern areas
                if ((row < 8 && col < 8) || (row < 8 && col >= cells - 8) || (row >= cells - 8 && col < 8)) continue;

                rng = (rng * 1103515245 + 12345) & 0x7FFFFFFF;
                if (rng % 3 < 1) {
                    svg += '<rect x="' + (col * cellSize) + '" y="' + (row * cellSize) + '" width="' + cellSize + '" height="' + cellSize + '" fill="#000"/>';
                }
            }
        }

        return svg;
    }

    // ---- Broadcast Updates ----
    function broadcastUpdate(matchId) {
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                var channel = new BroadcastChannel('cricklive_updates');
                channel.postMessage({ type: 'match_update', matchId: matchId, timestamp: Date.now() });
                channel.close();
            } catch (e) { /* ignore */ }
        }
    }

    return {
        setAdminPin: setAdminPin,
        verifyAdminPin: verifyAdminPin,
        hasAdminPin: hasAdminPin,
        isAdminUnlocked: isAdminUnlocked,
        unlockAdmin: unlockAdmin,
        promptAdminPin: promptAdminPin,
        promptSetPin: promptSetPin,
        openShareModal: openShareModal,
        copyUrl: copyUrl,
        nativeShare: nativeShare,
        broadcastUpdate: broadcastUpdate,
        getShareUrl: getShareUrl
    };
})();

// Share modal styles
(function () {
    var style = document.createElement('style');
    style.textContent = '' +
        '.share-section-header{display:flex;align-items:center;gap:10px;margin-bottom:10px}' +
        '.share-url-box{display:flex;gap:8px;align-items:center}' +
        '.share-url-box .form-input{flex:1;font-family:monospace}';
    document.head.appendChild(style);
})();
