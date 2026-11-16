(function (global) {
    'use strict';

    function showUacDenied(message) {
        global.Win11Dialogs.showMessage(
            global.Win11I18N.t('settings.accounts.uacDeniedTitle'),
            message,
            'warning'
        );
    }

    function openAvatarPickerModal(acc, ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var curName = global.Win11State.get().currentUser || '';
        var isSelf = (acc.name.toLowerCase() === curName.toLowerCase());
        var permKey = isSelf ? 'accounts.avatarSelf' : 'accounts.avatarOther';

        var launchPicker = function () {
            if (acc.type === 'Invité') {
                showUacDenied(t('settings.accounts.uacAvatarGuestDenied'));
                return;
            }
            var gallery = global.Win11State.AVATAR_GALLERY || [];
            var chosenSrc = acc.avatarSrc || '';
            var chosenId = acc.avatarId || '';

            global.Win11Dialogs.showCustom({
                title: t('settings.accounts.changeAvatarBtn') + ' — ' + acc.name,
                tone: 'info',
                wide: true,
                renderBody: function (wrap, _dlg, closeDlg) {
                    var html = '<div style="margin-bottom:10px;font-size:13px">' + bidi(t('settings.accounts.chooseAvatar')) + '</div>' +
                        '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">';
                    for (var g = 0; g < gallery.length; g++) {
                        var av = gallery[g];
                        var sel = (chosenId === av.id);
                        html +=
                            '<button type="button" class="win-btn ' + (sel ? 'win-btn-accent' : 'win-btn-secondary') + '" data-av-pick="' + global.Win11Compat.escapeHtml(av.id) + '" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px;min-width:96px">' +
                                '<img src="' + global.Win11Compat.escapeHtml(av.src) + '" alt="' + global.Win11Compat.escapeHtml(av.labelAr) + '" style="width:46px;height:46px;border-radius:50%">' +
                                '<span style="font-size:11.5px">' + bidi(av.labelAr) + '</span>' +
                            '</button>';
                    }
                    html += '</div>' +
                        '<div class="win-card" style="background:var(--win-surface-subtle);padding:10px 12px">' +
                            '<label style="display:block;font-weight:600;margin-bottom:6px">' + bidi(t('settings.accounts.uploadAvatarBtn')) + '</label>' +
                            '<input type="file" id="acc-avatar-upload" accept="image/*" class="win-input">' +
                        '</div>';
                    wrap.innerHTML = html;

                    var pickBtns = wrap.querySelectorAll('[data-av-pick]');
                    for (var pb = 0; pb < pickBtns.length; pb++) {
                        pickBtns[pb].onclick = function () {
                            var aid = this.getAttribute('data-av-pick');
                            for (var x = 0; x < gallery.length; x++) {
                                if (gallery[x].id === aid) {
                                    global.Win11State.setUserAvatar(acc.name, gallery[x].src, gallery[x].id);
                                    closeDlg(true);
                                    ctx.navigate('accounts', 'main');
                                    break;
                                }
                            }
                        };
                    }
                    var fileInp = wrap.querySelector('#acc-avatar-upload');
                    if (fileInp) {
                        fileInp.onchange = function () {
                            var f = this.files && this.files[0];
                            if (!f || typeof FileReader === 'undefined') return;
                            var reader = new FileReader();
                            reader.onload = function (ev) {
                                if (ev.target && ev.target.result) {
                                    global.Win11State.setUserAvatar(acc.name, ev.target.result, 'custom_upload');
                                    closeDlg(true);
                                    ctx.navigate('accounts', 'main');
                                }
                            };
                            reader.readAsDataURL(f);
                        };
                    }
                },
                buttons: [{ label: t('app.close'), primary: false, value: false }]
            });
        };

        if (global.Win11Permissions) {
            global.Win11Permissions.guard(permKey, launchPicker, { targetLabel: t('settings.accounts.changeAvatarBtn') + ' (' + acc.name + ')' });
        } else {
            launchPicker();
        }
    }

    function openAddUserModal(ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var launchCreateModal = function () {
            global.Win11Dialogs.showCustom({
            title: t('settings.accounts.addAccountBtn'),
            tone: 'info',
            renderBody: function (wrap) {
                wrap.innerHTML =
                    '<div style="display:flex;flex-direction:column;gap:10px">' +
                        '<div>' +
                            '<label style="display:block;font-weight:600;margin-bottom:4px">' + bidi(t('settings.accounts.usernameLabel')) + '</label>' +
                            '<input type="text" id="acc-new-name" class="win-input" placeholder="Eleve" dir="ltr">' +
                        '</div>' +
                        '<div>' +
                            '<label style="display:block;font-weight:600;margin-bottom:4px">' + bidi(t('settings.accounts.accountTypeLabel')) + '</label>' +
                            '<select id="acc-new-type" class="win-select">' +
                                '<option value="Standard">' + global.Win11Compat.escapeHtml(t('settings.accounts.standardRole')) + '</option>' +
                                '<option value="Administrateur">' + global.Win11Compat.escapeHtml(t('settings.accounts.adminRole')) + '</option>' +
                            '</select>' +
                        '</div>' +
                        '<div>' +
                            '<label style="display:block;font-weight:600;margin-bottom:4px">' + bidi(t('settings.accounts.passwordLabel')) + '</label>' +
                            '<input type="password" id="acc-new-pass" class="win-input" dir="ltr" autocomplete="new-password" data-lpignore="true" spellcheck="false" autocorrect="off">' +
                        '</div>' +
                        '<div>' +
                            '<label style="display:flex;align-items:center;gap:8px;cursor:pointer">' +
                                '<input type="checkbox" id="acc-new-avatar" checked>' +
                                '<span>' + bidi(t('settings.accounts.avatarLabel')) + '</span>' +
                            '</label>' +
                        '</div>' +
                    '</div>';
            },
            buttons: [
                {
                    label: t('app.save'),
                    primary: true,
                    onClick: function (closeDlg) {
                        var nameEl = document.getElementById('acc-new-name');
                        var typeEl = document.getElementById('acc-new-type');
                        var passEl = document.getElementById('acc-new-pass');
                        var avEl = document.getElementById('acc-new-avatar');
                        var name = nameEl ? nameEl.value.trim() : '';
                        if (!name) return true;
                        if (global.Win11State.getAccount(name)) {
                            showUacDenied('Account "' + name + '" already exists.');
                            return true;
                        }
                        var pass = passEl ? passEl.value : '';
                        global.Win11State.createAccount({
                            name: name,
                            type: typeEl ? typeEl.value : 'Standard',
                            password: pass
                        });
                        if (avEl && avEl.checked && global.Win11State.AVATAR_GALLERY && global.Win11State.AVATAR_GALLERY.length > 1) {
                            var accJustCreated = global.Win11State.getAccount(name);
                            if (accJustCreated) {
                                accJustCreated.avatarSrc = global.Win11State.AVATAR_GALLERY[1].src;
                                accJustCreated.avatarId = global.Win11State.AVATAR_GALLERY[1].id;
                            }
                        }
                        closeDlg(true);
                        ctx.navigate('accounts', 'main');
                    }
                },
                { label: t('app.cancel'), primary: false, value: false }
            ]
        });
        };
        if (global.Win11Permissions) {
            global.Win11Permissions.guard('accounts.create', launchCreateModal, { targetLabel: t('settings.accounts.addAccountBtn') });
        } else {
            launchCreateModal();
        }
    }

    function openEditUserModal(acc, ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var isAdmin = global.Win11State.isCurrentAdmin();
        var isSelf = (acc.name.toLowerCase() === global.Win11State.get().currentUser.toLowerCase());
        var permKey = isSelf ? 'accounts.editSelf' : 'accounts.editOther';

        var launchEditModal = function (authInfo) {
            var hasAdminRight = isAdmin || !!(authInfo && authInfo.elevated);
            global.Win11Dialogs.showCustom({
                title: acc.name + ' — ' + t('app.edit'),
                tone: 'info',
                renderBody: function (wrap) {
                    wrap.innerHTML =
                        '<div style="display:flex;flex-direction:column;gap:10px">' +
                            (hasAdminRight ? (
                                '<div>' +
                                    '<label style="display:block;font-weight:600;margin-bottom:4px">' + bidi(t('settings.accounts.accountTypeLabel')) + '</label>' +
                                    '<select id="edit-acc-type" class="win-select">' +
                                        '<option value="Standard"' + (acc.type === 'Standard' ? ' selected' : '') + '>' + global.Win11Compat.escapeHtml(t('settings.accounts.standardRole')) + '</option>' +
                                        '<option value="Administrateur"' + (acc.type === 'Administrateur' ? ' selected' : '') + '>' + global.Win11Compat.escapeHtml(t('settings.accounts.adminRole')) + '</option>' +
                                    '</select>' +
                                '</div>'
                            ) : '') +
                            '<div>' +
                                '<label style="display:block;font-weight:600;margin-bottom:4px">' + bidi(t('settings.accounts.changePassBtn')) + '</label>' +
                                '<input type="password" id="edit-acc-pass" class="win-input" value="' + global.Win11Compat.escapeHtml(acc.password || '') + '" dir="ltr" autocomplete="new-password" data-lpignore="true" spellcheck="false" autocorrect="off">' +
                            '</div>' +
                            '<label style="display:flex;align-items:center;gap:8px;cursor:pointer">' +
                                '<input type="checkbox" id="edit-acc-avatar"' + (acc.customAvatar ? ' checked' : '') + '>' +
                                '<span>' + bidi(t('settings.accounts.changeAvatarBtn')) + '</span>' +
                            '</label>' +
                        '</div>';
                },
                buttons: [
                    {
                        label: t('app.save'),
                        primary: true,
                        onClick: function (closeDlg) {
                            var tSel = document.getElementById('edit-acc-type');
                            var pInp = document.getElementById('edit-acc-pass');
                            var aChk = document.getElementById('edit-acc-avatar');

                            var newType = tSel ? tSel.value : acc.type;
                            if (acc.type === 'Administrateur' && newType !== 'Administrateur' && global.Win11State.getAdminCount() <= 1) {
                                showUacDenied(t('settings.accounts.uacLastAdmin'));
                                return true;
                            }
                            var pass = pInp ? pInp.value : '';
                            var changedType = (newType !== acc.type);
                            if (changedType && typeof global.Win11State.updateAccountType === 'function') {
                                global.Win11State.updateAccountType(acc.name, newType);
                            }
                            if (acc.type !== 'Invité' && pass !== (acc.password || '') && typeof global.Win11State.setAccountPassword === 'function') {
                                global.Win11State.setAccountPassword(acc.name, pass);
                            }
                            if (aChk && aChk.checked && !acc.avatarSrc && global.Win11State.AVATAR_GALLERY && global.Win11State.AVATAR_GALLERY.length > 0) {
                                global.Win11State.setUserAvatar(acc.name, global.Win11State.AVATAR_GALLERY[0].src, global.Win11State.AVATAR_GALLERY[0].id);
                            }
                            closeDlg(true);
                            ctx.navigate('accounts', 'main');
                        }
                    },
                    { label: t('app.cancel'), primary: false, value: false }
                ]
            });
        };

        if (global.Win11Permissions) {
            global.Win11Permissions.guard(permKey, launchEditModal, { targetLabel: acc.name });
            return;
        }
        if (!isAdmin && !isSelf) {
            showUacDenied(global.Win11State.isCurrentGuest() ? t('settings.accounts.uacDeniedGuest') : t('settings.accounts.uacDeniedStandard'));
            return;
        }
        launchEditModal({ elevated: false });
    }

    global.Win11SettingsApp.register('accounts', function (ctx) {
        var t = global.Win11I18N.t.bind(global.Win11I18N);
        var bidi = global.Win11I18N.bidiHtml;
        var st = global.Win11State.get();
        var curAcc = global.Win11State.getCurrentAccount();

        ctx.container.appendChild(ctx.ui.breadcrumbs(t('settings.nav.accounts')));

        // Security UAC Role Banner for Guest / Standard
        if (global.Win11State.isCurrentGuest() || global.Win11State.isCurrentStandard()) {
            var banner = document.createElement('div');
            banner.className = 'win-card';
            banner.style.background = 'var(--win-warning-bg)';
            banner.style.color = 'var(--win-warning)';
            banner.innerHTML = bidi(global.Win11State.isCurrentGuest() ? t('settings.accounts.uacBannerGuest') : t('settings.accounts.uacBannerStandard'));
            ctx.container.appendChild(banner);
        }

        // Top: Current User Profile (Your info — Avatar, Name, Account Type badge)
        var roleStr = curAcc.type === 'Administrateur' ? t('settings.accounts.adminRole') : (curAcc.type === 'Invité' ? t('settings.accounts.guestRole') : t('settings.accounts.standardRole'));
        var curAvStyle = curAcc.avatarSrc ? 'background:transparent;overflow:hidden' : ('background:' + global.Win11Compat.escapeHtml(curAcc.color || '#0067C0') + ';overflow:hidden');
        var curAvHtml = global.Win11State.getAvatarInnerHtml ? global.Win11State.getAvatarInnerHtml(curAcc) : global.Win11Compat.escapeHtml(curAcc.name.charAt(0).toUpperCase());
        var curCard = document.createElement('div');
        curCard.id = 'acc-section-your-info';
        curCard.className = 'system-hero';
        curCard.innerHTML =
            '<div class="system-hero-pc">' +
                '<div class="settings-user-avatar" style="' + curAvStyle + '">' + curAvHtml + '</div>' +
                '<div>' +
                    '<div style="font-size:17px;font-weight:700"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(curAcc.name) + '</bdi></div>' +
                    '<div style="display:flex;align-items:center;gap:6px;margin-top:2px">' +
                        '<span class="win-badge win-badge-info">' + bidi(roleStr) + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
                '<button type="button" class="win-btn win-btn-secondary" id="acc-own-avatar-btn">' + bidi(t('settings.accounts.changeAvatarBtn')) + '</button>' +
                '<button type="button" class="win-btn win-btn-secondary" id="acc-switch-btn">' + bidi(t('settings.accounts.switchUserBtn')) + '</button>' +
            '</div>';
        ctx.container.appendChild(curCard);

        curCard.querySelector('#acc-own-avatar-btn').onclick = function () { openAvatarPickerModal(curAcc, ctx); };
        curCard.querySelector('#acc-switch-btn').onclick = function () { global.Win11LockScreen.open(); };

        // Middle: Account settings section (Your info / Verify, Sign-in options)
        ctx.container.appendChild(ctx.ui.groupLabel(t('settings.accounts.accountSettingsTitle')));
        var accSettingsWrap = document.createElement('div');
        accSettingsWrap.id = 'acc-section-settings';
        var isCurGuest = global.Win11State.isCurrentGuest();
        accSettingsWrap.innerHTML =
            '<div class="setting-row" id="acc-row-your-info">' +
                '<span class="setting-row-icon">' + global.Win11Icons.get('user', 20) + '</span>' +
                '<div class="setting-row-text">' +
                    '<div class="setting-row-title">' + bidi(t('settings.accounts.verifyTitle')) + '</div>' +
                    '<div class="setting-row-desc">' + bidi(t('settings.accounts.verifyDesc')) + '</div>' +
                '</div>' +
                '<div class="setting-row-action">' +
                    '<span class="win-badge win-badge-success">' + bidi(t('settings.accounts.verifiedStatus')) + '</span>' +
                    '<button type="button" class="win-btn win-btn-secondary" id="acc-verify-btn">' + bidi(t('settings.accounts.verifyBtn')) + '</button>' +
                '</div>' +
            '</div>' +
            '<div class="setting-row" id="acc-row-signin-options">' +
                '<span class="setting-row-icon">' + global.Win11Icons.get('lock', 20) + '</span>' +
                '<div class="setting-row-text">' +
                    '<div class="setting-row-title">' + bidi(t('settings.accounts.signInOptionsTitle')) + '</div>' +
                    '<div class="setting-row-desc">' + bidi(isCurGuest ? t('settings.accounts.guestNoPasswordNote') : t('settings.accounts.signInOptionsDesc')) + '</div>' +
                '</div>' +
                '<div class="setting-row-action">' +
                    '<button type="button" class="win-btn win-btn-secondary" id="acc-signin-pass-btn"' + (isCurGuest ? ' data-guest-no-pass disabled title="' + global.Win11Compat.escapeHtml(t('settings.accounts.guestNoPasswordNote')) + '"' : '') + '>' + bidi(t('settings.accounts.changePassBtn')) + '</button>' +
                '</div>' +
            '</div>';
        ctx.container.appendChild(accSettingsWrap);

        accSettingsWrap.querySelector('#acc-verify-btn').onclick = function () {
            global.Win11Dialogs.showMessage(
                t('settings.accounts.verifyTitle'),
                curAcc.name + ' (' + roleStr + ') — ' + t('settings.accounts.verifiedStatus'),
                'info'
            );
        };
        var signInPassBtn = accSettingsWrap.querySelector('#acc-signin-pass-btn');
        if (signInPassBtn && !isCurGuest) {
            signInPassBtn.onclick = function () { openEditUserModal(curAcc, ctx); };
        }

        // Bottom: Other users section (Add other user + users list + Guest toggle)
        ctx.container.appendChild(ctx.ui.groupLabel(t('settings.accounts.otherUsersTitle')));
        var addOtherRow = document.createElement('div');
        addOtherRow.id = 'acc-section-other-users';
        addOtherRow.className = 'setting-row';
        addOtherRow.innerHTML =
            '<span class="setting-row-icon">' + global.Win11Icons.get('navAccounts', 20) + '</span>' +
            '<div class="setting-row-text">' +
                '<div class="setting-row-title">' + bidi(t('settings.accounts.addOtherUserTitle')) + '</div>' +
                '<div class="setting-row-desc">' + bidi(t('settings.accounts.otherUsersTitle')) + '</div>' +
            '</div>' +
            '<div class="setting-row-action">' +
                '<button type="button" class="win-btn win-btn-accent" id="acc-add-btn">' + bidi(t('settings.accounts.addAccountBtn')) + '</button>' +
            '</div>';
        ctx.container.appendChild(addOtherRow);
        addOtherRow.querySelector('#acc-add-btn').onclick = function () { openAddUserModal(ctx); };

        var listBox = document.createElement('div');
        listBox.id = 'ctrl-accounts-list';
        for (var i = 0; i < st.userAccounts.length; i++) {
            (function (acc) {
                var row = document.createElement('div');
                row.className = 'setting-row';
                var accRole = acc.type === 'Administrateur' ? t('settings.accounts.adminRole') : (acc.type === 'Invité' ? t('settings.accounts.guestRole') : t('settings.accounts.standardRole'));

                var actionsHtml = '';
                if (acc.type === 'Invité') {
                    actionsHtml =
                        '<span class="win-badge ' + (acc.enabled ? 'win-badge-success' : 'win-badge-warning') + '">' + bidi(acc.enabled ? t('app.enabled') : t('app.disabled')) + '</span>' +
                        '<button type="button" class="win-btn win-btn-secondary" data-guest-toggle>' + bidi(acc.enabled ? t('settings.accounts.disableGuest') : t('settings.accounts.enableGuest')) + '</button>' +
                        '<button type="button" class="win-btn win-btn-secondary" data-guest-no-pass disabled title="' + global.Win11Compat.escapeHtml(t('settings.accounts.guestNoPasswordNote')) + '">' + bidi(t('settings.accounts.changePassBtn')) + '</button>';
                } else {
                    actionsHtml =
                        '<button type="button" class="win-btn win-btn-secondary" data-acc-avatar="' + global.Win11Compat.escapeHtml(acc.name) + '">' + bidi(t('settings.accounts.changeAvatarBtn')) + '</button>' +
                        '<button type="button" class="win-btn win-btn-secondary" data-acc-edit="' + global.Win11Compat.escapeHtml(acc.name) + '">' + bidi(t('app.edit')) + '</button>' +
                        '<button type="button" class="win-btn win-btn-danger" data-acc-del="' + global.Win11Compat.escapeHtml(acc.name) + '">' + bidi(t('app.delete')) + '</button>';
                }

                var listAvStyle = acc.avatarSrc ? 'background:transparent;overflow:hidden' : ('background:' + global.Win11Compat.escapeHtml(acc.color || '#0067C0') + ';overflow:hidden');
                var listAvHtml = global.Win11State.getAvatarInnerHtml ? global.Win11State.getAvatarInnerHtml(acc) : global.Win11Compat.escapeHtml(acc.name.charAt(0).toUpperCase());

                row.innerHTML =
                    '<span class="avatar-badge" style="' + listAvStyle + '">' + listAvHtml + '</span>' +
                    '<div class="setting-row-text">' +
                        '<div class="setting-row-title"><bdi dir="ltr">' + global.Win11Compat.escapeHtml(acc.name) + '</bdi></div>' +
                        '<div class="setting-row-desc">' + bidi(accRole) + (acc.type === 'Invité' ? ' — ' + bidi(t('settings.accounts.guestNoPasswordNote')) : (acc.hasPassword ? ' — محمي بكلمة مرور' : '')) + '</div>' +
                    '</div>' +
                    '<div class="setting-row-action">' + actionsHtml + '</div>';

                var gBtn = row.querySelector('[data-guest-toggle]');
                if (gBtn) {
                    gBtn.onclick = function () {
                        var toggleGuest = function () {
                            if (typeof global.Win11State.toggleGuestEnabled === 'function') {
                                global.Win11State.toggleGuestEnabled(!acc.enabled);
                            }
                            ctx.navigate('accounts', 'main');
                        };
                        if (global.Win11Permissions) {
                            global.Win11Permissions.guard('accounts.toggleGuest', toggleGuest, { targetLabel: t('settings.accounts.guestRole') });
                        } else {
                            toggleGuest();
                        }
                    };
                }

                var avBtn = row.querySelector('[data-acc-avatar]');
                if (avBtn) avBtn.onclick = function () { openAvatarPickerModal(acc, ctx); };

                var eBtn = row.querySelector('[data-acc-edit]');
                if (eBtn) eBtn.onclick = function () { openEditUserModal(acc, ctx); };

                var dBtn = row.querySelector('[data-acc-del]');
                if (dBtn) {
                    dBtn.onclick = function () {
                        var tryDelete = function () {
                            var check = global.Win11State.canDeleteAccount(acc);
                            if (!check.ok) {
                                showUacDenied(check.reason);
                                return;
                            }
                            global.Win11Dialogs.showConfirm(t('settings.accounts.deleteAccountBtn'), acc.name, function (ok) {
                                if (!ok) return;
                                if (typeof global.Win11State.deleteAccount === 'function') {
                                    global.Win11State.deleteAccount(acc.name);
                                } else {
                                    global.Win11State.update(function (d) {
                                        d.userAccounts = d.userAccounts.filter(function (u) { return u.name !== acc.name; });
                                    }, 'users:changed');
                                }
                                ctx.navigate('accounts', 'main');
                            }, 'warning');
                        };
                        if (global.Win11Permissions) {
                            global.Win11Permissions.guard('accounts.delete', tryDelete, { targetLabel: acc.name });
                        } else {
                            tryDelete();
                        }
                    };
                }

                listBox.appendChild(row);
            })(st.userAccounts[i]);
        }
        ctx.container.appendChild(listBox);
    });
})(window);

