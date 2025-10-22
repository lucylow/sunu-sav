import I18n from 'i18n-js';
import * as Localize from 'react-native-localize';
import en from './en.json';
import fr from './fr.json';
import wo from './wo.json'; // Wolof

I18n.translations = { en, fr, wo };
I18n.fallbacks = true;

const locale = Localize.getLocales()[0];
I18n.locale = locale.languageCode;

export default I18n;
