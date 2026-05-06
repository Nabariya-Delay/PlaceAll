(function () {
    "use strict";
    var SUPPORTED = ['pdf', 'ai', 'eps', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'tif', 'tiff', 'psd', 'bmp', 'webp'];
    var MM_TO_PT = 2.834645669;
    var state = {
        cs: null, files: [], layoutMode: 'horizontal', cols: 3, spacingMM: 5, processing: false, nextId: 0
    };
    var el = {};

    function init() {
        el.dropZone = document.getElementById('dropZone');
        el.fileList = document.getElementById('fileList');
        el.clearAll = document.getElementById('clearAll');
        el.optionsSection = document.getElementById('optionsSection');
        el.actionBar = document.querySelector('.action-bar');
        el.placeBtn = document.getElementById('placeBtn');
        el.spacingInput = document.getElementById('spacingInput');
        el.colsInput = document.getElementById('colsInput');
        el.statusMsg = document.getElementById('statusMessage');
        el.statusBar = document.getElementById('statusBar');
        el.progressBar = document.getElementById('progressBar');
        el.progressFill = document.getElementById('progressFill');
        el.fileInput = document.getElementById('fileInput');
        el.createAB = document.getElementById('createAB');
        try {
            state.cs = new CSInterface();
            state.cs.setScriptTimeout(120000);
        } catch (e) { status('CEP環境外', 'warn'); }
        setupDrag();
        setupEvents();
        status('', '');
    }

    // ---- Drag & Drop ----
    function setupDrag() {
        document.addEventListener('dragover', function (e) { e.preventDefault(); });
        document.addEventListener('drop', function (e) { e.preventDefault(); });
        el.dropZone.addEventListener('dragenter', function (e) { e.preventDefault(); this.classList.add('drag-over'); });
        el.dropZone.addEventListener('dragover', function (e) { e.preventDefault(); this.classList.add('drag-over'); });
        el.dropZone.addEventListener('dragleave', function (e) {
            var r = this.getBoundingClientRect();
            if (e.clientX <= r.left || e.clientX >= r.right || e.clientY <= r.top || e.clientY >= r.bottom)
                this.classList.remove('drag-over');
        });
        el.dropZone.addEventListener('drop', function (e) {
            e.preventDefault(); e.stopPropagation();
            this.classList.remove('drag-over');
            if (state.processing) return;
            var files = e.dataTransfer.files;
            for (var i = 0; i < files.length; i++) addFile(files[i]);
        });
        // Click to browse
        el.dropZone.addEventListener('click', function () {
            if (!state.processing) el.fileInput.click();
        });
        el.fileInput.addEventListener('change', function () {
            var files = this.files;
            for (var i = 0; i < files.length; i++) addFile(files[i]);
            this.value = ''; // reset so same file can be selected again
        });
    }

    function setupEvents() {
        el.clearAll.addEventListener('click', clearAll);
        el.spacingInput.addEventListener('change', function () { state.spacingMM = parseFloat(this.value) || 0; });
        el.colsInput.addEventListener('change', function () { state.cols = parseInt(this.value, 10) || 3; });
        el.placeBtn.addEventListener('click', function () { if (!state.processing) placeAll(); });
    }

    // ---- Add File ----
    function addFile(file) {
        var ext = (file.name.split('.').pop() || '').toLowerCase();
        if (SUPPORTED.indexOf(ext) === -1) {
            status(file.name + ' は非対応の形式です', 'warn');
            return;
        }
        var path = file.path || '';
        if (path.normalize) path = path.normalize('NFC');
        if (!path) { status('パスを取得できません', 'err'); return; }

        var name = file.name || '';
        if (name.normalize) name = name.normalize('NFC');

        var entry = {
            id: state.nextId++, path: path, name: name, ext: ext,
            pageCount: 1, selectedPages: [1], isPDF: ext === 'pdf'
        };
        state.files.push(entry);
        if (entry.isPDF) {
            detectPages(entry);
        } else {
            renderFiles();
        }
        showUI();
    }

    // ---- Detect PDF Pages ----
    function detectPages(entry) {
        // Try Node.js first (faster)
        try {
            var fs = require('fs');
            var buf = fs.readFileSync(entry.path);
            var str = buf.toString('latin1');
            var max = 0, si = 0;
            while (true) {
                var idx = str.indexOf('/Type', si);
                if (idx === -1) break;
                var reg = str.substring(idx, Math.min(idx + 40, str.length));
                if (/\/Type\s*\/Pages\b/.test(reg)) {
                    var dr = str.substring(Math.max(0, idx - 200), Math.min(str.length, idx + 200));
                    var cm = dr.match(/\/Count\s+(\d+)/);
                    if (cm) { var c = parseInt(cm[1], 10); if (c > max) max = c; }
                }
                si = idx + 5;
            }
            entry.pageCount = max > 0 ? max : 1;
            entry.selectedPages = [];
            for (var i = 1; i <= entry.pageCount; i++) entry.selectedPages.push(i);
            renderFiles();
            return;
        } catch (e) { }
        // Fallback: ExtendScript
        if (state.cs) {
            var ep = entry.path.replace(/\\/g, '/').replace(/'/g, "\\'");
            state.cs.evalScript("getPDFPageCount('" + ep + "')", function (res) {
                var count = 1;
                try {
                    if (res && res.indexOf('EvalScript') !== 0) {
                        var d = JSON.parse(res);
                        count = d.count || 1;
                    }
                } catch (e) { }
                entry.pageCount = count;
                entry.selectedPages = [];
                for (var i = 1; i <= count; i++) entry.selectedPages.push(i);
                renderFiles();
            });
        } else {
            renderFiles();
        }
    }

    // ---- Render File List ----
    function renderFiles() {
        el.fileList.innerHTML = '';
        for (var i = 0; i < state.files.length; i++) {
            el.fileList.appendChild(buildFileItem(state.files[i]));
        }
        updatePlaceBtn();
    }

    function badgeClass(ext) {
        if (ext === 'pdf') return 'pdf';
        if (ext === 'ai') return 'ai';
        if (ext === 'eps') return 'eps';
        if (ext === 'svg') return 'svg';
        if (['png', 'jpg', 'jpeg', 'gif', 'tif', 'tiff', 'psd', 'bmp', 'webp'].indexOf(ext) >= 0) return 'img';
        return 'other';
    }

    function buildFileItem(entry) {
        var div = document.createElement('div');
        div.className = 'file-item';
        div.setAttribute('data-id', entry.id);
        var selCount = entry.selectedPages.length;
        var metaText = entry.isPDF && entry.pageCount > 1
            ? entry.pageCount + 'p / ' + selCount + ' 選択'
            : (entry.isPDF ? '1 ページ' : entry.ext.toUpperCase());

        var html = '<div class="file-item-header">' +
            '<div class="file-badge ' + badgeClass(entry.ext) + '">' + entry.ext.toUpperCase() + '</div>' +
            '<div class="file-item-info"><div class="file-item-name">' + escHtml(entry.name) + '</div>' +
            '<div class="file-item-meta">' + metaText + '</div></div>' +
            '<button class="file-item-remove" data-id="' + entry.id + '">&#x2715;</button></div>';

        if (entry.isPDF && entry.pageCount > 1) {
            html += '<div class="file-item-pages"><div class="page-header">' +
                '<span class="page-header-label">ページ選択</span>' +
                '<div class="page-actions">' +
                '<button class="page-act-btn sel-all" data-id="' + entry.id + '">すべて</button>' +
                '<button class="page-act-btn desel-all" data-id="' + entry.id + '">解除</button>' +
                '</div></div><div class="page-grid">';
            for (var p = 1; p <= entry.pageCount; p++) {
                var sel = entry.selectedPages.indexOf(p) >= 0 ? ' sel' : '';
                html += '<div class="page-item' + sel + '" data-id="' + entry.id + '" data-page="' + p + '">' +
                    '<div class="page-num">' + p + '</div></div>';
            }
            html += '</div></div>';
        }
        div.innerHTML = html;

        // Events
        div.querySelector('.file-item-remove').addEventListener('click', function () {
            removeFile(parseInt(this.getAttribute('data-id'), 10));
        });
        var pageItems = div.querySelectorAll('.page-item');
        for (var j = 0; j < pageItems.length; j++) {
            pageItems[j].addEventListener('click', function () {
                var fid = parseInt(this.getAttribute('data-id'), 10);
                var pg = parseInt(this.getAttribute('data-page'), 10);
                togglePage(fid, pg);
            });
        }
        var selAllBtn = div.querySelector('.sel-all');
        var deselBtn = div.querySelector('.desel-all');
        if (selAllBtn) selAllBtn.addEventListener('click', function () {
            selectAllPages(parseInt(this.getAttribute('data-id'), 10));
        });
        if (deselBtn) deselBtn.addEventListener('click', function () {
            deselectAllPages(parseInt(this.getAttribute('data-id'), 10));
        });
        return div;
    }

    function escHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    // ---- Page Toggle ----
    function findFile(id) {
        for (var i = 0; i < state.files.length; i++) if (state.files[i].id === id) return state.files[i];
        return null;
    }
    function togglePage(fid, pg) {
        var f = findFile(fid); if (!f) return;
        var idx = f.selectedPages.indexOf(pg);
        if (idx >= 0) f.selectedPages.splice(idx, 1);
        else { f.selectedPages.push(pg); f.selectedPages.sort(function (a, b) { return a - b; }); }
        renderFiles();
    }
    function selectAllPages(fid) {
        var f = findFile(fid); if (!f) return;
        f.selectedPages = [];
        for (var i = 1; i <= f.pageCount; i++) f.selectedPages.push(i);
        renderFiles();
    }
    function deselectAllPages(fid) {
        var f = findFile(fid); if (!f) return;
        f.selectedPages = [];
        renderFiles();
    }

    // ---- Remove File ----
    function removeFile(id) {
        state.files = state.files.filter(function (f) { return f.id !== id; });
        renderFiles();
        if (state.files.length === 0) hideUI();
    }
    function clearAll() {
        state.files = [];
        renderFiles();
        hideUI();
        status('', '');
    }

    // ---- UI Visibility ----
    function showUI() {
        el.optionsSection.classList.add('visible');
        updatePlaceBtn();
    }
    function hideUI() {
        el.optionsSection.classList.remove('visible');
    }
    function updatePlaceBtn() {
        var total = 0;
        for (var i = 0; i < state.files.length; i++) total += state.files[i].selectedPages.length;
        el.placeBtn.disabled = total === 0;
        el.placeBtn.textContent = total > 0 ? total + ' アイテムを配置' : '配置する';
    }

    // ---- Place All ----
    function placeAll() {
        if (!state.cs) { status('Illustratorに接続できません', 'err'); return; }
        var filesData = [];
        for (var i = 0; i < state.files.length; i++) {
            var f = state.files[i];
            if (f.selectedPages.length === 0) continue;
            filesData.push({ path: f.path, pages: f.selectedPages, isPDF: f.isPDF });
        }
        if (filesData.length === 0) return;

        state.processing = true;
        el.placeBtn.disabled = true;
        el.placeBtn.textContent = '配置中...';
        status('配置を実行中...', 'work');
        showProgress(0);
        animateProgress();

        var data = {
            files: filesData,
            layout: state.layoutMode,
            cols: state.cols,
            spacingPt: state.spacingMM * MM_TO_PT,
            createAB: el.createAB.checked
        };

        // Write JSON to temp file via Node.js
        try {
            var os = require('os');
            var fs = require('fs');
            var path = require('path');
            var tmpFile = path.join(os.tmpdir(), 'placepdf_data_' + Date.now() + '.json');
            fs.writeFileSync(tmpFile, JSON.stringify(data), 'utf8');
            var escapedTmp = tmpFile.replace(/\\/g, '/').replace(/'/g, "\\'");
            state.cs.evalScript("placeFilesFromJSON('" + escapedTmp + "')", function (res) {
                onPlaceResult(res);
                // Clean up temp file
                try { fs.unlinkSync(tmpFile); } catch (e) { }
            });
        } catch (e) {
            status('ファイル書き込みエラー: ' + e.message, 'err');
            state.processing = false;
            updatePlaceBtn();
            hideProgress();
        }
    }

    function onPlaceResult(res) {
        state.processing = false;
        if (!res || res === 'undefined' || (typeof res === 'string' && res.indexOf('EvalScript') === 0)) {
            hideProgress();
            status('ExtendScriptエラー: ' + (res || '不明'), 'err');
            updatePlaceBtn();
            return;
        }
        try {
            var d = JSON.parse(res);
            if (d.success) {
                showProgress(100);
                status(d.placed + ' アイテムを配置しました', 'ok');
            } else {
                hideProgress();
                status('エラー: ' + (d.error || '不明'), 'err');
            }
        } catch (e) {
            hideProgress();
            status('応答エラー: ' + res, 'err');
        }
        updatePlaceBtn();
        setTimeout(hideProgress, 2000);
    }

    // ---- Progress ----
    var pTimer = null;
    function showProgress(p) { el.progressBar.classList.add('vis'); el.progressFill.style.width = p + '%'; }
    function hideProgress() {
        if (pTimer) { clearInterval(pTimer); pTimer = null; }
        el.progressBar.classList.remove('vis'); el.progressFill.style.width = '0%';
    }
    function animateProgress() {
        var p = 0;
        if (pTimer) clearInterval(pTimer);
        pTimer = setInterval(function () {
            p += (90 - p) * 0.05;
            showProgress(Math.min(p, 90));
            if (!state.processing) { clearInterval(pTimer); pTimer = null; }
        }, 100);
    }

    // ---- Status ----
    function status(msg, type) {
        el.statusMsg.textContent = msg;
        el.statusMsg.className = 'status-message' + (type ? ' ' + type : '');
        if (msg) {
            el.statusBar.classList.add('has-msg');
        } else {
            el.statusBar.classList.remove('has-msg');
        }
    }

    // ---- Init ----
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
