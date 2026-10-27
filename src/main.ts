import './style.css';
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import es from './locales/es.json';

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

function nl2br(str: string, is_xhtml: boolean = true): string {
  const breakTag = is_xhtml ? '<br />' : '<br>';
  return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

function chordHighlight() {
  const textElements = document.querySelectorAll('.text');
  textElements.forEach((el) => {
    let text = el.textContent || '';
    text = text.replace(/b\!/g, "b");
    text = text.replace(/\u0023\!/g, "#");
    text = text.replace(/\u1D6AB/g, "\u0394");
    text = text.replace(/A\!/g, "Δ");
    text = text.replace(/\u266F/g, "#");
    text = text.replace(/\u266D/g, "b");
    text = text.replace(/\u00B0/g, "o");
    text = text.replace(/\|/g, "l!");
    el.textContent = text;
  });

  // Simple highlighting - mark chords
  const patterns = [
    /\/C#|\/D#|\/E#|\/F#|\/G#|\/A#|\/B#|\/C♭|\/D♭|\/E♭|\/F♭|\/G♭|\/A♭|\/B♭/g,
    /m7b5|dim7|maj7|M7|Δ7|m7|sus[24]|add[0-9]+|aug|\+/g,
    /[A-H][#b]?(?:m|maj|dim|aug|sus|add|ø|o|Δ)?[0-9]*(?:[#b][0-9]+)*(?:\/[A-H][#b]?)?/g
  ];

  textElements.forEach((el) => {
    let html = el.innerHTML;
    // Wrap chord patterns
    html = html.replace(/([A-H][#b]?(?:m|maj|ma|dim|aug|\+|sus[24]|add[0-9]+|ø|o|Δ|alt|7|9|11|13)?[#b]?[0-9]*(?:[#b][0-9]+)?(?:\/[A-H][#b]?)?)/g, 
      '<span class="chord-highlight">$1</span>');
    el.innerHTML = html;
  });

  // Apply transformations
  document.querySelectorAll('.chord-highlight').forEach((el) => {
    let text = el.textContent || '';
    
    // Handle m7b5
    text = text.replace(/m7b5/g, "ø   ");
    
    // Accidentals
    text = text.replace(/#/g, "♯");
    text = text.replace(/b/g, "♭");
    
    // Worded suffixes
    text = text.replace(/maj7/g, "Δ7  ");
    text = text.replace(/ma7/g, "Δ7");
    text = text.replace(/M7/g, "Δ7");
    text = text.replace(/min7/g, "m7  ");
    text = text.replace(/min/g, "m  ");
    text = text.replace(/aug/g, "+  ");
    text = text.replace(/dim/g, "o  ");
    text = text.replace(/maj(?![0-9])/g, "Δ  ");
    
    // + and -
    text = text.replace(/\+/g, "\uE01A");
    text = text.replace(/-/g, "\uE019");
    
    // Accidentals to PUA
    text = text.replace(/\u266D/g, "\uE00A");
    text = text.replace(/\u266E/g, "\uE00B");
    text = text.replace(/\u266F/g, "\uE00C");
    
    // Protect alt and maj from a superscripting
    text = text.replace(/alt/g, 'ALT_PLACEHOLDER');
    text = text.replace(/maj/g, 'MAJ_PLACEHOLDER');
    
    // Superscript letters
    text = text.replace(/a/g, "\uE01B");
    text = text.replace(/d/g, "\uE01C");
    text = text.replace(/s/g, "\uE021");
    text = text.replace(/u/g, "\uE022");
    
    text = text.replace(/ALT_PLACEHOLDER/g, 'alt');
    text = text.replace(/MAJ_PLACEHOLDER/g, 'Δ');
    
    // Superscript digits
    text = text.replace(/1/g, "\uE001");
    text = text.replace(/2/g, "\uE002");
    text = text.replace(/3/g, "\uE003");
    text = text.replace(/4/g, "\uE004");
    text = text.replace(/5/g, "\uE005");
    text = text.replace(/6/g, "\uE006");
    text = text.replace(/7/g, "\uE007");
    text = text.replace(/8/g, "\uE008");
    text = text.replace(/9/g, "\uE009");
    text = text.replace(/0/g, "\uE000");
    
    text = text.replace(/o/g, "\uE016");
    text = text.replace(/ø/g, "\uE017");
    text = text.replace(/M/g, "\uE015");
    text = text.replace(/\u0394/g, "\uE018");
    
    el.textContent = text;
  });
}

function convert() {
  const input = document.getElementById('text-input') as HTMLTextAreaElement;
  const output = document.getElementById('output') as HTMLDivElement;
  if (input && output) {
    output.innerHTML = nl2br(input.value);
    output.classList.add('text');
    chordHighlight();
  }
}

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
}

function changeLanguage(lang: string) {
  i18next.changeLanguage(lang).then(() => {
    updateTranslations();
  });
}

function init() {
  updateTranslations();
  
  const fixBtn = document.getElementById('fix-btn');
  if (fixBtn) {
    fixBtn.addEventListener('click', (e) => {
      e.preventDefault();
      convert();
    });
  }
  
  const form = document.getElementById('converter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      convert();
    });
  }
  
  // Language switcher
  const langSelect = document.getElementById('lang-select') as HTMLSelectElement;
  if (langSelect) {
    langSelect.value = i18next.language || 'en';
    langSelect.addEventListener('change', (e) => {
      changeLanguage((e.target as HTMLSelectElement).value);
    });
  }
  
  // Font size controls
  const plusBtn = document.getElementById('font-plus');
  const minusBtn = document.getElementById('font-minus');
  if (plusBtn) {
    plusBtn.addEventListener('click', () => {
      const body = document.body;
      const size = parseInt(window.getComputedStyle(body).fontSize);
      body.style.fontSize = (size + 1) + 'px';
    });
  }
  if (minusBtn) {
    minusBtn.addEventListener('click', () => {
      const body = document.body;
      const size = parseInt(window.getComputedStyle(body).fontSize);
      body.style.fontSize = (size - 1) + 'px';
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
  
  // Adsu button
  const adsuBtn = document.getElementById('adsu-btn');
  if (adsuBtn) {
    adsuBtn.addEventListener('click', () => {
      document.querySelectorAll('.chord-highlight').forEach((el) => {
        let text = el.textContent || '';
        text = text.replace(/sus2/g, "sus2 ");
        text = text.replace(/sus4/g, "sus4 ");
        text = text.replace(/\uE021\uE022\uE021\uE002/g, "\uE021\uE022\uE021\uE002 ");
        text = text.replace(/\uE021\uE022\uE021\uE004/g, "\uE021\uE022\uE021\uE004 ");
        text = text.replace(/\uE01B\uE01C\uE01C\uE002/g, "\uE01B\uE01C\uE01C\uE002 ");
        text = text.replace(/\uE01B\uE01C\uE01C\uE004/g, "\uE01B\uE01C\uE01C\uE004 ");
        text = text.replace(/\uE01B\uE01C\uE01C\uE006/g, "\uE01B\uE01C\uE01C\uE006 ");
        text = text.replace(/\uE01B\uE01C\uE01C\uE009/g, "\uE01B\uE01C\uE01C\uE009 ");
        text = text.replace(/\uE01B\uE01C\uE01C\uE001\uE001/g, "\uE01B\uE01C\uE01C\uE001\uE001 ");
        text = text.replace(/\uE01B\uE01C\uE01C\uE001\uE003/g, "\uE01B\uE01C\uE01C\uE001\uE003 ");
        el.textContent = text;
      });
    });
  }
  
  // B to H button
  const btohBtn = document.getElementById('btoh-btn');
  if (btohBtn) {
    btohBtn.addEventListener('click', () => {
      document.querySelectorAll('.chord-highlight').forEach((el) => {
        let text = el.textContent || '';
        text = text.replace(/B/g, "H");
        el.textContent = text;
      });
    });
  }
  
  // Done button
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
  const chordColor = document.getElementById('chord-color') as HTMLSelectElement;
  if (chordColor) {
    chordColor.addEventListener('change', () => {
      document.documentElement.style.setProperty('--chord-color', chordColor.value);
    });
  }
  
  const textColor = document.getElementById('text-color') as HTMLSelectElement;
  if (textColor) {
    textColor.addEventListener('change', () => {
      document.documentElement.style.setProperty('--text-color', textColor.value);
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
