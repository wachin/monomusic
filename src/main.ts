import './style.css';
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import es from './locales/es.json';
import { convert } from './fixer.mjs';

i18next
  .use(LanguageDetector)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

function updateTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = i18next.t(key);
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && el instanceof HTMLTextAreaElement) {
      el.placeholder = i18next.t(key);
    }
  });
  document.querySelectorAll('[data-i18n-value]').forEach((el) => {
    const key = el.getAttribute('data-i18n-value');
    if (key && 'value' in el) {
      (el as HTMLInputElement).value = i18next.t(key);
    }
  });
}

function changeLanguage(lang: string) {
  i18next.changeLanguage(lang).then(() => {
    updateTranslations();
  });
}

function convertInput() {
  const input = document.getElementById('text-input') as HTMLTextAreaElement | null;
  const output = document.getElementById('output') as HTMLDivElement | null;
  if (input && output) {
    output.innerHTML = convert(input.value);
  }
}

function init() {
  updateTranslations();

  // Convert the built-in example on first load, like the original page did.
  const output = document.getElementById('output');
  if (output && !output.querySelector('.highlight')) {
    output.innerHTML = convert(output.textContent || '');
  }

  const form = document.getElementById('converter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      convertInput();
    });
  }

  // Language switcher
  const langSelect = document.getElementById('lang-select') as HTMLSelectElement | null;
  if (langSelect) {
    langSelect.value = i18next.language || 'en';
    langSelect.addEventListener('change', (e) => {
      changeLanguage((e.target as HTMLSelectElement).value);
    });
  }

  // Font switcher
  const fontSelect = document.getElementById('font-select') as HTMLSelectElement | null;
  if (fontSelect) {
    fontSelect.addEventListener('change', (e) => {
      const font = (e.target as HTMLSelectElement).value;
      document.documentElement.style.setProperty(
        '--main-font',
        font === 'monomusicmono' ? 'monomusicmono' : 'monomusicregular'
      );
      document.body.classList.toggle('font-mono', font === 'monomusicmono');
    });
  }

  // Font size controls
  const plusBtn = document.getElementById('font-plus');
  const minusBtn = document.getElementById('font-minus');
  if (plusBtn) {
    plusBtn.addEventListener('click', () => {
      const size = parseInt(window.getComputedStyle(document.body).fontSize);
      document.body.style.fontSize = size + 1 + 'px';
    });
  }
  if (minusBtn) {
    minusBtn.addEventListener('click', () => {
      const size = parseInt(window.getComputedStyle(document.body).fontSize);
      document.body.style.fontSize = size - 1 + 'px';
    });
  }

  // Title toggle
  const titleBtn = document.getElementById('title-btn');
  if (titleBtn) {
    titleBtn.addEventListener('click', () => {
      const titleDiv = document.getElementById('document-title');
      if (titleDiv) {
        titleDiv.classList.toggle('hidden');
      }
    });
  }

  // Adsu button: add the maybe missing space(s) after add and sus chords
  const adsuBtn = document.getElementById('adsu-btn');
  if (adsuBtn) {
    adsuBtn.addEventListener('click', () => {
      document.querySelectorAll('#output .highlight').forEach((el) => {
        let text = el.textContent || '';
        text = text.replace(/\uE021\uE022\uE021\uE002/g, '\uE021\uE022\uE021\uE002 '); // sus2
        text = text.replace(/\uE021\uE022\uE021\uE004/g, '\uE021\uE022\uE021\uE004 '); // sus4
        text = text.replace(/\uE01B\uE01C\uE01C\uE002/g, '\uE01B\uE01C\uE01C\uE002 '); // add2
        text = text.replace(/\uE01B\uE01C\uE01C\uE004/g, '\uE01B\uE01C\uE01C\uE004 '); // add4
        text = text.replace(/\uE01B\uE01C\uE01C\uE006/g, '\uE01B\uE01C\uE01C\uE006 '); // add6
        text = text.replace(/\uE01B\uE01C\uE01C\uE009/g, '\uE01B\uE01C\uE01C\uE009 '); // add9
        text = text.replace(/\uE01B\uE01C\uE01C\uE001\uE001/g, '\uE01B\uE01C\uE01C\uE001\uE001 '); // add11
        text = text.replace(/\uE01B\uE01C\uE01C\uE001\uE003/g, '\uE01B\uE01C\uE01C\uE001\uE003 '); // add13
        el.textContent = text;
      });
    });
  }

  // B to H button (Danish notation)
  const btohBtn = document.getElementById('btoh-btn');
  if (btohBtn) {
    btohBtn.addEventListener('click', () => {
      document.querySelectorAll('#output .highlight').forEach((el) => {
        el.textContent = (el.textContent || '').replace(/B/g, 'H');
      });
    });
  }

  // Done button: focus mode
  const doneBtn = document.getElementById('done-btn');
  if (doneBtn) {
    doneBtn.addEventListener('click', () => {
      document.body.classList.add('focus-mode');
    });
  }

  const closeBtn = document.getElementById('close-focus');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.body.classList.remove('focus-mode');
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.body.classList.remove('focus-mode');
    }
  });

  // Color pickers
  const chordColor = document.getElementById('chord-color') as HTMLSelectElement | null;
  if (chordColor) {
    chordColor.addEventListener('change', () => {
      document.documentElement.style.setProperty('--chord-color', chordColor.value);
    });
  }

  const textColor = document.getElementById('text-color') as HTMLSelectElement | null;
  if (textColor) {
    textColor.addEventListener('change', () => {
      document.documentElement.style.setProperty('--text-color', textColor.value);
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
