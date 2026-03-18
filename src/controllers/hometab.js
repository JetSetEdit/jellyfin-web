import * as userSettings from '../scripts/settings/userSettings';
import focusManager from '../components/focusManager';
import homeSections from '../components/homesections/homesections';
import { loadHero, destroyHero } from '../components/homeHero/homeHero';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import '../elements/emby-itemscontainer/emby-itemscontainer';

class HomeTab {
    constructor(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = ServerConnections.currentApiClient();
        this.sectionsContainer = view.querySelector('.sections');
        this.heroContainer = view.querySelector('.homeHero');
        // If this view has .sections but no .homeHero (e.g. different layout/template), inject hero container
        if (this.sectionsContainer && !this.heroContainer) {
            this.heroContainer = document.createElement('div');
            this.heroContainer.className = 'homeHero';
            this.heroContainer.id = 'homeHero';
            this.sectionsContainer.parentNode.insertBefore(this.heroContainer, this.sectionsContainer);
        }
        view.querySelector('.sections').addEventListener('settingschange', onHomeScreenSettingsChanged.bind(this));
    }
    onResume(options) {
        if (this.sectionsRendered) {
            const sectionsContainer = this.sectionsContainer;

            if (sectionsContainer) {
                return homeSections.resume(sectionsContainer, options);
            }

            return Promise.resolve();
        }

        const view = this.view;
        const apiClient = this.apiClient;
        this.destroyHomeSections();
        this.sectionsRendered = true;

        const heroPromise = this.heroContainer ? loadHero(this.heroContainer, apiClient) : Promise.resolve();

        return heroPromise
            .then(() => apiClient.getCurrentUser())
            .then(user => homeSections.loadSections(view.querySelector('.sections'), apiClient, user, userSettings))
            .then(() => {
                if (options.autoFocus) {
                    focusManager.autoFocus(view);
                }
            }).catch(err => {
                console.error(err);
            });
    }
    onPause() {
        const sectionsContainer = this.sectionsContainer;

        if (sectionsContainer) {
            homeSections.pause(sectionsContainer);
        }
    }
    destroy() {
        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.destroyHomeSections();
        this.sectionsContainer = null;
    }
    destroyHomeSections() {
        if (this.heroContainer) {
            destroyHero(this.heroContainer);
        }
        const sectionsContainer = this.sectionsContainer;

        if (sectionsContainer) {
            homeSections.destroySections(sectionsContainer);
        }
    }
}

function onHomeScreenSettingsChanged() {
    this.sectionsRendered = false;

    if (!this.paused) {
        this.onResume({
            refresh: true
        });
    }
}

export default HomeTab;
