import escapeHtml from 'escape-html';

import { ItemAction } from 'constants/itemAction';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import itemShortcuts from 'components/shortcuts';
import { getItemBackdropImageUrl } from 'utils/jellyfin-apiclient/backdropImage';

import 'elements/emby-button/emby-button';

/** Get title logo URL for series/movie when available. */
function getItemLogoUrl(apiClient, item) {
    if (!item) return undefined;
    if (item.ImageTags?.Logo && item.Id) {
        return apiClient.getScaledImageUrl(item.Id, { type: 'Logo', tag: item.ImageTags.Logo, maxHeight: 280 });
    }
    if (item.ParentLogoImageTag && item.ParentLogoItemId) {
        return apiClient.getScaledImageUrl(item.ParentLogoItemId, { type: 'Logo', tag: item.ParentLogoImageTag, maxHeight: 280 });
    }
    return undefined;
}

import './homeHero.scss';

const CAROUSEL_SIZE = 5;
const AUTO_ADVANCE_MS = 6000;
const baseOpts = {
    Fields: 'PrimaryImageAspectRatio',
    ImageTypeLimit: 1,
    EnableImageTypes: 'Primary,Backdrop,Thumb,Logo'
};

/** True if item has logo metadata (own logo or parent/series logo). */
function hasLogo(item) {
    return !!(item?.ImageTags?.Logo || item?.ParentLogoImageTag);
}

/**
 * Fetch featured items for carousel: only recently added, only items with logos, deduped by SeriesId/Id, max 5.
 * @param {ApiClient} apiClient - API client
 * @returns {Promise<BaseItemDto[]>}
 */
function getFeaturedItems(apiClient) {
    return apiClient.getLatestItems({ ...baseOpts, Limit: 40 })
        .then(list => {
            if (!Array.isArray(list)) return [];
            const seen = new Set();
            return list
                .filter(item => {
                    if (!item?.Id) return false;
                    if (!hasLogo(item)) return false;
                    const key = (item.Type === 'Episode' && item.SeriesId) ? item.SeriesId : item.Id;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                })
                .slice(0, CAROUSEL_SIZE);
        });
}

/**
 * Render the hero banner (carousel or single). Always shows the banner; if no items, shows empty state.
 * @param {HTMLElement} elem - Container element
 * @param {ApiClient} apiClient - API client
 * @returns {Promise<void>}
 */
export function loadHero(elem, apiClient) {
    if (!elem || !apiClient) return Promise.resolve();

    elem.classList.remove('hide');

    return getFeaturedItems(apiClient)
        .then(items => {
            if (!items || items.length === 0) {
                renderEmptyBanner(elem);
                return;
            }
            renderCarousel(elem, apiClient, items);
        })
        .catch(err => {
            console.error('[homeHero] failed to load', err);
            renderEmptyBanner(elem);
        });
}

function renderEmptyBanner(elem) {
    elem.innerHTML = '<div class="homeHeroBackdrop homeHeroBackdrop-empty"></div><div class="homeHeroGradient"></div>';
    itemShortcuts.off(elem);
}

function setSlideContent(elem, apiClient, item) {
    const backdropEl = elem.querySelector('.homeHeroBackdrop');
    const contentEl = elem.querySelector('.homeHeroContent');
    if (!contentEl || !item) return;

    const backdropUrl = getItemBackdropImageUrl(apiClient, item, { maxWidth: 1920 });
    const logoUrl = getItemLogoUrl(apiClient, item);
    const title = item.SeriesName || item.Name || '';
    const subtitle = item.SeriesName ? item.Name : '';
    const overview = item.Overview || '';
    const overviewShort = overview.length > 180 ? overview.substring(0, 180).trim() + '…' : overview;
    const positionTicks = item.UserData?.PlaybackPositionTicks || 0;

    const playLabel = globalize.translate('Play');
    const infoLabel = globalize.translate('ButtonInfo');

    if (backdropEl) {
        backdropEl.classList.remove('homeHeroBackdrop-empty');
        backdropEl.style.backgroundImage = backdropUrl ? `url('${escapeHtml(backdropUrl)}')` : '';
    }

    let inner = '';
    if (logoUrl) {
        inner += '<img class="homeHeroLogo" src="' + escapeHtml(logoUrl) + '" alt="' + escapeHtml(title) + '" loading="eager" />';
    } else {
        inner += '<h1 class="homeHeroTitle">' + escapeHtml(title) + (subtitle ? ' <span class="homeHeroSubtitle">' + escapeHtml(subtitle) + '</span>' : '') + '</h1>';
    }
    if (overviewShort) {
        inner += '<p class="homeHeroOverview">' + escapeHtml(overviewShort) + '</p>';
    }
    inner += '<div class="homeHeroButtons">';
    inner += '<button type="button" is="emby-button" class="homeHeroBtn homeHeroBtnPlay raised" data-action="' + ItemAction.PlayMenu + '" title="' + escapeHtml(playLabel) + '"><span class="material-icons play_arrow" aria-hidden="true"></span><span>' + escapeHtml(playLabel) + '</span></button>';
    inner += '<button type="button" is="emby-button" class="homeHeroBtn homeHeroBtnInfo flat" data-action="' + ItemAction.Link + '" title="' + escapeHtml(infoLabel) + '"><span class="material-icons info" aria-hidden="true"></span><span>' + escapeHtml(infoLabel) + '</span></button>';
    inner += '</div>';

    contentEl.innerHTML = inner;
    contentEl.setAttribute('data-id', item.Id);
    contentEl.setAttribute('data-serverid', item.ServerId || apiClient.serverInfo()?.Id);
    contentEl.setAttribute('data-type', item.Type || '');
    contentEl.setAttribute('data-mediatype', item.MediaType || '');
    contentEl.setAttribute('data-isfolder', item.IsFolder ? 'true' : 'false');
    contentEl.setAttribute('data-positionticks', String(positionTicks || 0));
    if (item.ChannelId) contentEl.setAttribute('data-channelid', item.ChannelId);
    else contentEl.removeAttribute('data-channelid');
}

function renderCarousel(elem, apiClient, items) {
    const playLabel = globalize.translate('Play');
    const infoLabel = globalize.translate('ButtonInfo');

    let html = '';
    html += '<div class="homeHeroBackdrop"></div>';
    html += '<div class="homeHeroGradient"></div>';
    html += '<button type="button" class="homeHeroArrow homeHeroArrowPrev" aria-label="Previous"><span class="material-icons" aria-hidden="true">chevron_left</span></button>';
    html += '<button type="button" class="homeHeroArrow homeHeroArrowNext" aria-label="Next"><span class="material-icons" aria-hidden="true">chevron_right</span></button>';
    html += '<div class="homeHeroContent itemAction">';
    html += '<h1 class="homeHeroTitle"></h1><p class="homeHeroOverview"></p>';
    html += '<div class="homeHeroButtons">';
    html += '<button type="button" is="emby-button" class="homeHeroBtn homeHeroBtnPlay raised" data-action="' + ItemAction.PlayMenu + '" title="' + escapeHtml(playLabel) + '"><span class="material-icons play_arrow" aria-hidden="true"></span><span>' + escapeHtml(playLabel) + '</span></button>';
    html += '<button type="button" is="emby-button" class="homeHeroBtn homeHeroBtnInfo flat" data-action="' + ItemAction.Link + '" title="' + escapeHtml(infoLabel) + '"><span class="material-icons info" aria-hidden="true"></span><span>' + escapeHtml(infoLabel) + '</span></button>';
    html += '</div></div>';
    html += '<div class="homeHeroDots"></div>';

    elem.innerHTML = html;

    const dotsContainer = elem.querySelector('.homeHeroDots');
    for (let i = 0; i < items.length; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'homeHeroDot' + (i === 0 ? ' homeHeroDot-active' : '');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.dataset.index = String(i);
        dotsContainer.appendChild(dot);
    }

    const state = {
        items,
        apiClient,
        currentIndex: 0,
        timer: null
    };
    elem._heroCarousel = state;

    function goTo(index) {
        const len = state.items.length;
        state.currentIndex = ((index % len) + len) % len;
        setSlideContent(elem, state.apiClient, state.items[state.currentIndex]);
        elem.querySelectorAll('.homeHeroDot').forEach((d, i) => d.classList.toggle('homeHeroDot-active', i === state.currentIndex));
    }

    function next() {
        goTo(state.currentIndex + 1);
        resetAutoAdvance();
    }
    function prev() {
        goTo(state.currentIndex - 1);
        resetAutoAdvance();
    }

    function resetAutoAdvance() {
        if (state.timer) clearInterval(state.timer);
        state.timer = setInterval(next, AUTO_ADVANCE_MS);
    }

    elem.querySelector('.homeHeroArrowPrev').addEventListener('click', prev);
    elem.querySelector('.homeHeroArrowNext').addEventListener('click', next);
    elem.querySelectorAll('.homeHeroDot').forEach(dot => {
        dot.addEventListener('click', () => {
            goTo(parseInt(dot.dataset.index, 10));
            resetAutoAdvance();
        });
    });

    goTo(0);
    if (items.length > 1) resetAutoAdvance();

    itemShortcuts.on(elem);
}

/**
 * Clear hero content and remove shortcut listeners.
 * @param {HTMLElement} elem - Container element
 */
export function destroyHero(elem) {
    if (!elem) return;
    const state = elem._heroCarousel;
    if (state && state.timer) clearInterval(state.timer);
    elem._heroCarousel = null;
    itemShortcuts.off(elem);
    elem.innerHTML = '';
    elem.classList.add('hide');
}
