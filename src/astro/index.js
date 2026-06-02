import { I18n } from "@embra/i18n";

export { default as Trans } from "./Trans.astro";

export const createStaticI18n = ({ locales, fallback }) => {
  const instances = {};

  const getI18n = (lang = fallback) => (instances[lang] ??= new I18n(lang, locales, { fallback }));

  return {
    getI18n,
    getT: (lang) => getI18n(lang).t,
  };
};
