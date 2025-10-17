#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

// Comprehensive mapping of city names to their regions
// Format: 'City Name': { country: 'XX', region: 'Region Name' }
const CITY_MAPPINGS = {
  // ============================================================================
  // CHINA (CN) - 25 cities
  // ============================================================================
  'Beijing': { country: 'CN', region: 'Beijing' },
  'Shanghai': { country: 'CN', region: 'Shanghai' },
  'Tianjin': { country: 'CN', region: 'Tianjin' },
  'Chongqing': { country: 'CN', region: 'Chongqing' },
  'Guangzhou': { country: 'CN', region: 'Guangdong' },
  'Shenzhen': { country: 'CN', region: 'Guangdong' },
  'Chengdu': { country: 'CN', region: 'Sichuan' },
  'Wuhan': { country: 'CN', region: 'Hubei' },
  'Hangzhou': { country: 'CN', region: 'Zhejiang' },
  'Xi\'an': { country: 'CN', region: 'Shaanxi' },
  'Nanjing': { country: 'CN', region: 'Jiangsu' },
  'Shenyang': { country: 'CN', region: 'Liaoning' },
  'Harbin': { country: 'CN', region: 'Heilongjiang' },
  'Qingdao': { country: 'CN', region: 'Shandong' },
  'Suzhou': { country: 'CN', region: 'Jiangsu' },
  'Dalian': { country: 'CN', region: 'Liaoning' },
  'Kunming': { country: 'CN', region: 'Yunnan' },
  'Changsha': { country: 'CN', region: 'Hunan' },
  'Jinan': { country: 'CN', region: 'Shandong' },
  'Zhengzhou': { country: 'CN', region: 'Henan' },
  'Shantou': { country: 'CN', region: 'Guangdong' },
  'Ningbo': { country: 'CN', region: 'Zhejiang' },
  'Fuzhou': { country: 'CN', region: 'Fujian' },
  'Xiamen': { country: 'CN', region: 'Fujian' },
  'Guilin': { country: 'CN', region: 'Guangxi' },

  // ============================================================================
  // INDIA (IN) - 20 cities
  // ============================================================================
  'New Delhi': { country: 'IN', region: 'Delhi' },
  'Mumbai': { country: 'IN', region: 'Maharashtra' },
  'Bangalore': { country: 'IN', region: 'Karnataka' },
  'Hyderabad': { country: 'IN', region: 'Telangana' },
  'Chennai': { country: 'IN', region: 'Tamil Nadu' },
  'Kolkata': { country: 'IN', region: 'West Bengal' },
  'Pune': { country: 'IN', region: 'Maharashtra' },
  'Ahmedabad': { country: 'IN', region: 'Gujarat' },
  'Jaipur': { country: 'IN', region: 'Rajasthan' },
  'Surat': { country: 'IN', region: 'Gujarat' },
  'Lucknow': { country: 'IN', region: 'Uttar Pradesh' },
  'Kanpur': { country: 'IN', region: 'Uttar Pradesh' },
  'Nagpur': { country: 'IN', region: 'Maharashtra' },
  'Indore': { country: 'IN', region: 'Madhya Pradesh' },
  'Thane': { country: 'IN', region: 'Maharashtra' },
  'Bhopal': { country: 'IN', region: 'Madhya Pradesh' },
  'Visakhapatnam': { country: 'IN', region: 'Andhra Pradesh' },
  'Varanasi': { country: 'IN', region: 'Uttar Pradesh' },
  'Agra': { country: 'IN', region: 'Uttar Pradesh' },
  'Goa': { country: 'IN', region: 'Goa' },

  // ============================================================================
  // JAPAN (JP) - 20 cities
  // ============================================================================
  'Tokyo': { country: 'JP', region: 'Tokyo' },
  'Yokohama': { country: 'JP', region: 'Kanagawa' },
  'Osaka': { country: 'JP', region: 'Osaka' },
  'Nagoya': { country: 'JP', region: 'Aichi' },
  'Sapporo': { country: 'JP', region: 'Hokkaido' },
  'Kobe': { country: 'JP', region: 'Hyogo' },
  'Kyoto': { country: 'JP', region: 'Kyoto' },
  'Fukuoka': { country: 'JP', region: 'Fukuoka' },
  'Kawasaki': { country: 'JP', region: 'Kanagawa' },
  'Saitama': { country: 'JP', region: 'Saitama' },
  'Hiroshima': { country: 'JP', region: 'Hiroshima' },
  'Sendai': { country: 'JP', region: 'Miyagi' },
  'Kitakyushu': { country: 'JP', region: 'Fukuoka' },
  'Chiba': { country: 'JP', region: 'Chiba' },
  'Sakai': { country: 'JP', region: 'Osaka' },
  'Niigata': { country: 'JP', region: 'Niigata' },
  'Hamamatsu': { country: 'JP', region: 'Shizuoka' },
  'Shizuoka': { country: 'JP', region: 'Shizuoka' },
  'Okayama': { country: 'JP', region: 'Okayama' },
  'Nara': { country: 'JP', region: 'Nara' },

  // ============================================================================
  // VIETNAM (VN) - 15 cities
  // ============================================================================
  'Hanoi': { country: 'VN', region: 'Hanoi' },
  'Ho Chi Minh City': { country: 'VN', region: 'Ho Chi Minh City' },
  'Da Nang': { country: 'VN', region: 'Da Nang' },
  'Hai Phong': { country: 'VN', region: 'Hai Phong' },
  'Can Tho': { country: 'VN', region: 'Can Tho' },
  'Bien Hoa': { country: 'VN', region: 'Dong Nai' },
  'Hue': { country: 'VN', region: 'Thua Thien-Hue' },
  'Nha Trang': { country: 'VN', region: 'Khanh Hoa' },
  'Vung Tau': { country: 'VN', region: 'Ba Ria-Vung Tau' },
  'Da Lat': { country: 'VN', region: 'Lam Dong' },
  'Quy Nhon': { country: 'VN', region: 'Binh Dinh' },
  'Phan Thiet': { country: 'VN', region: 'Binh Thuan' },
  'Long Xuyen': { country: 'VN', region: 'An Giang' },
  'Ha Long': { country: 'VN', region: 'Quang Ninh' },
  'Buon Ma Thuot': { country: 'VN', region: 'Dak Lak' },

  // ============================================================================
  // THAILAND (TH) - 15 cities
  // ============================================================================
  'Bangkok': { country: 'TH', region: 'Bangkok' },
  'Chiang Mai': { country: 'TH', region: 'Chiang Mai' },
  'Phuket': { country: 'TH', region: 'Phuket' },
  'Pattaya': { country: 'TH', region: 'Chon Buri' },
  'Nonthaburi': { country: 'TH', region: 'Nonthaburi' },
  'Nakhon Ratchasima': { country: 'TH', region: 'Nakhon Ratchasima' },
  'Chon Buri': { country: 'TH', region: 'Chon Buri' },
  'Hat Yai': { country: 'TH', region: 'Songkhla' },
  'Udon Thani': { country: 'TH', region: 'Udon Thani' },
  'Pak Kret': { country: 'TH', region: 'Nonthaburi' },
  'Krabi': { country: 'TH', region: 'Krabi' },
  'Ayutthaya': { country: 'TH', region: 'Phra Nakhon Si Ayutthaya' },
  'Khon Kaen': { country: 'TH', region: 'Khon Kaen' },
  'Hua Hin': { country: 'TH', region: 'Prachuap Khiri Khan' },
  'Koh Samui': { country: 'TH', region: 'Surat Thani' },

  // ============================================================================
  // INDONESIA (ID) - 16 cities
  // ============================================================================
  'Jakarta': { country: 'ID', region: 'Jakarta' },
  'Surabaya': { country: 'ID', region: 'East Java' },
  'Bandung': { country: 'ID', region: 'West Java' },
  'Medan': { country: 'ID', region: 'North Sumatra' },
  'Semarang': { country: 'ID', region: 'Central Java' },
  'Makassar': { country: 'ID', region: 'South Sulawesi' },
  'Palembang': { country: 'ID', region: 'South Sumatra' },
  'Tangerang': { country: 'ID', region: 'Banten' },
  'Denpasar': { country: 'ID', region: 'Bali' },
  'Yogyakarta': { country: 'ID', region: 'Yogyakarta' },
  'Bogor': { country: 'ID', region: 'West Java' },
  'Batam': { country: 'ID', region: 'Riau Islands' },
  'Malang': { country: 'ID', region: 'East Java' },
  'Depok': { country: 'ID', region: 'West Java' },
  'Padang': { country: 'ID', region: 'West Sumatra' },
  'Ubud': { country: 'ID', region: 'Bali' },

  // ============================================================================
  // PHILIPPINES (PH) - 15 cities
  // ============================================================================
  'Manila': { country: 'PH', region: 'Metro Manila' },
  'Quezon City': { country: 'PH', region: 'Metro Manila' },
  'Davao City': { country: 'PH', region: 'Davao del Sur' },
  'Caloocan': { country: 'PH', region: 'Metro Manila' },
  'Cebu City': { country: 'PH', region: 'Cebu' },
  'Zamboanga City': { country: 'PH', region: 'Zamboanga del Sur' },
  'Antipolo': { country: 'PH', region: 'Rizal' },
  'Pasig': { country: 'PH', region: 'Metro Manila' },
  'Taguig': { country: 'PH', region: 'Metro Manila' },
  'Cagayan de Oro': { country: 'PH', region: 'Misamis Oriental' },
  'Makati': { country: 'PH', region: 'Metro Manila' },
  'Iloilo City': { country: 'PH', region: 'Iloilo' },
  'Bacolod': { country: 'PH', region: 'Negros Occidental' },
  'General Santos': { country: 'PH', region: 'South Cotabato' },
  'Baguio': { country: 'PH', region: 'Benguet' },

  // ============================================================================
  // UNITED STATES (US) - 30 cities
  // ============================================================================
  'New York': { country: 'US', region: 'New York' },
  'Los Angeles': { country: 'US', region: 'California' },
  'Chicago': { country: 'US', region: 'Illinois' },
  'Houston': { country: 'US', region: 'Texas' },
  'Phoenix': { country: 'US', region: 'Arizona' },
  'Philadelphia': { country: 'US', region: 'Pennsylvania' },
  'San Antonio': { country: 'US', region: 'Texas' },
  'San Diego': { country: 'US', region: 'California' },
  'Dallas': { country: 'US', region: 'Texas' },
  'San Jose': { country: 'US', region: 'California' },
  'Austin': { country: 'US', region: 'Texas' },
  'Jacksonville': { country: 'US', region: 'Florida' },
  'Fort Worth': { country: 'US', region: 'Texas' },
  'Columbus': { country: 'US', region: 'Ohio' },
  'Indianapolis': { country: 'US', region: 'Indiana' },
  'Charlotte': { country: 'US', region: 'North Carolina' },
  'San Francisco': { country: 'US', region: 'California' },
  'Seattle': { country: 'US', region: 'Washington' },
  'Denver': { country: 'US', region: 'Colorado' },
  'Washington': { country: 'US', region: 'District of Columbia' },
  'Boston': { country: 'US', region: 'Massachusetts' },
  'Nashville': { country: 'US', region: 'Tennessee' },
  'Las Vegas': { country: 'US', region: 'Nevada' },
  'Portland': { country: 'US', region: 'Oregon' },
  'Miami': { country: 'US', region: 'Florida' },
  'Atlanta': { country: 'US', region: 'Georgia' },
  'Detroit': { country: 'US', region: 'Michigan' },
  'New Orleans': { country: 'US', region: 'Louisiana' },
  'Orlando': { country: 'US', region: 'Florida' },
  'Honolulu': { country: 'US', region: 'Hawaii' },

  // ============================================================================
  // SOUTH KOREA (KR) - 13 cities
  // ============================================================================
  'Seoul': { country: 'KR', region: 'Seoul' },
  'Busan': { country: 'KR', region: 'Busan' },
  'Incheon': { country: 'KR', region: 'Incheon' },
  'Daegu': { country: 'KR', region: 'Daegu' },
  'Daejeon': { country: 'KR', region: 'Daejeon' },
  'Gwangju': { country: 'KR', region: 'Gwangju' },
  'Suwon': { country: 'KR', region: 'Gyeonggi' },
  'Ulsan': { country: 'KR', region: 'Ulsan' },
  'Changwon': { country: 'KR', region: 'South Gyeongsang' },
  'Goyang': { country: 'KR', region: 'Gyeonggi' },
  'Yongin': { country: 'KR', region: 'Gyeonggi' },
  'Seongnam': { country: 'KR', region: 'Gyeonggi' },
  'Jeju City': { country: 'KR', region: 'Jeju' },

  // ============================================================================
  // MALAYSIA (MY) - 10 cities
  // ============================================================================
  'Kuala Lumpur': { country: 'MY', region: 'Federal Territory of Kuala Lumpur' },
  'George Town': { country: 'MY', region: 'Penang' },
  'Ipoh': { country: 'MY', region: 'Perak' },
  'Johor Bahru': { country: 'MY', region: 'Johor' },
  'Melaka': { country: 'MY', region: 'Malacca' },
  'Kota Kinabalu': { country: 'MY', region: 'Sabah' },
  'Kuching': { country: 'MY', region: 'Sarawak' },
  'Petaling Jaya': { country: 'MY', region: 'Selangor' },
  'Shah Alam': { country: 'MY', region: 'Selangor' },
  'Langkawi': { country: 'MY', region: 'Kedah' },

  // ============================================================================
  // AUSTRALIA (AU) - 12 cities
  // ============================================================================
  'Sydney': { country: 'AU', region: 'New South Wales' },
  'Melbourne': { country: 'AU', region: 'Victoria' },
  'Brisbane': { country: 'AU', region: 'Queensland' },
  'Perth': { country: 'AU', region: 'Western Australia' },
  'Adelaide': { country: 'AU', region: 'South Australia' },
  'Gold Coast': { country: 'AU', region: 'Queensland' },
  'Canberra': { country: 'AU', region: 'Australian Capital Territory' },
  'Newcastle': { country: 'AU', region: 'New South Wales' },
  'Wollongong': { country: 'AU', region: 'New South Wales' },
  'Hobart': { country: 'AU', region: 'Tasmania' },
  'Cairns': { country: 'AU', region: 'Queensland' },
  'Darwin': { country: 'AU', region: 'Northern Territory' },

  // ============================================================================
  // FRANCE (FR) - 14 cities
  // ============================================================================
  'Paris': { country: 'FR', region: 'Ile-de-France' },
  'Marseille': { country: 'FR', region: 'Provence-Alpes-Cote d\'Azur' },
  'Lyon': { country: 'FR', region: 'Auvergne-Rhone-Alpes' },
  'Toulouse': { country: 'FR', region: 'Occitanie' },
  'Nice': { country: 'FR', region: 'Provence-Alpes-Cote d\'Azur' },
  'Nantes': { country: 'FR', region: 'Pays de la Loire' },
  'Strasbourg': { country: 'FR', region: 'Grand Est' },
  'Montpellier': { country: 'FR', region: 'Occitanie' },
  'Bordeaux': { country: 'FR', region: 'Nouvelle-Aquitaine' },
  'Lille': { country: 'FR', region: 'Hauts-de-France' },
  'Rennes': { country: 'FR', region: 'Brittany' },
  'Reims': { country: 'FR', region: 'Grand Est' },
  'Cannes': { country: 'FR', region: 'Provence-Alpes-Cote d\'Azur' },
  'Avignon': { country: 'FR', region: 'Provence-Alpes-Cote d\'Azur' },

  // ============================================================================
  // ITALY (IT) - 15 cities
  // ============================================================================
  'Rome': { country: 'IT', region: 'Lazio' },
  'Milan': { country: 'IT', region: 'Lombardy' },
  'Naples': { country: 'IT', region: 'Campania' },
  'Turin': { country: 'IT', region: 'Piedmont' },
  'Palermo': { country: 'IT', region: 'Sicily' },
  'Genoa': { country: 'IT', region: 'Liguria' },
  'Bologna': { country: 'IT', region: 'Emilia-Romagna' },
  'Florence': { country: 'IT', region: 'Tuscany' },
  'Bari': { country: 'IT', region: 'Apulia' },
  'Catania': { country: 'IT', region: 'Sicily' },
  'Venice': { country: 'IT', region: 'Veneto' },
  'Verona': { country: 'IT', region: 'Veneto' },
  'Messina': { country: 'IT', region: 'Sicily' },
  'Padua': { country: 'IT', region: 'Veneto' },
  'Trieste': { country: 'IT', region: 'Friuli-Venezia Giulia' },

  // ============================================================================
  // SPAIN (ES) - 14 cities
  // ============================================================================
  'Madrid': { country: 'ES', region: 'Community of Madrid' },
  'Barcelona': { country: 'ES', region: 'Catalonia' },
  'Valencia': { country: 'ES', region: 'Valencian Community' },
  'Seville': { country: 'ES', region: 'Andalusia' },
  'Zaragoza': { country: 'ES', region: 'Aragon' },
  'Malaga': { country: 'ES', region: 'Andalusia' },
  'Murcia': { country: 'ES', region: 'Region of Murcia' },
  'Palma': { country: 'ES', region: 'Balearic Islands' },
  'Las Palmas': { country: 'ES', region: 'Canary Islands' },
  'Bilbao': { country: 'ES', region: 'Basque Country' },
  'Alicante': { country: 'ES', region: 'Valencian Community' },
  'Granada': { country: 'ES', region: 'Andalusia' },
  'San Sebastian': { country: 'ES', region: 'Basque Country' },
  'Ibiza': { country: 'ES', region: 'Balearic Islands' },

  // ============================================================================
  // GERMANY (DE) - 14 cities
  // ============================================================================
  'Berlin': { country: 'DE', region: 'Berlin' },
  'Hamburg': { country: 'DE', region: 'Hamburg' },
  'Munich': { country: 'DE', region: 'Bavaria' },
  'Cologne': { country: 'DE', region: 'North Rhine-Westphalia' },
  'Frankfurt': { country: 'DE', region: 'Hesse' },
  'Stuttgart': { country: 'DE', region: 'Baden-Wurttemberg' },
  'Dusseldorf': { country: 'DE', region: 'North Rhine-Westphalia' },
  'Dortmund': { country: 'DE', region: 'North Rhine-Westphalia' },
  'Essen': { country: 'DE', region: 'North Rhine-Westphalia' },
  'Leipzig': { country: 'DE', region: 'Saxony' },
  'Bremen': { country: 'DE', region: 'Bremen' },
  'Dresden': { country: 'DE', region: 'Saxony' },
  'Hannover': { country: 'DE', region: 'Lower Saxony' },
  'Nuremberg': { country: 'DE', region: 'Bavaria' },

  // ============================================================================
  // UNITED KINGDOM (GB) - 14 cities
  // ============================================================================
  'London': { country: 'GB', region: 'Greater London' },
  'Birmingham': { country: 'GB', region: 'West Midlands' },
  'Manchester': { country: 'GB', region: 'Greater Manchester' },
  'Leeds': { country: 'GB', region: 'West Yorkshire' },
  'Glasgow': { country: 'GB', region: 'Scotland' },
  'Liverpool': { country: 'GB', region: 'Merseyside' },
  'Edinburgh': { country: 'GB', region: 'Scotland' },
  'Sheffield': { country: 'GB', region: 'South Yorkshire' },
  'Bristol': { country: 'GB', region: 'South West England' },
  'Newcastle': { country: 'GB', region: 'Tyne and Wear' },
  'Leicester': { country: 'GB', region: 'East Midlands' },
  'Nottingham': { country: 'GB', region: 'East Midlands' },
  'Oxford': { country: 'GB', region: 'South East England' },
  'Cambridge': { country: 'GB', region: 'East of England' },

  // ============================================================================
  // CANADA (CA) - 11 cities
  // ============================================================================
  'Toronto': { country: 'CA', region: 'Ontario' },
  'Montreal': { country: 'CA', region: 'Quebec' },
  'Vancouver': { country: 'CA', region: 'British Columbia' },
  'Calgary': { country: 'CA', region: 'Alberta' },
  'Edmonton': { country: 'CA', region: 'Alberta' },
  'Ottawa': { country: 'CA', region: 'Ontario' },
  'Winnipeg': { country: 'CA', region: 'Manitoba' },
  'Quebec City': { country: 'CA', region: 'Quebec' },
  'Hamilton': { country: 'CA', region: 'Ontario' },
  'Victoria': { country: 'CA', region: 'British Columbia' },
  'Halifax': { country: 'CA', region: 'Nova Scotia' },

  // ============================================================================
  // MEXICO (MX) - 14 cities
  // ============================================================================
  'Mexico City': { country: 'MX', region: 'Federal District' },
  'Guadalajara': { country: 'MX', region: 'Jalisco' },
  'Monterrey': { country: 'MX', region: 'Nuevo Leon' },
  'Puebla': { country: 'MX', region: 'Puebla' },
  'Tijuana': { country: 'MX', region: 'Baja California' },
  'Cancun': { country: 'MX', region: 'Quintana Roo' },
  'Leon': { country: 'MX', region: 'Guanajuato' },
  'Juarez': { country: 'MX', region: 'Chihuahua' },
  'Zapopan': { country: 'MX', region: 'Jalisco' },
  'Merida': { country: 'MX', region: 'Yucatan' },
  'San Luis Potosi': { country: 'MX', region: 'San Luis Potosi' },
  'Aguascalientes': { country: 'MX', region: 'Aguascalientes' },
  'Queretaro': { country: 'MX', region: 'Queretaro' },
  'Playa del Carmen': { country: 'MX', region: 'Quintana Roo' },

  // ============================================================================
  // BRAZIL (BR) - 13 cities
  // ============================================================================
  'Sao Paulo': { country: 'BR', region: 'Sao Paulo' },
  'Rio de Janeiro': { country: 'BR', region: 'Rio de Janeiro' },
  'Brasilia': { country: 'BR', region: 'Federal District' },
  'Salvador': { country: 'BR', region: 'Bahia' },
  'Fortaleza': { country: 'BR', region: 'Ceara' },
  'Belo Horizonte': { country: 'BR', region: 'Minas Gerais' },
  'Manaus': { country: 'BR', region: 'Amazonas' },
  'Curitiba': { country: 'BR', region: 'Parana' },
  'Recife': { country: 'BR', region: 'Pernambuco' },
  'Porto Alegre': { country: 'BR', region: 'Rio Grande do Sul' },
  'Goiania': { country: 'BR', region: 'Goias' },
  'Belem': { country: 'BR', region: 'Para' },
  'Florianopolis': { country: 'BR', region: 'Santa Catarina' },

  // ============================================================================
  // TURKEY (TR) - 11 cities
  // ============================================================================
  'Istanbul': { country: 'TR', region: 'Istanbul' },
  'Ankara': { country: 'TR', region: 'Ankara' },
  'Izmir': { country: 'TR', region: 'Izmir' },
  'Bursa': { country: 'TR', region: 'Bursa' },
  'Antalya': { country: 'TR', region: 'Antalya' },
  'Adana': { country: 'TR', region: 'Adana' },
  'Gaziantep': { country: 'TR', region: 'Gaziantep' },
  'Konya': { country: 'TR', region: 'Konya' },
  'Bodrum': { country: 'TR', region: 'Mugla' },
  'Fethiye': { country: 'TR', region: 'Mugla' },
  'Cappadocia': { country: 'TR', region: 'Nevsehir' },

  // ============================================================================
  // UAE (AE) - 7 cities
  // ============================================================================
  'Dubai': { country: 'AE', region: 'Dubai' },
  'Abu Dhabi': { country: 'AE', region: 'Abu Dhabi' },
  'Sharjah': { country: 'AE', region: 'Sharjah' },
  'Al Ain': { country: 'AE', region: 'Abu Dhabi' },
  'Ajman': { country: 'AE', region: 'Ajman' },
  'Ras Al Khaimah': { country: 'AE', region: 'Ras Al Khaimah' },
  'Fujairah': { country: 'AE', region: 'Fujairah' },

  // ============================================================================
  // EGYPT (EG) - 9 cities
  // ============================================================================
  'Cairo': { country: 'EG', region: 'Cairo' },
  'Alexandria': { country: 'EG', region: 'Alexandria' },
  'Giza': { country: 'EG', region: 'Giza' },
  'Sharm El Sheikh': { country: 'EG', region: 'South Sinai' },
  'Luxor': { country: 'EG', region: 'Luxor' },
  'Aswan': { country: 'EG', region: 'Aswan' },
  'Hurghada': { country: 'EG', region: 'Red Sea' },
  'Port Said': { country: 'EG', region: 'Port Said' },
  'Suez': { country: 'EG', region: 'Suez' },

  // ============================================================================
  // SINGAPORE (SG) - 1 city
  // ============================================================================
  'Singapore': { country: 'SG', region: 'Singapore' },

  // ============================================================================
  // NETHERLANDS (NL) - 4 cities
  // ============================================================================
  'Amsterdam': { country: 'NL', region: 'North Holland' },
  'Rotterdam': { country: 'NL', region: 'South Holland' },
  'The Hague': { country: 'NL', region: 'South Holland' },
  'Utrecht': { country: 'NL', region: 'Utrecht' },

  // ============================================================================
  // BELGIUM (BE) - 4 cities
  // ============================================================================
  'Brussels': { country: 'BE', region: 'Brussels-Capital' },
  'Antwerp': { country: 'BE', region: 'Flanders' },
  'Ghent': { country: 'BE', region: 'Flanders' },
  'Bruges': { country: 'BE', region: 'Flanders' },

  // ============================================================================
  // SWITZERLAND (CH) - 5 cities
  // ============================================================================
  'Zurich': { country: 'CH', region: 'Zurich' },
  'Geneva': { country: 'CH', region: 'Geneva' },
  'Basel': { country: 'CH', region: 'Basel-City' },
  'Bern': { country: 'CH', region: 'Bern' },
  'Lucerne': { country: 'CH', region: 'Lucerne' },

  // ============================================================================
  // AUSTRIA (AT) - 5 cities
  // ============================================================================
  'Vienna': { country: 'AT', region: 'Vienna' },
  'Graz': { country: 'AT', region: 'Styria' },
  'Linz': { country: 'AT', region: 'Upper Austria' },
  'Salzburg': { country: 'AT', region: 'Salzburg' },
  'Innsbruck': { country: 'AT', region: 'Tyrol' },

  // ============================================================================
  // PORTUGAL (PT) - 4 cities
  // ============================================================================
  'Lisbon': { country: 'PT', region: 'Lisbon' },
  'Porto': { country: 'PT', region: 'Porto' },
  'Faro': { country: 'PT', region: 'Faro' },
  'Funchal': { country: 'PT', region: 'Madeira' },

  // ============================================================================
  // GREECE (GR) - 6 cities
  // ============================================================================
  'Athens': { country: 'GR', region: 'Attica' },
  'Thessaloniki': { country: 'GR', region: 'Central Macedonia' },
  'Patras': { country: 'GR', region: 'Western Greece' },
  'Heraklion': { country: 'GR', region: 'Crete' },
  'Santorini': { country: 'GR', region: 'South Aegean' },
  'Mykonos': { country: 'GR', region: 'South Aegean' },

  // ============================================================================
  // CZECH REPUBLIC (CZ) - 3 cities
  // ============================================================================
  'Prague': { country: 'CZ', region: 'Prague' },
  'Brno': { country: 'CZ', region: 'South Moravian' },
  'Ostrava': { country: 'CZ', region: 'Moravian-Silesian' },

  // ============================================================================
  // POLAND (PL) - 4 cities
  // ============================================================================
  'Warsaw': { country: 'PL', region: 'Masovian' },
  'Krakow': { country: 'PL', region: 'Lesser Poland' },
  'Wroclaw': { country: 'PL', region: 'Lower Silesian' },
  'Gdansk': { country: 'PL', region: 'Pomeranian' },

  // ============================================================================
  // RUSSIA (RU) - 5 cities
  // ============================================================================
  'Moscow': { country: 'RU', region: 'Moscow' },
  'Saint Petersburg': { country: 'RU', region: 'Saint Petersburg' },
  'Novosibirsk': { country: 'RU', region: 'Novosibirsk Oblast' },
  'Yekaterinburg': { country: 'RU', region: 'Sverdlovsk Oblast' },
  'Kazan': { country: 'RU', region: 'Tatarstan' },

  // ============================================================================
  // ARGENTINA (AR) - 4 cities
  // ============================================================================
  'Buenos Aires': { country: 'AR', region: 'Buenos Aires' },
  'Cordoba': { country: 'AR', region: 'Cordoba' },
  'Rosario': { country: 'AR', region: 'Santa Fe' },
  'Mendoza': { country: 'AR', region: 'Mendoza' },

  // ============================================================================
  // SOUTH AFRICA (ZA) - 5 cities
  // ============================================================================
  'Johannesburg': { country: 'ZA', region: 'Gauteng' },
  'Cape Town': { country: 'ZA', region: 'Western Cape' },
  'Durban': { country: 'ZA', region: 'KwaZulu-Natal' },
  'Pretoria': { country: 'ZA', region: 'Gauteng' },
  'Port Elizabeth': { country: 'ZA', region: 'Eastern Cape' },

  // ============================================================================
  // NEW ZEALAND (NZ) - 4 cities
  // ============================================================================
  'Auckland': { country: 'NZ', region: 'Auckland' },
  'Wellington': { country: 'NZ', region: 'Wellington' },
  'Christchurch': { country: 'NZ', region: 'Canterbury' },
  'Queenstown': { country: 'NZ', region: 'Otago' },

  // ============================================================================
  // IRELAND (IE) - 3 cities
  // ============================================================================
  'Dublin': { country: 'IE', region: 'Leinster' },
  'Cork': { country: 'IE', region: 'Munster' },
  'Galway': { country: 'IE', region: 'Connacht' },

  // ============================================================================
  // SWEDEN (SE) - 3 cities
  // ============================================================================
  'Stockholm': { country: 'SE', region: 'Stockholm' },
  'Gothenburg': { country: 'SE', region: 'Vastra Gotaland' },
  'Malmo': { country: 'SE', region: 'Skane' },

  // ============================================================================
  // NORWAY (NO) - 3 cities
  // ============================================================================
  'Oslo': { country: 'NO', region: 'Oslo' },
  'Bergen': { country: 'NO', region: 'Vestland' },
  'Trondheim': { country: 'NO', region: 'Trondelag' },

  // ============================================================================
  // DENMARK (DK) - 3 cities
  // ============================================================================
  'Copenhagen': { country: 'DK', region: 'Capital Region' },
  'Aarhus': { country: 'DK', region: 'Central Jutland' },
  'Odense': { country: 'DK', region: 'Southern Denmark' },

  // ============================================================================
  // FINLAND (FI) - 3 cities
  // ============================================================================
  'Helsinki': { country: 'FI', region: 'Uusimaa' },
  'Espoo': { country: 'FI', region: 'Uusimaa' },
  'Tampere': { country: 'FI', region: 'Pirkanmaa' },

  // ============================================================================
  // ICELAND (IS) - 1 city
  // ============================================================================
  'Reykjavik': { country: 'IS', region: 'Capital Region' },

  // ============================================================================
  // MOROCCO (MA) - 4 cities
  // ============================================================================
  'Casablanca': { country: 'MA', region: 'Casablanca-Settat' },
  'Rabat': { country: 'MA', region: 'Rabat-Sale-Kenitra' },
  'Marrakech': { country: 'MA', region: 'Marrakesh-Safi' },
  'Fes': { country: 'MA', region: 'Fes-Meknes' },

  // ============================================================================
  // ISRAEL (IL) - 3 cities
  // ============================================================================
  'Jerusalem': { country: 'IL', region: 'Jerusalem' },
  'Tel Aviv': { country: 'IL', region: 'Tel Aviv' },
  'Haifa': { country: 'IL', region: 'Haifa' },

  // ============================================================================
  // JORDAN (JO) - 2 cities
  // ============================================================================
  'Amman': { country: 'JO', region: 'Amman' },
  'Petra': { country: 'JO', region: 'Ma\'an' },

  // ============================================================================
  // SAUDI ARABIA (SA) - 4 cities
  // ============================================================================
  'Riyadh': { country: 'SA', region: 'Riyadh' },
  'Jeddah': { country: 'SA', region: 'Makkah' },
  'Mecca': { country: 'SA', region: 'Makkah' },
  'Medina': { country: 'SA', region: 'Madinah' },

  // ============================================================================
  // PERU (PE) - 3 cities
  // ============================================================================
  'Lima': { country: 'PE', region: 'Lima' },
  'Cusco': { country: 'PE', region: 'Cusco' },
  'Arequipa': { country: 'PE', region: 'Arequipa' },

  // ============================================================================
  // CHILE (CL) - 2 cities
  // ============================================================================
  'Santiago': { country: 'CL', region: 'Santiago Metropolitan' },
  'Valparaiso': { country: 'CL', region: 'Valparaiso' },

  // ============================================================================
  // COLOMBIA (CO) - 3 cities
  // ============================================================================
  'Bogota': { country: 'CO', region: 'Cundinamarca' },
  'Medellin': { country: 'CO', region: 'Antioquia' },
  'Cartagena': { country: 'CO', region: 'Bolivar' },

  // ============================================================================
  // COSTA RICA (CR) - 1 city
  // ============================================================================
  'San Jose': { country: 'CR', region: 'San Jose' },

  // ============================================================================
  // PANAMA (PA) - 1 city
  // ============================================================================
  'Panama City': { country: 'PA', region: 'Panama' },

  // ============================================================================
  // CUBA (CU) - 1 city
  // ============================================================================
  'Havana': { country: 'CU', region: 'Havana' },

  // ============================================================================
  // KENYA (KE) - 2 cities
  // ============================================================================
  'Nairobi': { country: 'KE', region: 'Nairobi' },
  'Mombasa': { country: 'KE', region: 'Mombasa' },

  // ============================================================================
  // TANZANIA (TZ) - 2 cities
  // ============================================================================
  'Dar es Salaam': { country: 'TZ', region: 'Dar es Salaam' },
  'Dodoma': { country: 'TZ', region: 'Dodoma' },

  // ============================================================================
  // NIGERIA (NG) - 3 cities
  // ============================================================================
  'Lagos': { country: 'NG', region: 'Lagos' },
  'Abuja': { country: 'NG', region: 'Federal Capital Territory' },
  'Kano': { country: 'NG', region: 'Kano' },

  // ============================================================================
  // SRI LANKA (LK) - 2 cities
  // ============================================================================
  'Colombo': { country: 'LK', region: 'Western' },
  'Kandy': { country: 'LK', region: 'Central' },

  // ============================================================================
  // NEPAL (NP) - 2 cities
  // ============================================================================
  'Kathmandu': { country: 'NP', region: 'Bagmati' },
  'Pokhara': { country: 'NP', region: 'Gandaki' },

  // ============================================================================
  // MYANMAR (MM) - 3 cities
  // ============================================================================
  'Yangon': { country: 'MM', region: 'Yangon' },
  'Naypyidaw': { country: 'MM', region: 'Naypyidaw' },
  'Mandalay': { country: 'MM', region: 'Mandalay' },

  // ============================================================================
  // CAMBODIA (KH) - 2 cities
  // ============================================================================
  'Phnom Penh': { country: 'KH', region: 'Phnom Penh' },
  'Siem Reap': { country: 'KH', region: 'Siem Reap' },

  // ============================================================================
  // LAOS (LA) - 2 cities
  // ============================================================================
  'Vientiane': { country: 'LA', region: 'Vientiane Prefecture' },
  'Luang Prabang': { country: 'LA', region: 'Luang Prabang' },

  // ============================================================================
  // MALDIVES (MV) - 1 city
  // ============================================================================
  'Male': { country: 'MV', region: 'Male' },
};

async function linkCitiesToRegions() {
  const client = new Client({ connectionString });

  try {
    console.log('='.repeat(80));
    console.log('COMPREHENSIVE CITY-REGION MAPPING SCRIPT');
    console.log('='.repeat(80));
    console.log('\nConnecting to database...');
    await client.connect();
    console.log('Connected successfully!\n');

    // Get current statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_cities,
        COUNT(region_id) as linked_cities,
        COUNT(*) - COUNT(region_id) as unlinked_cities
      FROM cities
    `;
    const statsResult = await client.query(statsQuery);
    const { total_cities, linked_cities, unlinked_cities } = statsResult.rows[0];

    console.log('Current Database Status:');
    console.log('-'.repeat(80));
    console.log(`Total cities: ${total_cities}`);
    console.log(`Linked to regions: ${linked_cities}`);
    console.log(`Unlinked: ${unlinked_cities}`);
    console.log('-'.repeat(80));
    console.log(`\nProcessing ${Object.keys(CITY_MAPPINGS).length} city mappings...\n`);

    let updated = 0;
    let notFound = 0;
    let regionNotFound = 0;
    let alreadyLinked = 0;
    const countryStats = {};

    for (const [cityName, mapping] of Object.entries(CITY_MAPPINGS)) {
      try {
        // Check if city exists and get its current region_id
        const cityResult = await client.query(`
          SELECT id, region_id, country_code
          FROM cities
          WHERE name = $1 AND country_code = $2
        `, [cityName, mapping.country]);

        if (cityResult.rows.length === 0) {
          console.log(`   ⚠️  City not found: ${cityName} (${mapping.country})`);
          notFound++;
          continue;
        }

        const city = cityResult.rows[0];

        // Skip if already linked
        if (city.region_id !== null) {
          alreadyLinked++;
          continue;
        }

        // Find the region
        const regionResult = await client.query(`
          SELECT id, name FROM regions
          WHERE country_code = $1 AND name = $2
        `, [mapping.country, mapping.region]);

        if (regionResult.rows.length === 0) {
          console.log(`   ⚠️  Region not found: ${mapping.region} (${mapping.country}) for city ${cityName}`);
          regionNotFound++;
          continue;
        }

        const regionId = regionResult.rows[0].id;

        // Update the city
        await client.query(`
          UPDATE cities
          SET region_id = $1
          WHERE id = $2
        `, [regionId, city.id]);

        updated++;

        // Track country statistics
        if (!countryStats[mapping.country]) {
          countryStats[mapping.country] = 0;
        }
        countryStats[mapping.country]++;

        console.log(`   ✓ ${cityName} (${mapping.country}) → ${mapping.region}`);

      } catch (error) {
        console.log(`   ✗ Error processing ${cityName}: ${error.message}`);
      }
    }

    // Get final statistics
    const finalStatsResult = await client.query(statsQuery);
    const finalStats = finalStatsResult.rows[0];

    console.log('\n' + '='.repeat(80));
    console.log('MAPPING COMPLETE');
    console.log('='.repeat(80));
    console.log('\nProcessing Summary:');
    console.log('-'.repeat(80));
    console.log(`✓ Cities successfully linked: ${updated}`);
    console.log(`⊙ Cities already linked (skipped): ${alreadyLinked}`);
    console.log(`⚠  Cities not found in database: ${notFound}`);
    console.log(`⚠  Regions not found in database: ${regionNotFound}`);
    console.log('-'.repeat(80));

    console.log('\nFinal Database Status:');
    console.log('-'.repeat(80));
    console.log(`Total cities: ${finalStats.total_cities}`);
    console.log(`Linked to regions: ${finalStats.linked_cities}`);
    console.log(`Unlinked: ${finalStats.unlinked_cities}`);
    console.log(`Completion rate: ${((finalStats.linked_cities / finalStats.total_cities) * 100).toFixed(1)}%`);
    console.log('-'.repeat(80));

    // Show top countries by cities linked
    if (Object.keys(countryStats).length > 0) {
      console.log('\nTop Countries by Cities Linked:');
      console.log('-'.repeat(80));
      const sortedCountries = Object.entries(countryStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

      sortedCountries.forEach(([code, count], index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${code.padEnd(4)} - ${count} cities`);
      });
      console.log('-'.repeat(80));
    }

    // Show remaining unlinked cities by country
    const unlinkedQuery = `
      SELECT country_code, COUNT(*) as count
      FROM cities
      WHERE region_id IS NULL
      GROUP BY country_code
      ORDER BY count DESC
      LIMIT 15
    `;
    const unlinkedResult = await client.query(unlinkedQuery);

    if (unlinkedResult.rows.length > 0) {
      console.log('\nRemaining Unlinked Cities by Country:');
      console.log('-'.repeat(80));
      unlinkedResult.rows.forEach((row, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${row.country_code.padEnd(4)} - ${row.count} unlinked cities`);
      });
      console.log('-'.repeat(80));
    }

    console.log('\n' + '='.repeat(80));
    console.log('Script completed successfully!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('ERROR');
    console.error('='.repeat(80));
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

// Run the script
linkCitiesToRegions().catch(console.error);
