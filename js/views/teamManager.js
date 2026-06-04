/* ============ TEAM MANAGER VIEW ============ */
var TeamManagerView = (function () {

    function render() {
        var app = document.getElementById('app');
        var teams = Store.getTeams();

        var html = '<div class="container">';
        html += '<div class="flex-between" style="margin-bottom:24px;flex-wrap:wrap;gap:12px">';
        html += '<div><h1 class="section-title">&#128101; Teams</h1><p class="section-subtitle">Create and manage your local teams</p></div>';
        html += '<button class="btn btn-primary" onclick="TeamManagerView.openCreateModal()">+ Create Team</button>';
        html += '</div>';

        if (teams.length === 0) {
            html += '<div class="empty-state">';
            html += '<div class="empty-state-icon">&#128101;</div>';
            html += '<div class="empty-state-title">No Teams Yet</div>';
            html += '<div class="empty-state-desc">Create your first team to start organizing matches!</div>';
            html += '<br><button class="btn btn-primary" onclick="TeamManagerView.openCreateModal()">+ Create Team</button>';
            html += '</div>';
        } else {
            html += '<div class="grid-auto stagger-children">';
            teams.forEach(function (team) {
                html += renderTeamCard(team);
            });
            html += '</div>';
        }

        html += '</div>';
        app.innerHTML = html;
    }

    function renderTeamCard(team) {
        var playerCount = (team.players || []).length;
        var roles = {};
        (team.players || []).forEach(function (p) {
            roles[p.role] = (roles[p.role] || 0) + 1;
        });

        var html = '<div class="card card-enter">';
        html += '<div class="flex-between" style="margin-bottom:12px">';
        html += '<div style="display:flex;align-items:center;gap:12px">';
        html += '<div class="team-logo" style="background:' + (team.logoColor || '#2979ff') + '">' + (team.shortName || '??') + '</div>';
        html += '<div>';
        html += '<div style="font-weight:700;font-size:1.05rem">' + team.name + '</div>';
        html += '<div style="font-size:.75rem;color:var(--text-secondary)">' + playerCount + ' players</div>';
        html += '</div></div>';
        html += '<div style="display:flex;gap:6px">';
        html += '<button class="btn btn-ghost btn-sm" onclick="TeamManagerView.openEditModal(\'' + team.id + '\')">Edit</button>';
        html += '<button class="btn btn-ghost btn-sm" style="color:var(--accent-red)" onclick="TeamManagerView.confirmDelete(\'' + team.id + '\')">Delete</button>';
        html += '</div></div>';

        // Players list (compact)
        if (team.players && team.players.length > 0) {
            html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">';
            team.players.forEach(function (p) {
                var roleIcon = p.role === 'batsman' ? '&#127951;' : p.role === 'bowler' ? '&#127936;' : p.role === 'wicketkeeper' ? '&#129349;' : '&#11088;';
                html += '<span class="chip">' + roleIcon + ' ' + p.name + '</span>';
            });
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function getModalContent(team) {
        team = team || {};
        var players = team.players || [{ name: '', role: 'batsman' }];

        var html = '<div class="form-group">';
        html += '<label class="form-label">Team Name</label>';
        html += '<input type="text" class="form-input" id="teamName" value="' + (team.name || '') + '" placeholder="e.g. Mohalla Warriors">';
        html += '</div>';

        html += '<div class="form-row">';
        html += '<div class="form-group">';
        html += '<label class="form-label">Short Name (3 letters)</label>';
        html += '<input type="text" class="form-input" id="teamShort" maxlength="3" value="' + (team.shortName || '') + '" placeholder="e.g. MOW" style="text-transform:uppercase">';
        html += '</div>';
        html += '<div class="form-group">';
        html += '<label class="form-label">Team Color</label>';
        html += '<input type="color" class="form-color" id="teamColor" value="' + (team.logoColor || '#2979ff') + '">';
        html += '</div>';
        html += '</div>';

        html += '<div class="form-group">';
        html += '<label class="form-label">Players (min 2)</label>';
        html += '<div id="playersList">';

        players.forEach(function (p, i) {
            html += renderPlayerRow(i, p.name, p.role);
        });

        html += '</div>';
        html += '<button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="TeamManagerView.addPlayerRow()">+ Add Player</button>';
        html += '</div>';

        return html;
    }

    function renderPlayerRow(index, name, role) {
        return '<div class="player-row" style="display:flex;gap:8px;margin-bottom:6px;align-items:center">' +
            '<input type="text" class="form-input player-name-input" placeholder="Player name" value="' + (name || '') + '" style="flex:1">' +
            '<select class="form-select player-role-select" style="width:130px">' +
            '<option value="batsman"' + (role === 'batsman' ? ' selected' : '') + '>Batsman</option>' +
            '<option value="bowler"' + (role === 'bowler' ? ' selected' : '') + '>Bowler</option>' +
            '<option value="allrounder"' + (role === 'allrounder' ? ' selected' : '') + '>All-rounder</option>' +
            '<option value="wicketkeeper"' + (role === 'wicketkeeper' ? ' selected' : '') + '>Keeper</option>' +
            '</select>' +
            '<button class="btn btn-icon btn-ghost" onclick="this.parentElement.remove()" style="color:var(--accent-red);flex-shrink:0">&times;</button>' +
            '</div>';
    }

    function addPlayerRow() {
        var list = document.getElementById('playersList');
        if (!list) return;
        var div = document.createElement('div');
        div.innerHTML = renderPlayerRow(list.children.length, '', 'batsman');
        list.appendChild(div.firstChild);
    }

    function collectFormData() {
        var name = document.getElementById('teamName').value.trim();
        var shortName = document.getElementById('teamShort').value.trim().toUpperCase();
        var color = document.getElementById('teamColor').value;

        if (!name) { Toast.show({ message: 'Team name is required', type: 'error' }); return null; }
        if (!shortName || shortName.length < 2) { Toast.show({ message: 'Short name needs at least 2 characters', type: 'error' }); return null; }

        var players = [];
        var rows = document.querySelectorAll('.player-row');
        rows.forEach(function (row) {
            var pName = row.querySelector('.player-name-input').value.trim();
            var pRole = row.querySelector('.player-role-select').value;
            if (pName) players.push({ id: pName.toLowerCase().replace(/\s+/g, '_'), name: pName, role: pRole });
        });

        if (players.length < 2) { Toast.show({ message: 'Add at least 2 players', type: 'error' }); return null; }

        return { name: name, shortName: shortName, logoColor: color, players: players };
    }

    function openCreateModal() {
        Modal.open({
            title: 'Create Team',
            content: getModalContent(),
            confirmText: 'Create Team',
            confirmClass: 'btn-primary',
            size: 'large',
            onConfirm: function () {
                var data = collectFormData();
                if (!data) return;
                Store.saveTeam(data);
                Toast.show({ message: 'Team "' + data.name + '" created!', type: 'success' });
                Modal.close();
                render();
            }
        });
    }

    function openEditModal(id) {
        var team = Store.getTeam(id);
        if (!team) return;

        Modal.open({
            title: 'Edit Team',
            content: getModalContent(team),
            confirmText: 'Save Changes',
            confirmClass: 'btn-primary',
            size: 'large',
            onConfirm: function () {
                var data = collectFormData();
                if (!data) return;
                data.id = id;
                data.createdAt = team.createdAt;
                Store.saveTeam(data);
                Toast.show({ message: 'Team updated!', type: 'success' });
                Modal.close();
                render();
            }
        });
    }

    function confirmDelete(id) {
        var team = Store.getTeam(id);
        if (!team) return;

        Modal.open({
            title: 'Delete Team',
            content: '<p style="color:var(--text-secondary)">Are you sure you want to delete <strong>' + team.name + '</strong>? This cannot be undone.</p>',
            confirmText: 'Delete',
            confirmClass: 'btn-danger',
            size: 'small',
            onConfirm: function () {
                Store.deleteTeam(id);
                Toast.show({ message: 'Team deleted', type: 'info' });
                Modal.close();
                render();
            }
        });
    }

    return {
        render: render,
        openCreateModal: openCreateModal,
        openEditModal: openEditModal,
        confirmDelete: confirmDelete,
        addPlayerRow: addPlayerRow
    };
})();
