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
const AUTO_ADVANCE_MS = 7000;
const FADE_OUT_MS = 320;
const HOLD_BLACK_MS = 140;
const baseOpts = {
    Fields: 'PrimaryImageAspectRatio,Taglines,Genres,OfficialRating,ProductionYear',
    ImageTypeLimit: 1,
    EnableImageTypes: 'Primary,Backdrop,Thumb,Logo'
};

const TAGLINE_ACCENT_COUNT = 7;

/** Hash item id to 0..TAGLINE_ACCENT_COUNT-1 so the same item always gets the same accent. */
function getTaglineAccentIndex(itemId) {
    if (!itemId) return 0;
    const s = String(itemId);
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h % TAGLINE_ACCENT_COUNT;
}

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
const FIXED_BACKDROP_CLASS = 'homeHeroFixedBackdrop';
const FIXED_GRADIENT_CLASS = 'homeHeroFixedGradient';
const BODY_HERO_ACTIVE_CLASS = 'homeHeroActive';

function ensureFixedBackdrop(elem) {
    if (elem._heroFixedBackdrop) return elem._heroFixedBackdrop;
    const page = elem.closest('.homePage') || elem.closest('.page') || elem.closest('[data-role="page"]') || elem.parentNode?.parentNode;
    if (!page) return null;
    document.body.classList.add(BODY_HERO_ACTIVE_CLASS);
    const div = document.createElement('div');
    div.className = FIXED_BACKDROP_CLASS;
    div.setAttribute('aria-hidden', 'true');
    page.insertBefore(div, page.firstChild);
    const gradientEl = document.createElement('div');
    gradientEl.className = FIXED_GRADIENT_CLASS;
    gradientEl.setAttribute('aria-hidden', 'true');
    div.after(gradientEl);
    elem._heroFixedBackdrop = div;
    elem._heroFixedGradient = gradientEl;
    return div;
}

function removeFixedBackdrop(elem) {
    if (elem?._heroBackdropScrollCleanup) {
        elem._heroBackdropScrollCleanup();
        elem._heroBackdropScrollCleanup = null;
    }
    const div = elem?._heroFixedBackdrop;
    if (div?.parentNode) {
        const next = div.nextElementSibling;
        if (next && next.classList.contains(FIXED_GRADIENT_CLASS)) next.remove();
        div.parentNode.removeChild(div);
    }
    if (elem) {
        elem._heroFixedBackdrop = null;
        elem._heroFixedGradient = null;
        document.body.classList.remove(BODY_HERO_ACTIVE_CLASS);
    }
}

/** Find the first section heading that contains "Recently Added" (e.g. "Recently Added in Movies"). */
function getRecentlyAddedAnchor() {
    const page = document.querySelector('.homePage') || document.querySelector('#homeTab');
    if (!page) return null;
    const titles = page.querySelectorAll('.sections .sectionTitle, .sections h2.sectionTitle');
    for (const el of titles) {
        if (el.textContent && el.textContent.includes('Recently Added')) return el;
    }
    return null;
}

/**
 * Fade the fixed backdrop to 0% opacity based on scroll depth once we reach the "Recently Added" section.
 * @param {HTMLElement} elem - Hero container (has _heroFixedBackdrop)
 */
function setupBackdropScrollFade(elem) {
    const backdrop = elem._heroFixedBackdrop;
    const gradient = elem._heroFixedGradient;
    if (!backdrop) return;

    // Use inline opacity only while scroll-fading. At full visibility, clear inline so
    // .homeHeroFixedBackdrop-visible can animate 0→1 on first paint and .homeHeroFixedBackdrop-transitioning can win via !important during slides.
    const setOpacity = (value) => {
        const n = parseFloat(value);
        if (Number.isNaN(n)) return;
        if (n >= 1) {
            backdrop.style.removeProperty('opacity');
            if (gradient) gradient.style.removeProperty('opacity');
        } else {
            backdrop.style.opacity = String(n);
            if (gradient) gradient.style.opacity = String(n);
        }
    };

    let anchorEl = null;

    function updateBackdropOpacity() {
        const anchor = anchorEl || getRecentlyAddedAnchor();
        if (anchor) anchorEl = anchor;

        const viewportHeight = window.innerHeight;
        const scrollY = window.scrollY ?? window.pageYOffset;

        if (!anchor) {
            const thresholdStart = viewportHeight * 0.5;
            const thresholdEnd = viewportHeight * 1.2;
            const t = Math.max(0, Math.min(1, (scrollY - thresholdStart) / (thresholdEnd - thresholdStart)));
            setOpacity(String(1 - t));
            return;
        }

        const rect = anchor.getBoundingClientRect();
        const anchorTop = rect.top + scrollY;
        const fadeStart = anchorTop - viewportHeight * 0.5;
        const fadeEnd = anchorTop - viewportHeight * 0.1;
        const t = fadeEnd <= fadeStart ? 1 : Math.max(0, Math.min(1, (scrollY - fadeStart) / (fadeEnd - fadeStart)));
        setOpacity(String(1 - t));
    }

    const onScroll = () => {
        requestAnimationFrame(updateBackdropOpacity);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateBackdropOpacity();

    elem._heroBackdropScrollCleanup = () => {
        window.removeEventListener('scroll', onScroll);
        backdrop.style.removeProperty('opacity');
        if (gradient) gradient.style.removeProperty('opacity');
    };
}

export function loadHero(elem, apiClient) {
    if (!elem || !apiClient) return Promise.resolve();

    elem.classList.remove('hide');

    return getFeaturedItems(apiClient)
        .then(items => {
            if (!items || items.length === 0) {
                renderEmptyBanner(elem);
                removeFixedBackdrop(elem);
                return;
            }
            ensureFixedBackdrop(elem);
            // Carousel first so first slide sets backdrop + .visible before scroll fade runs (otherwise inline opacity 1 blocks the fade-in).
            renderCarousel(elem, apiClient, items);
            setupBackdropScrollFade(elem);
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

    // Request 16:7 fill so server center-crops once at hero aspect ratio
const backdropUrl = getItemBackdropImageUrl(apiClient, item, { fillWidth: 1920, fillHeight: 840 });
    const logoUrl = getItemLogoUrl(apiClient, item);
    const title = item.SeriesName || item.Name || '';
    const subtitle = item.SeriesName ? item.Name : '';
    const tagline = item.Taglines?.[0] || '';
    const overview = item.Overview || '';
    const overviewShort = overview.length > 180 ? overview.substring(0, 180).trim() + '…' : overview;
    const positionTicks = item.UserData?.PlaybackPositionTicks || 0;
    const metaParts = [item.OfficialRating, item.ProductionYear, ...(item.Genres || [])].filter(Boolean);
    const metaRow = metaParts.join(' • ');

    const playLabel = globalize.translate('Play');
    const infoLabel = globalize.translate('ButtonInfo');

    const fixedBackdrop = elem._heroFixedBackdrop;
    if (fixedBackdrop) {
        fixedBackdrop.style.backgroundImage = backdropUrl ? `url('${escapeHtml(backdropUrl)}')` : '';
        fixedBackdrop.classList.toggle('homeHeroFixedBackdrop-visible', !!backdropUrl);
        if (backdropEl) {
            backdropEl.classList.remove('homeHeroBackdrop-empty');
            backdropEl.style.backgroundImage = ''; // fixed layer shows image; hero backdrop stays transparent
        }
        // Restart Ken Burns zoom on every slide
        fixedBackdrop.classList.remove('homeHeroFixedBackdrop-zooming');
        fixedBackdrop.offsetHeight; // force reflow so animation restarts
        fixedBackdrop.classList.add('homeHeroFixedBackdrop-zooming');
    } else if (backdropEl) {
        backdropEl.classList.remove('homeHeroBackdrop-empty');
        backdropEl.style.backgroundImage = backdropUrl ? `url('${escapeHtml(backdropUrl)}')` : '';
    }

    let inner = '';
    if (logoUrl) {
        inner += '<img class="homeHeroLogo" src="' + escapeHtml(logoUrl) + '" alt="' + escapeHtml(title) + '" loading="eager" />';
    } else {
        inner += '<h1 class="homeHeroTitle">' + escapeHtml(title) + (subtitle ? ' <span class="homeHeroSubtitle">' + escapeHtml(subtitle) + '</span>' : '') + '</h1>';
    }
    if (tagline) {
        const accentIndex = getTaglineAccentIndex(item.Id);
        inner += '<p class="homeHeroTagline homeHeroTagline--accent' + accentIndex + '">' + escapeHtml(tagline) + '</p>';
    }
    if (metaRow) {
        inner += '<p class="homeHeroMeta">' + escapeHtml(metaRow) + '</p>';
    }
    if (overviewShort) {
        inner += '<p class="homeHeroOverview">' + escapeHtml(overviewShort) + '</p>';
    }
    inner += '<div class="homeHeroButtons">';
    inner += '<button type="button" is="emby-button" class="homeHeroBtn homeHeroBtnPlay raised" data-action="' + ItemAction.PlayMenu + '" title="' + escapeHtml(playLabel) + '"><span class="material-icons play_arrow" aria-hidden="true"></span><span>' + escapeHtml(playLabel) + '</span></button>';
    inner += '<button type="button" is="emby-button" class="homeHeroBtn homeHeroBtnInfo flat" data-action="' + ItemAction.Link + '" title="' + escapeHtml(infoLabel) + '"><span class="material-icons info" aria-hidden="true"></span><span>' + escapeHtml(infoLabel) + '</span></button>';
    inner += '</div>';

    contentEl.innerHTML = inner;
    // Trigger slide-up animation on new children (class already present after first call)
    contentEl.classList.add('homeHeroContent-entering');
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
        const progress = document.createElement('span');
        progress.className = 'homeHeroDot-progress';
        dot.appendChild(progress);
        dotsContainer.appendChild(dot);
    }

    function setActiveDotProgressDuration() {
        const activeDot = elem.querySelector('.homeHeroDot-active');
        const progressEl = activeDot?.querySelector('.homeHeroDot-progress');
        if (!progressEl) return;
        progressEl.style.animation = 'none';
        progressEl.offsetHeight; // force reflow so animation restarts
        progressEl.style.animation = `homeHeroDotProgress ${AUTO_ADVANCE_MS}ms linear forwards`;
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
        const newIndex = ((index % len) + len) % len;
        if (newIndex === state.currentIndex) {
            setSlideContent(elem, state.apiClient, state.items[state.currentIndex]);
            elem.querySelectorAll('.homeHeroDot').forEach((d, i) => d.classList.toggle('homeHeroDot-active', i === state.currentIndex));
            setActiveDotProgressDuration();
            return;
        }
        state.currentIndex = newIndex;
        elem.classList.add('is-transitioning');
        const fixedBackdrop = elem._heroFixedBackdrop;
        const fixedGradient = elem._heroFixedGradient;
        if (fixedBackdrop) fixedBackdrop.classList.add('homeHeroFixedBackdrop-transitioning');
        if (fixedGradient) fixedGradient.classList.add('homeHeroFixedGradient-transitioning');
        setTimeout(() => {
            setSlideContent(elem, state.apiClient, state.items[state.currentIndex]);
            elem.querySelectorAll('.homeHeroDot').forEach((d, i) => d.classList.toggle('homeHeroDot-active', i === state.currentIndex));
            setActiveDotProgressDuration();
            if (fixedBackdrop) fixedBackdrop.classList.remove('homeHeroFixedBackdrop-transitioning');
            if (fixedGradient) fixedGradient.classList.remove('homeHeroFixedGradient-transitioning');
            elem.classList.remove('is-transitioning');
        }, FADE_OUT_MS + HOLD_BLACK_MS);
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

    function stopAutoAdvance() {
        if (state.timer) clearInterval(state.timer);
        state.timer = null;
    }
    function onMouseLeave() {
        if (state.items.length > 1) resetAutoAdvance();
    }

    elem.addEventListener('mouseenter', stopAutoAdvance);
    elem.addEventListener('mouseleave', onMouseLeave);
    state.onMouseLeave = onMouseLeave;
    state.stopAutoAdvance = stopAutoAdvance;

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
    if (state) {
        if (state.timer) clearInterval(state.timer);
        if (state.stopAutoAdvance) elem.removeEventListener('mouseenter', state.stopAutoAdvance);
        if (state.onMouseLeave) elem.removeEventListener('mouseleave', state.onMouseLeave);
    }
    elem._heroCarousel = null;
    removeFixedBackdrop(elem);
    itemShortcuts.off(elem);
    elem.innerHTML = '';
    elem.classList.add('hide');
}
