/**
 * Windows 11 File Explorer (This PC, C:\ Drive Tree, Pictures, Documents, Downloads, Recycle Bin)
 * Supports simulated Arabic RTL File Picker dialog for Personalization Wallpaper Browse (Section 2).
 */
(function (global) {
    'use strict';

    var WIN_ID = 'win-explorer';
    var fallbackUi = { currentLocation: 'this-pc' };

    function uiState() {
        var sess = global.Win11Sessions ? global.Win11Sessions.getActiveSession() : null;
        if (sess && sess.appUi) {
            if (!sess.appUi.explorer) sess.appUi.explorer = { currentLocation: 'this-pc' };
            return sess.appUi.explorer;
        }
        return fallbackUi;
    }

    function getHostBody() {
        var w = global.Win11WM.getWindow(WIN_ID);
        return w ? w.bodyEl : null;
    }

    function normalizeUserFolder(username) {
        var raw = username || 'MENIAI';
        return (String(raw).toLowerCase() === 'invité' || String(raw).toLowerCase() === 'invite') ? 'Invite' : raw;
    }

    function getAddressPath(loc, username) {
        var u = normalizeUserFolder(username);
        if (loc === 'this-pc') return 'هذا الكمبيوتر (This PC)';
        if (loc === 'c-drive') return 'C:\\';
        if (loc === 'users-dir') return 'C:\\Users';
        if (loc === 'user-home') return 'C:\\Users\\' + u;
        if (loc === 'desktop') return 'C:\\Users\\' + u + '\\Desktop';
        if (loc === 'documents') return 'C:\\Users\\' + u + '\\Documents';
        if (loc === 'downloads') return 'C:\\Users\\' + u + '\\Downloads';
        if (loc === 'pictures') return 'C:\\Users\\' + u + '\\Pictures';
        if (loc === 'recycle-bin') return 'Recycle Bin';
        return 'C:\\Users\\' + u;
    }

    function renderLocationContent(loc, st, t, bidi, pickerMode, selectedFileId) {
        var u = normalizeUserFolder(st.currentUser);
        var headerTitle = '';
        if (loc === 'this-pc') headerTitle = t('explorer.thisPc') + ' — <bdi dir="ltr">' + global.Win11Compat.escapeHtml(st.deviceName) + '</bdi>';
        else if (loc === 'c-drive') headerTitle = t('explorer.localDiskC');
        else if (loc === 'users-dir') headerTitle = t('explorer.usersFolder');
        else if (loc === 'user-home') headerTitle = '<bdi dir="ltr">' + global.Win11Compat.escapeHtml(u) + '</bdi>';
        else if (loc === 'desktop') headerTitle = t('explorer.desktop');
        else if (loc === 'downloads') headerTitle = t('explorer.downloads');
        else if (loc === 'pictures') headerTitle = t('explorer.pictures');
        else if (loc === 'recycle-bin') headerTitle = t('explorer.recycleBin');
        else headerTitle = t('explorer.documents');

        var body = '';
        if (loc === 'this-pc') {
            body =
                '<div style="font-size:13px;font-weight:600;color:var(--win-text-secondary);margin-bottom:8px">' + bidi(t('explorer.devicesDrives')) + '</div>' +
                '<div class="fe-drive-grid">' +
                    '<div class="fe-drive-card" data-fe-nav="c-drive">' +
                        global.Win11Icons.get('drive', 30) +
                        '<div style="flex:1">' +
                            '<div style="font-weight:600;font-size:13.5px">' + bidi(t('explorer.driveC')) + '</div>' +
                            '<div class="win-progress" style="margin:6px 0 4px"><div class="win-progress-fill" style="width:25%"></div></div>' +
                            '<div style="font-size:11.5px;color:var(--win-text-secondary)"><bdi dir="ltr">191.8 GB free of 256 GB</bdi></div>' +
                        '</div>' +
                    '</div>' +
                    (!pickerMode ? (
                        '<div class="fe-drive-card" data-fe-nav="documents">' +
                            global.Win11Icons.get('drive', 30) +
                            '<div style="flex:1">' +
                                '<div style="font-weight:600;font-size:13.5px">' + bidi(t('explorer.driveD')) + '</div>' +
                                '<div class="win-progress" style="margin:6px 0 4px"><div class="win-progress-fill" style="width:12%"></div></div>' +
                                '<div style="font-size:11.5px;color:var(--win-text-secondary)"><bdi dir="ltr">225 GB free of 256 GB</bdi></div>' +
                            '</div>' +
                        '</div>'
                    ) : '') +
                '</div>' +
                '<div style="font-size:13px;font-weight:600;color:var(--win-text-secondary);margin:14px 0 8px">' + bidi(t('explorer.quickAccess')) + '</div>' +
                '<div class="fe-drive-grid">' +
                    '<div class="fe-drive-card" data-fe-nav="desktop">' + global.Win11Icons.get('wallpaper', 24) + '<div style="font-weight:600;font-size:13px">' + bidi(t('explorer.desktop')) + '</div></div>' +
                    '<div class="fe-drive-card" data-fe-nav="documents">' + global.Win11Icons.get('folderOpen', 24) + '<div style="font-weight:600;font-size:13px">' + bidi(t('explorer.documents')) + '</div></div>' +
                    '<div class="fe-drive-card" data-fe-nav="downloads">' + global.Win11Icons.get('download', 24) + '<div style="font-weight:600;font-size:13px">' + bidi(t('explorer.downloads')) + '</div></div>' +
                    '<div class="fe-drive-card" data-fe-nav="pictures">' + global.Win11Icons.get('wallpaper', 24) + '<div style="font-weight:600;font-size:13px">' + bidi(t('explorer.pictures')) + '</div></div>' +
                '</div>';
        } else if (loc === 'c-drive') {
            body =
                '<div class="fe-drive-grid">' +
                    '<div class="fe-drive-card" data-fe-nav="users-dir">' +
                        global.Win11Icons.get('folderClosed', 28) +
                        '<div><div style="font-weight:600;font-size:13px"><bdi dir="ltr">Users</bdi></div><div style="font-size:11.5px;color:var(--win-text-secondary)">' + bidi(t('explorer.usersFolder')) + '</div></div>' +
                    '</div>' +
                '</div>';
        } else if (loc === 'users-dir') {
            body =
                '<div class="fe-drive-grid">' +
                    '<div class="fe-drive-card" data-fe-nav="user-home">' +
                        global.Win11Icons.get('user', 26) +
                        '<div><div style="font-weight:600;font-size:13px"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(u) + '</bdi></div></div>' +
                    '</div>' +
                '</div>';
        } else if (loc === 'user-home') {
            body =
                '<div class="fe-drive-grid">' +
                    '<div class="fe-drive-card" data-fe-nav="desktop">' + global.Win11Icons.get('folderClosed', 26) + '<div style="font-weight:600;font-size:13px"><bdi dir="ltr">Desktop</bdi></div></div>' +
                    '<div class="fe-drive-card" data-fe-nav="documents">' + global.Win11Icons.get('folderClosed', 26) + '<div style="font-weight:600;font-size:13px"><bdi dir="ltr">Documents</bdi></div></div>' +
                    '<div class="fe-drive-card" data-fe-nav="downloads">' + global.Win11Icons.get('folderClosed', 26) + '<div style="font-weight:600;font-size:13px"><bdi dir="ltr">Downloads</bdi></div></div>' +
                    '<div class="fe-drive-card" data-fe-nav="pictures">' + global.Win11Icons.get('folderOpen', 26) + '<div style="font-weight:600;font-size:13px"><bdi dir="ltr">Pictures</bdi> (' + bidi(t('explorer.pictures')) + ')</div></div>' +
                '</div>';
        } else if (loc === 'recycle-bin') {
            body =
                '<div class="win-card" style="text-align:center;padding:34px;color:var(--win-text-secondary)">' +
                    global.Win11Icons.get('recycleBin', 44) +
                    '<div style="margin-top:10px">' + bidi(t('explorer.emptyBin')) + '</div>' +
                '</div>';
        } else {
            var folderFiles = (st.userFiles || []).filter(function (f) { return f.folder === loc; });
            var filesHtml = '';
            for (var fi = 0; fi < folderFiles.length; fi++) {
                var f = folderFiles[fi];
                var isImg = (f.type === 'image' && f.imgPath);
                var isInstaller = (f.type === 'installer');
                var thumb = isImg
                    ? '<img src="' + global.Win11State.resolveMediaUrl(f.imgPath) + '" alt="' + global.Win11Compat.escapeHtml(f.name) + '" style="width:44px;height:32px;object-fit:cover;border-radius:4px;border:1px solid var(--win-border-control)">'
                    : (isInstaller ? global.Win11Icons.get('installer', 28) : global.Win11Icons.get('folderOpen', 24));
                var isSel = (selectedFileId && selectedFileId === f.id);
                var kindLabel = isImg ? 'JPG Image' : (isInstaller ? 'Windows Installer (.exe)' : 'Text Document');
                var actionBtnHtml = '';
                if (!pickerMode && isInstaller) {
                    actionBtnHtml = '<button type="button" class="win-btn win-btn-accent" data-fe-run-setup="' + global.Win11Compat.escapeHtml(f.id) + '" style="font-size:11.5px;padding:4px 9px">' + bidi(t('explorer.runSetupBtn') || 'تثبيت') + '</button>';
                } else if (!pickerMode && f.type === 'text') {
                    actionBtnHtml = '<button type="button" class="win-btn win-btn-secondary" data-fe-edit-file="' + global.Win11Compat.escapeHtml(f.id) + '" style="font-size:11.5px;padding:4px 9px">' + bidi(t('app.edit')) + '</button>';
                }
                filesHtml +=
                    '<div class="fe-drive-card' + (isSel ? ' setting-highlight' : '') + '" data-user-file="' + global.Win11Compat.escapeHtml(f.id) + '" data-file-type="' + global.Win11Compat.escapeHtml(f.type || 'text') + '" style="cursor:pointer;justify-content:space-between">' +
                        '<div style="display:flex;align-items:center;gap:10px;min-width:0">' +
                            thumb +
                            '<div style="min-width:0">' +
                                '<div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(f.name) + '</bdi></div>' +
                                '<div style="font-size:11px;color:var(--win-text-secondary)"><bdi dir="ltr">' + kindLabel + '</bdi></div>' +
                            '</div>' +
                        '</div>' +
                        actionBtnHtml +
                    '</div>';
            }
            if (folderFiles.length === 0) {
                filesHtml = '<div style="font-size:12.5px;color:var(--win-text-secondary);padding:12px">' + bidi('هذا المجلد فارغ.') + '</div>';
            }
            body = '<div class="fe-drive-grid">' + filesHtml + '</div>';
        }

        return { headerTitle: headerTitle, body: body };
    }

    function render() {
        var hostBody = getHostBody();
        if (!hostBody) return;
        var ui = uiState();
        var currentLocation = ui.currentLocation;
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();

        global.Win11WM.setTitle(WIN_ID, t('explorer.title'));

        var navItems = [
            { id: 'this-pc', icon: 'thisPc', label: t('explorer.thisPc') },
            { id: 'desktop', icon: 'wallpaper', label: t('explorer.desktop') },
            { id: 'documents', icon: 'folderOpen', label: t('explorer.documents') },
            { id: 'downloads', icon: 'download', label: t('explorer.downloads') },
            { id: 'pictures', icon: 'wallpaper', label: t('explorer.pictures') },
            { id: 'recycle-bin', icon: 'recycleBin', label: t('explorer.recycleBin') }
        ];

        var sideHtml = '<div class="fe-sidebar">';
        for (var i = 0; i < navItems.length; i++) {
            sideHtml +=
                '<button type="button" class="fe-nav-item' + (currentLocation === navItems[i].id ? ' is-active' : '') + '" data-fe-nav="' + navItems[i].id + '">' +
                    global.Win11Icons.get(navItems[i].icon, 16) +
                    '<span>' + bidi(navItems[i].label) + '</span>' +
                '</button>';
        }
        sideHtml += '</div>';

        var view = renderLocationContent(currentLocation, st, t, bidi, false, null);
        var isUserFolder = (currentLocation === 'desktop' || currentLocation === 'documents' || currentLocation === 'downloads' || currentLocation === 'pictures');

        var contentHtml =
            '<div class="fe-content">' +
                '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--win-border-control);border-radius:6px;background:var(--win-surface-subtle);margin-bottom:12px;font-size:12.5px">' +
                    '<span style="color:var(--win-text-secondary)">' + bidi(t('explorer.addressLabel')) + '</span>' +
                    '<bdi dir="ltr" id="fe-address-bar" style="font-weight:600">' + global.Win11Compat.escapeHtml(getAddressPath(currentLocation, st.currentUser)) + '</bdi>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px;flex-wrap:wrap">' +
                    '<div style="font-size:17px;font-weight:700">' + view.headerTitle + '</div>' +
                    (currentLocation === 'this-pc' ? (
                        '<div style="display:flex;gap:8px">' +
                            '<button type="button" class="win-btn win-btn-secondary" id="fe-props-btn">' + bidi(t('explorer.openSystemProps')) + '</button>' +
                            '<button type="button" class="win-btn win-btn-secondary" id="fe-storage-btn">' + bidi(t('settings.system.storageTitle')) + '</button>' +
                        '</div>'
                    ) : (isUserFolder ? '<button type="button" class="win-btn win-btn-secondary" id="fe-new-file-btn">' + bidi(t('explorer.newFileBtn')) + '</button>' : '')) +
                '</div>' +
                (global.Win11Permissions && global.Win11Permissions.isGuest() && isUserFolder ? '<div class="win-card" style="background:var(--win-warning-bg);color:var(--win-warning);margin-bottom:10px;padding:8px 12px;font-size:12.5px">' + bidi(t('explorer.guestEmptyNote')) + '</div>' : '') +
                view.body +
            '</div>';

        hostBody.innerHTML = '<div class="fe-shell">' + sideHtml + contentHtml + '</div>';

        var navBtns = hostBody.querySelectorAll('[data-fe-nav]');
        for (var j = 0; j < navBtns.length; j++) {
            navBtns[j].onclick = function () {
                uiState().currentLocation = this.getAttribute('data-fe-nav');
                render();
            };
        }

        var propsBtn = hostBody.querySelector('#fe-props-btn');
        if (propsBtn) propsBtn.onclick = function () { global.Win11Registry.open('system.about'); };
        var storBtn = hostBody.querySelector('#fe-storage-btn');
        if (storBtn) storBtn.onclick = function () { global.Win11Registry.open('system.storage'); };

        var newFileBtn = hostBody.querySelector('#fe-new-file-btn');
        if (newFileBtn) {
            newFileBtn.onclick = function () {
                var targetFolder = uiState().currentLocation;
                var execCreate = function () {
                    global.Win11State.update(function (d) {
                        if (!d.userFiles) d.userFiles = [];
                        var n = d.userFiles.length + 1;
                        d.userFiles.push({
                            id: 'uf_' + Date.now() + '_' + n,
                            name: 'Document_' + d.currentUser + '_' + n + '.txt',
                            folder: targetFolder,
                            type: 'text',
                            content: 'Isolated file'
                        });
                    }, 'explorer:changed');
                    render();
                };
                if (global.Win11Permissions) {
                    global.Win11Permissions.guard('explorer.modify', execCreate, { targetLabel: t('explorer.newFileBtn') });
                } else {
                    execCreate();
                }
            };
        }

        var setupBtns = hostBody.querySelectorAll('[data-fe-run-setup]');
        for (var sb = 0; sb < setupBtns.length; sb++) {
            setupBtns[sb].onclick = function (e) {
                e.stopPropagation();
                if (global.Win11Dialogs && global.Win11Dialogs.launchSetupWizard) {
                    global.Win11Dialogs.launchSetupWizard();
                }
            };
        }

        var fileCardsHost = hostBody.querySelectorAll('[data-user-file]');
        for (var fc = 0; fc < fileCardsHost.length; fc++) {
            fileCardsHost[fc].ondblclick = function () {
                if (this.getAttribute('data-file-type') === 'installer') {
                    if (global.Win11Dialogs && global.Win11Dialogs.launchSetupWizard) {
                        global.Win11Dialogs.launchSetupWizard();
                    }
                }
            };
        }

        var editBtns = hostBody.querySelectorAll('[data-fe-edit-file]');
        for (var eb = 0; eb < editBtns.length; eb++) {
            editBtns[eb].onclick = function (e) {
                e.stopPropagation();
                var fid = this.getAttribute('data-fe-edit-file');
                var execEdit = function () {
                    var files = global.Win11State.get().userFiles || [];
                    var targetFile = null;
                    for (var i = 0; i < files.length; i++) {
                        if (files[i].id === fid) { targetFile = files[i]; break; }
                    }
                    if (!targetFile) return;
                    global.Win11Dialogs.showCustom({
                        title: targetFile.name,
                        tone: 'info',
                        renderBody: function (w) {
                            w.innerHTML =
                                '<textarea id="fe-edit-area" class="win-input" rows="5" style="width:100%;font-family:monospace">' +
                                    global.Win11Compat.escapeHtml(targetFile.content || '') +
                                '</textarea>';
                        },
                        buttons: [
                            {
                                label: t('app.save'),
                                primary: true,
                                onClick: function (closeDlg) {
                                    var ta = document.getElementById('fe-edit-area');
                                    var newText = ta ? ta.value : (targetFile.content || '');
                                    global.Win11State.update(function (d) {
                                        for (var k = 0; k < (d.userFiles || []).length; k++) {
                                            if (d.userFiles[k].id === fid) {
                                                d.userFiles[k].content = newText;
                                                break;
                                            }
                                        }
                                    }, 'explorer:changed');
                                    closeDlg(true);
                                    render();
                                }
                            },
                            { label: t('app.cancel'), primary: false, value: false }
                        ]
                    });
                };
                if (global.Win11Permissions) {
                    global.Win11Permissions.guard('explorer.modify', execEdit, { targetLabel: t('app.edit') });
                } else {
                    execEdit();
                }
            };
        }
    }

    /**
     * Arabic RTL Simulated File Picker Dialog for Background Browse (Section 2).
     */
    function openImagePicker(onPicked) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();
        var pickerLoc = 'documents';
        var selectedFile = null;
        var errMsg = '';
        global.Win11State.recordWallpaperBrowse('documents', getAddressPath('documents', st.currentUser), null);

        global.Win11Dialogs.showCustom({
            title: t('settings.personalization.browseTitle'),
            tone: 'info',
            wide: true,
            hideFooter: true,
            renderBody: function (wrap, dlg, closeDlg) {
                function drawPicker() {
                    var curSt = global.Win11State.get();
                    var navItems = [
                        { id: 'this-pc', icon: 'thisPc', label: t('explorer.thisPc') },
                        { id: 'desktop', icon: 'wallpaper', label: t('explorer.desktop') },
                        { id: 'documents', icon: 'folderOpen', label: t('explorer.documents') },
                        { id: 'downloads', icon: 'download', label: t('explorer.downloads') },
                        { id: 'pictures', icon: 'wallpaper', label: t('explorer.pictures') }
                    ];
                    var sideHtml = '<div class="fe-sidebar" style="width:170px">';
                    for (var i = 0; i < navItems.length; i++) {
                        sideHtml +=
                            '<button type="button" class="fe-nav-item' + (pickerLoc === navItems[i].id ? ' is-active' : '') + '" data-pk-nav="' + navItems[i].id + '">' +
                                global.Win11Icons.get(navItems[i].icon, 15) +
                                '<span>' + bidi(navItems[i].label) + '</span>' +
                            '</button>';
                    }
                    sideHtml += '</div>';

                    var v = renderLocationContent(pickerLoc, curSt, t, bidi, true, selectedFile ? selectedFile.id : null);
                    wrap.innerHTML =
                        '<div style="font-size:12.5px;color:var(--win-text-secondary);margin-bottom:8px">' + bidi(t('explorer.pickHelpNote')) + '</div>' +
                        '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--win-border-control);border-radius:6px;background:var(--win-surface-subtle);margin-bottom:8px;font-size:12px">' +
                            '<span>' + bidi(t('explorer.addressLabel')) + '</span>' +
                            '<bdi dir="ltr" id="pk-address-bar" style="font-weight:600">' + global.Win11Compat.escapeHtml(getAddressPath(pickerLoc, curSt.currentUser)) + '</bdi>' +
                        '</div>' +
                        '<div class="fe-shell" style="height:260px;border:1px solid var(--win-border-card);border-radius:6px;overflow:hidden">' +
                            sideHtml +
                            '<div class="fe-content" style="overflow-y:auto">' + v.body + '</div>' +
                        '</div>' +
                        '<div id="pk-error-msg" style="color:var(--win-danger);font-size:12px;margin-top:8px;min-height:16px">' + (errMsg ? bidi(errMsg) : '') + '</div>' +
                        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:8px">' +
                            '<div style="font-size:12px;color:var(--win-text-secondary)">' + (selectedFile ? '<bdi dir="ltr">' + global.Win11Compat.escapeHtml(selectedFile.name) + '</bdi>' : '') + '</div>' +
                            '<div style="display:flex;gap:8px">' +
                                '<button type="button" class="win-btn win-btn-secondary" id="pk-cancel-btn">' + bidi(t('app.cancel')) + '</button>' +
                                '<button type="button" class="win-btn win-btn-accent" id="pk-confirm-btn"' + (selectedFile ? '' : ' disabled') + '>' + bidi(t('explorer.openFileBtn')) + '</button>' +
                            '</div>' +
                        '</div>';

                    var navEls = wrap.querySelectorAll('[data-pk-nav], [data-fe-nav]');
                    for (var j = 0; j < navEls.length; j++) {
                        navEls[j].onclick = function () {
                            pickerLoc = this.getAttribute('data-pk-nav') || this.getAttribute('data-fe-nav');
                            selectedFile = null;
                            errMsg = '';
                            global.Win11State.recordWallpaperBrowse(pickerLoc, getAddressPath(pickerLoc, curSt.currentUser), null);
                            drawPicker();
                        };
                    }

                    function confirmSelection(fileObj) {
                        if (!fileObj) return;
                        var cfg = (global.Win11Assessment && global.Win11Assessment.getConfig) ? global.Win11Assessment.getConfig() : null;
                        var penaltyErr = (cfg && cfg.penalty_error !== undefined) ? cfg.penalty_error : 0.25;
                        if (fileObj.type !== 'image' || !fileObj.imgPath) {
                            errMsg = t('explorer.wrongFileType');
                            if (global.Win11Assessment) {
                                global.Win11Assessment.recordMistake(4, 'اختيار ملف غير مدعوم كخلفية', fileObj.name + ' (' + pickerLoc + ')', penaltyErr, 'file');
                            }
                            drawPicker();
                            return;
                        }
                        if (pickerLoc !== 'pictures') {
                            errMsg = t('explorer.wrongFolderWarn');
                            if (global.Win11Assessment) {
                                global.Win11Assessment.recordMistake(4, 'اختيار صورة من مجلد خاطئ', getAddressPath(pickerLoc, curSt.currentUser), penaltyErr, 'folder');
                            }
                            drawPicker();
                            return;
                        }
                        var fullPath = getAddressPath('pictures', curSt.currentUser) + '\\' + fileObj.name;
                        global.Win11State.recordWallpaperBrowse('pictures', fullPath, fileObj);
                        closeDlg(true);
                        if (typeof onPicked === 'function') onPicked(fileObj, fullPath);
                    }

                    var fileCards = wrap.querySelectorAll('[data-user-file]');
                    for (var k = 0; k < fileCards.length; k++) {
                        fileCards[k].onclick = function () {
                            var fid = this.getAttribute('data-user-file');
                            var files = curSt.userFiles || [];
                            for (var x = 0; x < files.length; x++) {
                                if (files[x].id === fid) { selectedFile = files[x]; break; }
                            }
                            errMsg = '';
                            drawPicker();
                        };
                        fileCards[k].ondblclick = function () {
                            var fid = this.getAttribute('data-user-file');
                            var files = curSt.userFiles || [];
                            for (var x = 0; x < files.length; x++) {
                                if (files[x].id === fid) { selectedFile = files[x]; break; }
                            }
                            confirmSelection(selectedFile);
                        };
                    }

                    wrap.querySelector('#pk-cancel-btn').onclick = function () { closeDlg(false); };
                    var okBtn = wrap.querySelector('#pk-confirm-btn');
                    if (okBtn) okBtn.onclick = function () { confirmSelection(selectedFile); };
                }
                drawPicker();
            }
        });
    }

    function open(loc) {
        if (loc) uiState().currentLocation = loc;
        var win = global.Win11WM.getWindow(WIN_ID);
        if (!win) {
            global.Win11WM.open({
                id: WIN_ID,
                appId: 'explorer',
                title: global.Win11I18N.t('explorer.title'),
                icon: 'fileExplorer',
                width: 780,
                height: 500,
                render: function () { render(); }
            });
        } else {
            global.Win11WM.focus(WIN_ID);
            render();
        }
    }

    global.Win11State.on('users:changed', function () { render(); });
    global.Win11I18N.onChange(function () { render(); });

    global.Win11Explorer = {
        open: open,
        refresh: render,
        openImagePicker: openImagePicker
    };
})(window);
