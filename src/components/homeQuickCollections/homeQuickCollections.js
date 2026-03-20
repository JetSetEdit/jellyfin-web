import escapeHtml from 'escape-html';

import itemShortcuts from 'components/shortcuts';
import globalize from 'lib/globalize';

import './homeQuickCollections.scss';

const TILE_COUNT = 5;

const boxSetQuery = {
    IncludeItemTypes: 'BoxSet',
    Recursive: true,
    SortBy: 'SortName',
    SortOrder: 'Ascending',
    Limit: TILE_COUNT,
    ImageTypeLimit: 1,
    EnableImageTypes: 'Primary,Backdrop,Thumb',
    EnableTotalRecordCount: false
};

function getTileImageUrl(apiClient, item) {
    if (item.ImageTags?.Primary) {
        return apiClient.getScaledImageUrl(item.Id, {
            type: 'Primary',
            tag: item.ImageTags.Primary,
            maxWidth: 480
        });
    }
    if (item.BackdropImageTags?.length) {
        return apiClient.getScaledImageUrl(item.Id, {
            type: 'Backdrop',
            tag: item.BackdropImageTags[0],
            maxWidth: 640
        });
    }
    if (item.ImageTags?.Thumb) {
        return apiClient.getScaledImageUrl(item.Id, {
            type: 'Thumb',
            tag: item.ImageTags.Thumb,
            maxWidth: 480
        });
    }
    return '';
}

function renderPlaceholderHtml() {
    const title = globalize.translate('HomeQuickCollectionPlaceholder');
    const hint = globalize.translate('HomeQuickCollectionPlaceholderHint');
    return `<div class="homeQuickTile homeQuickTile--placeholder" role="img" aria-label="${escapeHtml(title)}"><span class="material-icons homeQuickTile-placeholderIcon" aria-hidden="true">collections_bookmark</span><span class="homeQuickTile-title homeQuickTile-title--placeholder">${escapeHtml(title)}</span><span class="homeQuickTile-hint">${escapeHtml(hint)}</span></div>`;
}

function renderTileRow(elem, apiClient, items) {
    const serverId = apiClient.serverInfo()?.Id || '';
    const realItems = (items || []).slice(0, TILE_COUNT);
    const placeholderCount = Math.max(0, TILE_COUNT - realItems.length);

    let html = '<div class="homeQuickCollections-inner">';
    for (const item of realItems) {
        const imgUrl = getTileImageUrl(apiClient, item);
        const name = item.Name || '';
        const style = imgUrl ? ` style="background-image:url('${escapeHtml(imgUrl)}')"` : '';
        const id = item.Id || '';
        const sid = escapeHtml(item.ServerId || serverId);
        const type = escapeHtml(item.Type || 'BoxSet');
        const isFolder = item.IsFolder !== false ? 'true' : 'false';
        html += `<a href="#" class="homeQuickTile itemAction" data-action="link" data-id="${escapeHtml(id)}" data-serverid="${sid}" data-type="${type}" data-isfolder="${isFolder}"${style}>`;
        html += `<span class="homeQuickTile-title">${escapeHtml(name)}</span>`;
        html += '</a>';
    }
    for (let p = 0; p < placeholderCount; p++) {
        html += renderPlaceholderHtml();
    }
    html += '</div>';
    elem.innerHTML = html;
    elem.classList.remove('hide');
    itemShortcuts.on(elem);
}

/**
 * Load up to five BoxSets; remaining slots show non-clickable placeholders.
 * @param {HTMLElement} elem - Container (.homeQuickCollections)
 * @param {import('apiclient').ApiClient} apiClient - API client
 * @returns {Promise<void>}
 */
export function loadQuickCollections(elem, apiClient) {
    if (!elem || !apiClient) return Promise.resolve();

    const userId = apiClient.getCurrentUserId();
    if (!userId) {
        elem.classList.add('hide');
        elem.innerHTML = '';
        return Promise.resolve();
    }

    return apiClient.getItems(userId, boxSetQuery)
        .then(result => {
            const items = result?.Items || [];
            renderTileRow(elem, apiClient, items);
        })
        .catch(err => {
            console.error('[homeQuickCollections] failed to load', err);
            elem.classList.add('hide');
            elem.innerHTML = '';
            itemShortcuts.off(elem);
        });
}

/**
 * @param {HTMLElement} elem - Container
 */
export function destroyQuickCollections(elem) {
    if (!elem) return;
    itemShortcuts.off(elem);
    elem.innerHTML = '';
    elem.classList.add('hide');
}
