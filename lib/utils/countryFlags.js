// Country code to flag emoji mapping
const countryFlags = {
  US: '🇺🇸',
  GB: '🇬🇧',
  DE: '🇩🇪',
  FI: '🇫🇮',
  IN: '🇮🇳',
  BR: '🇧🇷',
  NL: '🇳🇱',
  FR: '🇫🇷',
  CA: '🇨🇦',
  AU: '🇦🇺',
  JP: '🇯🇵',
  SG: '🇸🇬',
  SE: '🇸🇪',
  CH: '🇨🇭',
  IE: '🇮🇪',
};

export function getCountryFlag(countryCode) {
  return countryFlags[countryCode] || '🌐';
}

export function getCountryName(countryCode) {
  const names = {
    US: 'United States',
    GB: 'United Kingdom',
    DE: 'Germany',
    FI: 'Finland',
    IN: 'India',
    BR: 'Brazil',
    NL: 'Netherlands',
    FR: 'France',
    CA: 'Canada',
    AU: 'Australia',
    JP: 'Japan',
    SG: 'Singapore',
    SE: 'Sweden',
    CH: 'Switzerland',
    IE: 'Ireland',
  };
  return names[countryCode] || countryCode;
}
