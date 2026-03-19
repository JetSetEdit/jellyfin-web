import React, { useEffect, useRef, useState } from 'react';

import Page from 'components/Page';

import 'components/homeHero/homeHero.scss';

// Local image for sandbox hero (copied to output via CopyPlugin)
import heroBackdropUrl from 'assets/sandbox/hero-backdrop.jpg';

const BODY_HERO_ACTIVE_CLASS = 'homeHeroActive';
const BODY_SCROLLED_CLASS = 'mainScrolled';
const BODY_SANDBOX_PAGE_CLASS = 'sandboxPage';

/**
 * Sandbox test page for hero and navbar behaviour.
 * - Toggle body.homeHeroActive to see solid vs default navbar (experimental MUI AppBar).
 * - Toggle body.mainScrolled to simulate scrolled state (if we re-add scroll-based nav later).
 * - Mock hero DOM uses the same structure as the real hero so hero CSS can be tested.
 */
const Sandbox = () => {
    const heroRef = useRef<HTMLDivElement>(null);
    const [heroActive, setHeroActive] = useState(true);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        document.body.classList.add(BODY_SANDBOX_PAGE_CLASS);
        return () => document.body.classList.remove(BODY_SANDBOX_PAGE_CLASS);
    }, []);

    useEffect(() => {
        const root = heroRef.current;
        if (!root) return;

        root.classList.add('homePage');
        const page = root;

        const fixedBackdrop = document.createElement('div');
        fixedBackdrop.className = 'homeHeroFixedBackdrop homeHeroFixedBackdrop-visible';
        fixedBackdrop.setAttribute('aria-hidden', 'true');
        fixedBackdrop.style.backgroundImage = `url('${heroBackdropUrl}')`;
        page.insertBefore(fixedBackdrop, page.firstChild);

        const hero = document.createElement('div');
        hero.className = 'homeHero';
        hero.innerHTML = `
            <div class="homeHeroBackdrop" style="background-image: url('${heroBackdropUrl}')"></div>
            <div class="homeHeroGradient"></div>
            <div class="homeHeroContent">
                <h1 class="homeHeroTitle">SANDBOX HERO</h1>
                <p class="homeHeroTagline homeHeroTagline--accent0">Test tagline</p>
                <p class="homeHeroMeta">AU-G • 2025 • Sandbox</p>
                <p class="homeHeroOverview">Use the toggles below to test navbar (solid when homeHeroActive) and hero layout.</p>
                <div class="homeHeroButtons">
                    <button type="button" class="homeHeroBtn homeHeroBtnPlay">Play</button>
                    <button type="button" class="homeHeroBtn homeHeroBtnInfo">Info</button>
                </div>
            </div>
            <div class="homeHeroDots">
                <button type="button" class="homeHeroDot homeHeroDot-active"><span class="homeHeroDot-progress"></span></button>
                <button type="button" class="homeHeroDot"><span class="homeHeroDot-progress"></span></button>
            </div>
        `;
        page.appendChild(hero);

        return () => {
            fixedBackdrop.remove();
            hero.remove();
            root.classList.remove('homePage');
        };
    }, []);

    useEffect(() => {
        document.body.classList.toggle(BODY_HERO_ACTIVE_CLASS, heroActive);
        return () => document.body.classList.remove(BODY_HERO_ACTIVE_CLASS);
    }, [heroActive]);

    useEffect(() => {
        document.body.classList.toggle(BODY_SCROLLED_CLASS, scrolled);
        return () => document.body.classList.remove(BODY_SCROLLED_CLASS);
    }, [scrolled]);

    return (
        <Page id="sandboxPage" title="Sandbox" isBackButtonEnabled={true}>
            <div ref={heroRef} style={{ position: 'relative', minHeight: '100%' }}>
                <div style={{ padding: '2rem', maxWidth: '40em' }}>
                    <h2 style={{ marginTop: 0 }}>Hero &amp; Navbar Sandbox</h2>
                    <p>Use toggles to test <code>body.homeHeroActive</code> and <code>body.mainScrolled</code>. Mock hero is rendered above (same DOM as real hero).</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={heroActive}
                                onChange={(e) => setHeroActive(e.target.checked)}
                            />
                            <span><code>homeHeroActive</code> (solid nav)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={scrolled}
                                onChange={(e) => setScrolled(e.target.checked)}
                            />
                            <span><code>mainScrolled</code></span>
                        </label>
                    </div>
                    {[ 'Next Up', 'Recently Added', 'Continue Watching', 'Trending', 'Sandbox Section 5' ].map((title, i) => (
                        <div key={i} style={{ marginTop: '2.5rem' }}>
                            <h2 style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem' }}>{title}</h2>
                            <div style={{ display: 'flex', gap: '1rem', overflow: 'auto', paddingBottom: '0.5rem' }}>
                                {[ 1, 2, 3, 4, 5 ].map((j) => (
                                    <div
                                        key={j}
                                        style={{
                                            width: 140,
                                            height: 210,
                                            flexShrink: 0,
                                            background: 'rgba(255,255,255,0.08)',
                                            borderRadius: 8
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                    {[ 'Section A', 'Section B', 'Section C', 'Section D', 'Section E' ].map((title, n) => (
                        <div key={title} style={{ padding: '2.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{title}</h3>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
                                Placeholder so you can scroll. Hero fixed backdrop stays in place as you scroll past.
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </Page>
    );
};

export default Sandbox;
