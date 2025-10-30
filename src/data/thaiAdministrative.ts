// Minimal Thai administrative map for cascading dropdowns
// Structure: Province -> District (Amphoe) -> Sub-district (Tambon)
export type ThaiAdministrativeMap = Record<string, Record<string, string[]>>

export const THAI_ADMIN_MAP: ThaiAdministrativeMap = {
  'Nakhon Pathom': {
    'Mueang Nakhon Pathom': ['Phra Pathom Chedi', 'Tha Tamnak', 'Phra Prathon', 'Don Yai Hom'],
    'Kamphaeng Saen': ['Suan Mon', 'Nong Krathum', 'Thung Kraphang Hom'],
    'Nakhon Chai Si': ['Wat Samrong', 'Bang Kaeo Fa', 'Tha Na'],
    'Don Tum': ['Don Tum', 'Lam Hoei', 'Bo Phlap'],
    'Bang Len': ['Bang Len', 'Nang Buat', 'Rang Krathum'],
    'Phutthamonthon': ['Salaya', 'Bang Krathuek', 'Khun Kaeo'],
    'Sam Phran': ['Krathum Lom', 'Tha Kham', 'Om Yai']
  },
  'Bangkok': {
    'Phasi Charoen': ['Bang Wa', 'Khlong Khwang', 'Pak Khlong Phasi Charoen'],
    'Bang Kapi': ['Hua Mak', 'Khlong Chan'],
    'Phra Nakhon': ['Bowon Niwet', 'Talat Yot', 'Wat Sam Phraya']
  },
  'Nonthaburi': {
    'Mueang Nonthaburi': ['Bang Kraso', 'Talat Khwan', 'Tha Sai'],
    'Bang Bua Thong': ['Bang Phlap', 'Phimon Rat', 'Lahan']
  },
  'Pathum Thani': {
    'Mueang Pathum Thani': ['Bang Paruat', 'Bang Duea', 'Ban Klang'],
    'Thanyaburi': ['Rangsit', 'Bueng Yitho', 'Pracha Thipat'],
    'Lam Luk Ka': ['Khu Khot', 'Lam Luk Ka', 'Bueng Kham Phroi']
  }
}

export default THAI_ADMIN_MAP

