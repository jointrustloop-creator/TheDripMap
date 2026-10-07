import { describe, expect, it } from 'vitest';
import { bestName, decodeEntities } from '../src/lib/discovery-firecrawl';
import { notCanadianPageReason } from '../src/lib/discovery-guard';

// Cases are the real rows that went live with page-title names (2026-10-06).
const page = (title: string, extra = '') => `<html><head><title>${title}</title>${extra}</head><body></body></html>`;
const og = (name: string) => `<meta property="og:site_name" content="${name}">`;
const ld = (name: string) => `<script type="application/ld+json">{"@context":"https://schema.org","@type":"MedicalClinic","name":"${name}"}</script>`;

describe('discovery listing names', () => {
  it('decodes the entities page titles carry, and drops en dashes', () => {
    expect(decodeEntities('Botox, Wellness &amp; HRT St. Catharines')).toBe('Botox, Wellness & HRT St. Catharines');
    expect(decodeEntities('IV Therapy Naturopath &#8211; Milton')).toBe('IV Therapy Naturopath - Milton');
    expect(decodeEntities('Canada&#039;s Smartest')).toBe("Canada's Smartest");
  });
  it('prefers the brand over a generic or service-phrase title', () => {
    expect(bestName(page('Home | Echo Health, IV Iron &amp; Vitamins Victoria', og('Echo Health')), 'https://www.echohealth.ca')).toBe('Echo Health');
    expect(bestName(page('Massage Therapy Victoria, BC - Geometry Integrated Health', og('Geometry Integrated Health')), 'https://geometryvictoria.ca')).toBe('Geometry Integrated Health');
    expect(bestName(page('Vancouver Naturopathic Doctors - Noble Naturopathic', og('Noble Naturopathic')), 'https://noblenaturopathic.com')).toBe('Noble Naturopathic');
    expect(bestName(page('Medical Aesthetics &amp; Laser Clinic in St. Catharines, ON', ld('ClaraDerma')), 'https://www.claraderma.com')).toBe('ClaraDerma');
  });
  it('does not take a slogan og:site_name over the real name in the title', () => {
    expect(bestName(page('SOLSKIN SPA | Botox, Fillers &amp; Laser Hair Removal in GTA', og('Canada&#039;s Smartest Aesthetics Choice')), 'https://solskinspa.com')).toBe('SOLSKIN SPA');
  });
  it('keeps a hyphenated brand whole', () => {
    expect(bestName(page('Multidisciplinary Neurology Treatment Center', ld('Clinique Neuro-Outaouais')), 'https://www.neuro-outaouais.com')).toBe('Clinique Neuro-Outaouais');
  });
});

describe('page-text country check', () => {
  it('rejects pages that price in pounds or list a UK number', () => {
    expect(notCanadianPageReason('Packages from £299 per session')).toMatch(/pounds/);
    expect(notCanadianPageReason('Call us on +44 7457 402789')).toMatch(/\+44/);
    expect(notCanadianPageReason('Phone +61 2 9999 0000')).toMatch(/Australian/);
  });
  it('passes a Canadian page', () => {
    expect(notCanadianPageReason('Myers Cocktail $165. Call (604) 904-8888, Vancouver BC V6J 1G5')).toBeNull();
  });
});
