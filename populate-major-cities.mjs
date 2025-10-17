import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

// Comprehensive city data organized by country
const citiesData = {
  // United States
  US: [
    { name: 'New York', population: 8336817, lat: 40.7128, lon: -74.0060, timezone: 'America/New_York', capital: false, major: true },
    { name: 'Los Angeles', population: 3979576, lat: 34.0522, lon: -118.2437, timezone: 'America/Los_Angeles', capital: false, major: true },
    { name: 'Chicago', population: 2693976, lat: 41.8781, lon: -87.6298, timezone: 'America/Chicago', capital: false, major: true },
    { name: 'Houston', population: 2320268, lat: 29.7604, lon: -95.3698, timezone: 'America/Chicago', capital: false, major: true },
    { name: 'Phoenix', population: 1680992, lat: 33.4484, lon: -112.0740, timezone: 'America/Phoenix', capital: false, major: true },
    { name: 'Philadelphia', population: 1584064, lat: 39.9526, lon: -75.1652, timezone: 'America/New_York', capital: false, major: true },
    { name: 'San Antonio', population: 1547253, lat: 29.4241, lon: -98.4936, timezone: 'America/Chicago', capital: false, major: true },
    { name: 'San Diego', population: 1423851, lat: 32.7157, lon: -117.1611, timezone: 'America/Los_Angeles', capital: false, major: true },
    { name: 'Dallas', population: 1343573, lat: 32.7767, lon: -96.7970, timezone: 'America/Chicago', capital: false, major: true },
    { name: 'San Jose', population: 1021795, lat: 37.3382, lon: -121.8863, timezone: 'America/Los_Angeles', capital: false, major: true },
    { name: 'Austin', population: 978908, lat: 30.2672, lon: -97.7431, timezone: 'America/Chicago', capital: false, major: true },
    { name: 'Jacksonville', population: 911507, lat: 30.3322, lon: -81.6557, timezone: 'America/New_York', capital: false, major: true },
    { name: 'San Francisco', population: 881549, lat: 37.7749, lon: -122.4194, timezone: 'America/Los_Angeles', capital: false, major: true },
    { name: 'Columbus', population: 898553, lat: 39.9612, lon: -82.9988, timezone: 'America/New_York', capital: false, major: true },
    { name: 'Fort Worth', population: 909585, lat: 32.7555, lon: -97.3308, timezone: 'America/Chicago', capital: false, major: true },
    { name: 'Indianapolis', population: 876384, lat: 39.7684, lon: -86.1581, timezone: 'America/Indiana/Indianapolis', capital: false, major: true },
    { name: 'Charlotte', population: 885708, lat: 35.2271, lon: -80.8431, timezone: 'America/New_York', capital: false, major: true },
    { name: 'Seattle', population: 753675, lat: 47.6062, lon: -122.3321, timezone: 'America/Los_Angeles', capital: false, major: true },
    { name: 'Denver', population: 727211, lat: 39.7392, lon: -104.9903, timezone: 'America/Denver', capital: false, major: true },
    { name: 'Washington', population: 705749, lat: 38.9072, lon: -77.0369, timezone: 'America/New_York', capital: true, major: true },
    { name: 'Boston', population: 692600, lat: 42.3601, lon: -71.0589, timezone: 'America/New_York', capital: false, major: true },
    { name: 'Nashville', population: 689447, lat: 36.1627, lon: -86.7816, timezone: 'America/Chicago', capital: false, major: true },
    { name: 'Las Vegas', population: 641903, lat: 36.1699, lon: -115.1398, timezone: 'America/Los_Angeles', capital: false, major: true },
    { name: 'Portland', population: 652503, lat: 45.5152, lon: -122.6784, timezone: 'America/Los_Angeles', capital: false, major: true },
    { name: 'Detroit', population: 670031, lat: 42.3314, lon: -83.0458, timezone: 'America/Detroit', capital: false, major: true },
    { name: 'Miami', population: 467963, lat: 25.7617, lon: -80.1918, timezone: 'America/New_York', capital: false, major: true },
    { name: 'Atlanta', population: 498715, lat: 33.7490, lon: -84.3880, timezone: 'America/New_York', capital: false, major: true },
    { name: 'New Orleans', population: 390144, lat: 29.9511, lon: -90.0715, timezone: 'America/Chicago', capital: false, major: true },
    { name: 'Orlando', population: 307573, lat: 28.5383, lon: -81.3792, timezone: 'America/New_York', capital: false, major: true },
    { name: 'Honolulu', population: 345064, lat: 21.3099, lon: -157.8581, timezone: 'Pacific/Honolulu', capital: false, major: true },
  ],

  // China
  CN: [
    { name: 'Beijing', population: 21540000, lat: 39.9042, lon: 116.4074, timezone: 'Asia/Shanghai', capital: true, major: true },
    { name: 'Shanghai', population: 27058000, lat: 31.2304, lon: 121.4737, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Guangzhou', population: 15300000, lat: 23.1291, lon: 113.2644, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Shenzhen', population: 17560000, lat: 22.5431, lon: 114.0579, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Chengdu', population: 16580000, lat: 30.5728, lon: 104.0668, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Chongqing', population: 15300000, lat: 29.4316, lon: 106.9123, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Tianjin', population: 13870000, lat: 39.3434, lon: 117.3616, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Wuhan', population: 11080000, lat: 30.5928, lon: 114.3055, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Hangzhou', population: 10360000, lat: 30.2741, lon: 120.1551, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Xi\'an', population: 12900000, lat: 34.3416, lon: 108.9398, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Nanjing', population: 8505000, lat: 32.0603, lon: 118.7969, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Shenyang', population: 8290000, lat: 41.8057, lon: 123.4328, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Harbin', population: 10635971, lat: 45.8038, lon: 126.5340, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Qingdao', population: 9046200, lat: 36.0671, lon: 120.3826, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Suzhou', population: 10720000, lat: 31.2989, lon: 120.5853, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Dalian', population: 6690000, lat: 38.9140, lon: 121.6147, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Kunming', population: 6850000, lat: 25.0389, lon: 102.7183, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Changsha', population: 8154700, lat: 28.2282, lon: 112.9388, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Jinan', population: 7321200, lat: 36.6512, lon: 117.1209, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Zhengzhou', population: 10120000, lat: 34.7466, lon: 113.6253, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Shantou', population: 5502000, lat: 23.3540, lon: 116.6825, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Ningbo', population: 8200000, lat: 29.8683, lon: 121.5440, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Fuzhou', population: 7740000, lat: 26.0745, lon: 119.2965, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Xiamen', population: 3930000, lat: 24.4798, lon: 118.0894, timezone: 'Asia/Shanghai', capital: false, major: true },
    { name: 'Guilin', population: 4900000, lat: 25.2736, lon: 110.2900, timezone: 'Asia/Shanghai', capital: false, major: true },
  ],

  // India
  IN: [
    { name: 'New Delhi', population: 32941000, lat: 28.6139, lon: 77.2090, timezone: 'Asia/Kolkata', capital: true, major: true },
    { name: 'Mumbai', population: 20961000, lat: 19.0760, lon: 72.8777, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Bangalore', population: 12765000, lat: 12.9716, lon: 77.5946, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Hyderabad', population: 10004000, lat: 17.3850, lon: 78.4867, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Chennai', population: 10971000, lat: 13.0827, lon: 80.2707, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Kolkata', population: 14974000, lat: 22.5726, lon: 88.3639, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Pune', population: 6629000, lat: 18.5204, lon: 73.8567, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Ahmedabad', population: 7681000, lat: 23.0225, lon: 72.5714, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Jaipur', population: 3073350, lat: 26.9124, lon: 75.7873, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Surat', population: 6081322, lat: 21.1702, lon: 72.8311, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Lucknow', population: 3382000, lat: 26.8467, lon: 80.9462, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Kanpur', population: 2920000, lat: 26.4499, lon: 80.3319, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Nagpur', population: 2497870, lat: 21.1458, lon: 79.0882, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Indore', population: 2201927, lat: 22.7196, lon: 75.8577, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Thane', population: 1886941, lat: 19.2183, lon: 72.9781, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Bhopal', population: 1798218, lat: 23.2599, lon: 77.4126, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Visakhapatnam', population: 1730320, lat: 17.6869, lon: 83.2185, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Varanasi', population: 1201815, lat: 25.3176, lon: 82.9739, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Agra', population: 1585705, lat: 27.1767, lon: 78.0081, timezone: 'Asia/Kolkata', capital: false, major: true },
    { name: 'Goa', population: 114000, lat: 15.2993, lon: 74.1240, timezone: 'Asia/Kolkata', capital: false, major: true },
  ],

  // Vietnam
  VN: [
    { name: 'Hanoi', population: 8246600, lat: 21.0285, lon: 105.8542, timezone: 'Asia/Ho_Chi_Minh', capital: true, major: true },
    { name: 'Ho Chi Minh City', population: 9077158, lat: 10.8231, lon: 106.6297, timezone: 'Asia/Ho_Chi_Minh', capital: false, major: true },
    { name: 'Da Nang', population: 1134000, lat: 16.0544, lon: 108.2022, timezone: 'Asia/Ho_Chi_Minh', capital: false, major: true },
    { name: 'Hai Phong', population: 2028514, lat: 20.8449, lon: 106.6881, timezone: 'Asia/Ho_Chi_Minh', capital: false, major: true },
    { name: 'Can Tho', population: 1238300, lat: 10.0452, lon: 105.7469, timezone: 'Asia/Ho_Chi_Minh', capital: false, major: true },
    { name: 'Bien Hoa', population: 1104495, lat: 10.9510, lon: 106.8234, timezone: 'Asia/Ho_Chi_Minh', capital: false, major: true },
    { name: 'Hue', population: 652572, lat: 16.4637, lon: 107.5909, timezone: 'Asia/Ho_Chi_Minh', capital: false, major: true },
    { name: 'Nha Trang', population: 509000, lat: 12.2388, lon: 109.1967, timezone: 'Asia/Ho_Chi_Minh', capital: false, major: true },
    { name: 'Vung Tau', population: 450000, lat: 10.3460, lon: 107.0843, timezone: 'Asia/Ho_Chi_Minh', capital: false, major: true },
    { name: 'Da Lat', population: 260000, lat: 11.9404, lon: 108.4583, timezone: 'Asia/Ho_Chi_Minh', capital: false, major: true },
    { name: 'Quy Nhon', population: 457400, lat: 13.7830, lon: 109.2198, timezone: 'Asia/Ho_Chi_Minh', capital: false, major: true },
    { name: 'Phan Thiet', population: 350000, lat: 10.9280, lon: 108.1020, timezone: 'Asia/Ho_Chi_Minh', capital: false, major: true },
    { name: 'Long Xuyen', population: 280000, lat: 10.3869, lon: 105.4350, timezone: 'Asia/Ho_Chi_Minh', capital: false, major: true },
    { name: 'Ha Long', population: 230000, lat: 20.9537, lon: 107.0447, timezone: 'Asia/Ho_Chi_Minh', capital: false, major: true },
    { name: 'Buon Ma Thuot', population: 340000, lat: 12.6667, lon: 108.0500, timezone: 'Asia/Ho_Chi_Minh', capital: false, major: true },
  ],

  // Thailand
  TH: [
    { name: 'Bangkok', population: 10539000, lat: 13.7563, lon: 100.5018, timezone: 'Asia/Bangkok', capital: true, major: true },
    { name: 'Chiang Mai', population: 174000, lat: 18.7883, lon: 98.9853, timezone: 'Asia/Bangkok', capital: false, major: true },
    { name: 'Phuket', population: 89072, lat: 7.8804, lon: 98.3923, timezone: 'Asia/Bangkok', capital: false, major: true },
    { name: 'Pattaya', population: 119532, lat: 12.9236, lon: 100.8825, timezone: 'Asia/Bangkok', capital: false, major: true },
    { name: 'Nonthaburi', population: 270609, lat: 13.8621, lon: 100.5144, timezone: 'Asia/Bangkok', capital: false, major: true },
    { name: 'Nakhon Ratchasima', population: 174332, lat: 14.9799, lon: 102.0977, timezone: 'Asia/Bangkok', capital: false, major: true },
    { name: 'Chon Buri', population: 219164, lat: 13.3611, lon: 100.9847, timezone: 'Asia/Bangkok', capital: false, major: true },
    { name: 'Hat Yai', population: 158218, lat: 7.0089, lon: 100.4677, timezone: 'Asia/Bangkok', capital: false, major: true },
    { name: 'Udon Thani', population: 152369, lat: 17.4138, lon: 102.7877, timezone: 'Asia/Bangkok', capital: false, major: true },
    { name: 'Pak Kret', population: 184506, lat: 13.9093, lon: 100.4986, timezone: 'Asia/Bangkok', capital: false, major: true },
    { name: 'Krabi', population: 30000, lat: 8.0863, lon: 98.9063, timezone: 'Asia/Bangkok', capital: false, major: true },
    { name: 'Ayutthaya', population: 53000, lat: 14.3532, lon: 100.5776, timezone: 'Asia/Bangkok', capital: false, major: true },
    { name: 'Khon Kaen', population: 147579, lat: 16.4322, lon: 102.8236, timezone: 'Asia/Bangkok', capital: false, major: true },
    { name: 'Hua Hin', population: 63000, lat: 12.5708, lon: 99.9577, timezone: 'Asia/Bangkok', capital: false, major: true },
    { name: 'Koh Samui', population: 50000, lat: 9.5359, lon: 100.0636, timezone: 'Asia/Bangkok', capital: false, major: true },
  ],

  // Indonesia
  ID: [
    { name: 'Jakarta', population: 10562088, lat: -6.2088, lon: 106.8456, timezone: 'Asia/Jakarta', capital: true, major: true },
    { name: 'Surabaya', population: 2874699, lat: -7.2575, lon: 112.7521, timezone: 'Asia/Jakarta', capital: false, major: true },
    { name: 'Bandung', population: 2575478, lat: -6.9175, lon: 107.6191, timezone: 'Asia/Jakarta', capital: false, major: true },
    { name: 'Medan', population: 2435252, lat: 3.5952, lon: 98.6722, timezone: 'Asia/Jakarta', capital: false, major: true },
    { name: 'Semarang', population: 1729428, lat: -6.9667, lon: 110.4167, timezone: 'Asia/Jakarta', capital: false, major: true },
    { name: 'Makassar', population: 1489359, lat: -5.1477, lon: 119.4327, timezone: 'Asia/Makassar', capital: false, major: true },
    { name: 'Palembang', population: 1708413, lat: -2.9908, lon: 104.7560, timezone: 'Asia/Jakarta', capital: false, major: true },
    { name: 'Tangerang', population: 2139891, lat: -6.1781, lon: 106.6300, timezone: 'Asia/Jakarta', capital: false, major: true },
    { name: 'Denpasar', population: 897300, lat: -8.6705, lon: 115.2126, timezone: 'Asia/Makassar', capital: false, major: true },
    { name: 'Yogyakarta', population: 373589, lat: -7.7956, lon: 110.3695, timezone: 'Asia/Jakarta', capital: false, major: true },
    { name: 'Bogor', population: 1064687, lat: -6.5944, lon: 106.7892, timezone: 'Asia/Jakarta', capital: false, major: true },
    { name: 'Batam', population: 1196396, lat: 1.0456, lon: 104.0305, timezone: 'Asia/Jakarta', capital: false, major: true },
    { name: 'Malang', population: 895387, lat: -7.9797, lon: 112.6304, timezone: 'Asia/Jakarta', capital: false, major: true },
    { name: 'Depok', population: 2254513, lat: -6.4025, lon: 106.7942, timezone: 'Asia/Jakarta', capital: false, major: true },
    { name: 'Padang', population: 909040, lat: -0.9471, lon: 100.4172, timezone: 'Asia/Jakarta', capital: false, major: true },
    { name: 'Ubud', population: 74800, lat: -8.5069, lon: 115.2625, timezone: 'Asia/Makassar', capital: false, major: true },
  ],

  // Philippines
  PH: [
    { name: 'Manila', population: 1846513, lat: 14.5995, lon: 120.9842, timezone: 'Asia/Manila', capital: true, major: true },
    { name: 'Quezon City', population: 2960048, lat: 14.6760, lon: 121.0437, timezone: 'Asia/Manila', capital: false, major: true },
    { name: 'Davao City', population: 1776949, lat: 7.1907, lon: 125.4553, timezone: 'Asia/Manila', capital: false, major: true },
    { name: 'Caloocan', population: 1661584, lat: 14.6490, lon: 120.9820, timezone: 'Asia/Manila', capital: false, major: true },
    { name: 'Cebu City', population: 964169, lat: 10.3157, lon: 123.8854, timezone: 'Asia/Manila', capital: false, major: true },
    { name: 'Zamboanga City', population: 977234, lat: 6.9214, lon: 122.0790, timezone: 'Asia/Manila', capital: false, major: true },
    { name: 'Antipolo', population: 887399, lat: 14.5862, lon: 121.1760, timezone: 'Asia/Manila', capital: false, major: true },
    { name: 'Pasig', population: 803159, lat: 14.5764, lon: 121.0851, timezone: 'Asia/Manila', capital: false, major: true },
    { name: 'Taguig', population: 886722, lat: 14.5176, lon: 121.0509, timezone: 'Asia/Manila', capital: false, major: true },
    { name: 'Cagayan de Oro', population: 728402, lat: 8.4542, lon: 124.6319, timezone: 'Asia/Manila', capital: false, major: true },
    { name: 'Makati', population: 629616, lat: 14.5547, lon: 121.0244, timezone: 'Asia/Manila', capital: false, major: true },
    { name: 'Iloilo City', population: 457626, lat: 10.7202, lon: 122.5621, timezone: 'Asia/Manila', capital: false, major: true },
    { name: 'Bacolod', population: 600783, lat: 10.6770, lon: 122.9503, timezone: 'Asia/Manila', capital: false, major: true },
    { name: 'General Santos', population: 697315, lat: 6.1164, lon: 125.1716, timezone: 'Asia/Manila', capital: false, major: true },
    { name: 'Baguio', population: 366358, lat: 16.4023, lon: 120.5960, timezone: 'Asia/Manila', capital: false, major: true },
  ],

  // Japan
  JP: [
    { name: 'Tokyo', population: 13960000, lat: 35.6762, lon: 139.6503, timezone: 'Asia/Tokyo', capital: true, major: true },
    { name: 'Yokohama', population: 3748000, lat: 35.4437, lon: 139.6380, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Osaka', population: 2725000, lat: 34.6937, lon: 135.5023, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Nagoya', population: 2296000, lat: 35.1815, lon: 136.9066, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Sapporo', population: 1973000, lat: 43.0642, lon: 141.3469, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Kobe', population: 1544000, lat: 34.6901, lon: 135.1955, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Kyoto', population: 1475000, lat: 35.0116, lon: 135.7681, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Fukuoka', population: 1581000, lat: 33.5904, lon: 130.4017, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Kawasaki', population: 1531000, lat: 35.5309, lon: 139.7028, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Saitama', population: 1263000, lat: 35.8617, lon: 139.6455, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Hiroshima', population: 1199000, lat: 34.3853, lon: 132.4553, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Sendai', population: 1096000, lat: 38.2682, lon: 140.8694, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Kitakyushu', population: 945000, lat: 33.8834, lon: 130.8751, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Chiba', population: 980000, lat: 35.6074, lon: 140.1065, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Sakai', population: 828000, lat: 34.5733, lon: 135.4830, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Niigata', population: 786000, lat: 37.9161, lon: 139.0364, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Hamamatsu', population: 797000, lat: 34.7108, lon: 137.7261, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Shizuoka', population: 690000, lat: 34.9756, lon: 138.3828, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Okayama', population: 720000, lat: 34.6617, lon: 133.9250, timezone: 'Asia/Tokyo', capital: false, major: true },
    { name: 'Nara', population: 359000, lat: 34.6851, lon: 135.8048, timezone: 'Asia/Tokyo', capital: false, major: true },
  ],

  // South Korea
  KR: [
    { name: 'Seoul', population: 9776000, lat: 37.5665, lon: 126.9780, timezone: 'Asia/Seoul', capital: true, major: true },
    { name: 'Busan', population: 3414950, lat: 35.1796, lon: 129.0756, timezone: 'Asia/Seoul', capital: false, major: true },
    { name: 'Incheon', population: 2954642, lat: 37.4563, lon: 126.7052, timezone: 'Asia/Seoul', capital: false, major: true },
    { name: 'Daegu', population: 2427954, lat: 35.8714, lon: 128.6014, timezone: 'Asia/Seoul', capital: false, major: true },
    { name: 'Daejeon', population: 1475221, lat: 36.3504, lon: 127.3845, timezone: 'Asia/Seoul', capital: false, major: true },
    { name: 'Gwangju', population: 1460000, lat: 35.1595, lon: 126.8526, timezone: 'Asia/Seoul', capital: false, major: true },
    { name: 'Suwon', population: 1194313, lat: 37.2636, lon: 127.0286, timezone: 'Asia/Seoul', capital: false, major: true },
    { name: 'Ulsan', population: 1147256, lat: 35.5384, lon: 129.3114, timezone: 'Asia/Seoul', capital: false, major: true },
    { name: 'Changwon', population: 1063895, lat: 35.2281, lon: 128.6811, timezone: 'Asia/Seoul', capital: false, major: true },
    { name: 'Goyang', population: 1076000, lat: 37.6584, lon: 126.8320, timezone: 'Asia/Seoul', capital: false, major: true },
    { name: 'Yongin', population: 1053565, lat: 37.2411, lon: 127.1776, timezone: 'Asia/Seoul', capital: false, major: true },
    { name: 'Seongnam', population: 948757, lat: 37.4386, lon: 127.1378, timezone: 'Asia/Seoul', capital: false, major: true },
    { name: 'Jeju City', population: 489154, lat: 33.4996, lon: 126.5312, timezone: 'Asia/Seoul', capital: false, major: true },
  ],

  // Malaysia
  MY: [
    { name: 'Kuala Lumpur', population: 1982112, lat: 3.1390, lon: 101.6869, timezone: 'Asia/Kuala_Lumpur', capital: true, major: true },
    { name: 'George Town', population: 708127, lat: 5.4141, lon: 100.3288, timezone: 'Asia/Kuala_Lumpur', capital: false, major: true },
    { name: 'Ipoh', population: 759952, lat: 4.5975, lon: 101.0901, timezone: 'Asia/Kuala_Lumpur', capital: false, major: true },
    { name: 'Johor Bahru', population: 1711191, lat: 1.4927, lon: 103.7414, timezone: 'Asia/Kuala_Lumpur', capital: false, major: true },
    { name: 'Melaka', population: 579000, lat: 2.1896, lon: 102.2501, timezone: 'Asia/Kuala_Lumpur', capital: false, major: true },
    { name: 'Kota Kinabalu', population: 500421, lat: 5.9804, lon: 116.0735, timezone: 'Asia/Kuching', capital: false, major: true },
    { name: 'Kuching', population: 658549, lat: 1.5535, lon: 110.3593, timezone: 'Asia/Kuching', capital: false, major: true },
    { name: 'Petaling Jaya', population: 638516, lat: 3.1073, lon: 101.6067, timezone: 'Asia/Kuala_Lumpur', capital: false, major: true },
    { name: 'Shah Alam', population: 742300, lat: 3.0733, lon: 101.5185, timezone: 'Asia/Kuala_Lumpur', capital: false, major: true },
    { name: 'Langkawi', population: 99000, lat: 6.3500, lon: 99.8000, timezone: 'Asia/Kuala_Lumpur', capital: false, major: true },
  ],

  // France
  FR: [
    { name: 'Paris', population: 2161000, lat: 48.8566, lon: 2.3522, timezone: 'Europe/Paris', capital: true, major: true },
    { name: 'Marseille', population: 870018, lat: 43.2965, lon: 5.3698, timezone: 'Europe/Paris', capital: false, major: true },
    { name: 'Lyon', population: 513275, lat: 45.7640, lon: 4.8357, timezone: 'Europe/Paris', capital: false, major: true },
    { name: 'Toulouse', population: 471941, lat: 43.6047, lon: 1.4442, timezone: 'Europe/Paris', capital: false, major: true },
    { name: 'Nice', population: 340017, lat: 43.7102, lon: 7.2620, timezone: 'Europe/Paris', capital: false, major: true },
    { name: 'Nantes', population: 303382, lat: 47.2184, lon: -1.5536, timezone: 'Europe/Paris', capital: false, major: true },
    { name: 'Strasbourg', population: 277270, lat: 48.5734, lon: 7.7521, timezone: 'Europe/Paris', capital: false, major: true },
    { name: 'Montpellier', population: 281613, lat: 43.6108, lon: 3.8767, timezone: 'Europe/Paris', capital: false, major: true },
    { name: 'Bordeaux', population: 249712, lat: 44.8378, lon: -0.5792, timezone: 'Europe/Paris', capital: false, major: true },
    { name: 'Lille', population: 232787, lat: 50.6292, lon: 3.0573, timezone: 'Europe/Paris', capital: false, major: true },
    { name: 'Rennes', population: 216268, lat: 48.1173, lon: -1.6778, timezone: 'Europe/Paris', capital: false, major: true },
    { name: 'Reims', population: 183113, lat: 49.2583, lon: 4.0317, timezone: 'Europe/Paris', capital: false, major: true },
    { name: 'Cannes', population: 73868, lat: 43.5528, lon: 7.0174, timezone: 'Europe/Paris', capital: false, major: true },
    { name: 'Avignon', population: 91143, lat: 43.9493, lon: 4.8055, timezone: 'Europe/Paris', capital: false, major: true },
  ],

  // Italy
  IT: [
    { name: 'Rome', population: 2872800, lat: 41.9028, lon: 12.4964, timezone: 'Europe/Rome', capital: true, major: true },
    { name: 'Milan', population: 1396059, lat: 45.4642, lon: 9.1900, timezone: 'Europe/Rome', capital: false, major: true },
    { name: 'Naples', population: 967069, lat: 40.8518, lon: 14.2681, timezone: 'Europe/Rome', capital: false, major: true },
    { name: 'Turin', population: 870952, lat: 45.0703, lon: 7.6869, timezone: 'Europe/Rome', capital: false, major: true },
    { name: 'Palermo', population: 676118, lat: 38.1157, lon: 13.3615, timezone: 'Europe/Rome', capital: false, major: true },
    { name: 'Genoa', population: 583601, lat: 44.4056, lon: 8.9463, timezone: 'Europe/Rome', capital: false, major: true },
    { name: 'Bologna', population: 390636, lat: 44.4949, lon: 11.3426, timezone: 'Europe/Rome', capital: false, major: true },
    { name: 'Florence', population: 382258, lat: 43.7696, lon: 11.2558, timezone: 'Europe/Rome', capital: false, major: true },
    { name: 'Bari', population: 320475, lat: 41.1171, lon: 16.8719, timezone: 'Europe/Rome', capital: false, major: true },
    { name: 'Catania', population: 311584, lat: 37.5079, lon: 15.0830, timezone: 'Europe/Rome', capital: false, major: true },
    { name: 'Venice', population: 261905, lat: 45.4408, lon: 12.3155, timezone: 'Europe/Rome', capital: false, major: true },
    { name: 'Verona', population: 259610, lat: 45.4384, lon: 10.9916, timezone: 'Europe/Rome', capital: false, major: true },
    { name: 'Messina', population: 234293, lat: 38.1938, lon: 15.5540, timezone: 'Europe/Rome', capital: false, major: true },
    { name: 'Padua', population: 210401, lat: 45.4064, lon: 11.8768, timezone: 'Europe/Rome', capital: false, major: true },
    { name: 'Trieste', population: 204338, lat: 45.6495, lon: 13.7768, timezone: 'Europe/Rome', capital: false, major: true },
  ],

  // Spain
  ES: [
    { name: 'Madrid', population: 3223334, lat: 40.4168, lon: -3.7038, timezone: 'Europe/Madrid', capital: true, major: true },
    { name: 'Barcelona', population: 1620343, lat: 41.3851, lon: 2.1734, timezone: 'Europe/Madrid', capital: false, major: true },
    { name: 'Valencia', population: 791413, lat: 39.4699, lon: -0.3763, timezone: 'Europe/Madrid', capital: false, major: true },
    { name: 'Seville', population: 688711, lat: 37.3891, lon: -5.9845, timezone: 'Europe/Madrid', capital: false, major: true },
    { name: 'Zaragoza', population: 674317, lat: 41.6488, lon: -0.8891, timezone: 'Europe/Madrid', capital: false, major: true },
    { name: 'Malaga', population: 571026, lat: 36.7213, lon: -4.4214, timezone: 'Europe/Madrid', capital: false, major: true },
    { name: 'Murcia', population: 447182, lat: 37.9922, lon: -1.1307, timezone: 'Europe/Madrid', capital: false, major: true },
    { name: 'Palma', population: 416065, lat: 39.5696, lon: 2.6502, timezone: 'Europe/Madrid', capital: false, major: true },
    { name: 'Las Palmas', population: 379925, lat: 28.1236, lon: -15.4366, timezone: 'Atlantic/Canary', capital: false, major: true },
    { name: 'Bilbao', population: 345821, lat: 43.2630, lon: -2.9350, timezone: 'Europe/Madrid', capital: false, major: true },
    { name: 'Alicante', population: 330525, lat: 38.3452, lon: -0.4810, timezone: 'Europe/Madrid', capital: false, major: true },
    { name: 'Granada', population: 232770, lat: 37.1773, lon: -3.5986, timezone: 'Europe/Madrid', capital: false, major: true },
    { name: 'San Sebastian', population: 186185, lat: 43.3183, lon: -1.9812, timezone: 'Europe/Madrid', capital: false, major: true },
    { name: 'Ibiza', population: 49783, lat: 38.9067, lon: 1.4206, timezone: 'Europe/Madrid', capital: false, major: true },
  ],

  // Germany
  DE: [
    { name: 'Berlin', population: 3644826, lat: 52.5200, lon: 13.4050, timezone: 'Europe/Berlin', capital: true, major: true },
    { name: 'Hamburg', population: 1841179, lat: 53.5511, lon: 9.9937, timezone: 'Europe/Berlin', capital: false, major: true },
    { name: 'Munich', population: 1471508, lat: 48.1351, lon: 11.5820, timezone: 'Europe/Berlin', capital: false, major: true },
    { name: 'Cologne', population: 1085664, lat: 50.9375, lon: 6.9603, timezone: 'Europe/Berlin', capital: false, major: true },
    { name: 'Frankfurt', population: 753056, lat: 50.1109, lon: 8.6821, timezone: 'Europe/Berlin', capital: false, major: true },
    { name: 'Stuttgart', population: 634830, lat: 48.7758, lon: 9.1829, timezone: 'Europe/Berlin', capital: false, major: true },
    { name: 'Dusseldorf', population: 619294, lat: 51.2277, lon: 6.7735, timezone: 'Europe/Berlin', capital: false, major: true },
    { name: 'Dortmund', population: 586181, lat: 51.5136, lon: 7.4653, timezone: 'Europe/Berlin', capital: false, major: true },
    { name: 'Essen', population: 582760, lat: 51.4556, lon: 7.0116, timezone: 'Europe/Berlin', capital: false, major: true },
    { name: 'Leipzig', population: 587857, lat: 51.3397, lon: 12.3731, timezone: 'Europe/Berlin', capital: false, major: true },
    { name: 'Bremen', population: 569396, lat: 53.0793, lon: 8.8017, timezone: 'Europe/Berlin', capital: false, major: true },
    { name: 'Dresden', population: 554649, lat: 51.0504, lon: 13.7373, timezone: 'Europe/Berlin', capital: false, major: true },
    { name: 'Hannover', population: 535061, lat: 52.3759, lon: 9.7320, timezone: 'Europe/Berlin', capital: false, major: true },
    { name: 'Nuremberg', population: 518365, lat: 49.4521, lon: 11.0767, timezone: 'Europe/Berlin', capital: false, major: true },
  ],

  // United Kingdom
  GB: [
    { name: 'London', population: 8982000, lat: 51.5074, lon: -0.1278, timezone: 'Europe/London', capital: true, major: true },
    { name: 'Birmingham', population: 1141816, lat: 52.4862, lon: -1.8904, timezone: 'Europe/London', capital: false, major: true },
    { name: 'Manchester', population: 547627, lat: 53.4808, lon: -2.2426, timezone: 'Europe/London', capital: false, major: true },
    { name: 'Leeds', population: 793139, lat: 53.8008, lon: -1.5491, timezone: 'Europe/London', capital: false, major: true },
    { name: 'Glasgow', population: 633120, lat: 55.8642, lon: -4.2518, timezone: 'Europe/London', capital: false, major: true },
    { name: 'Liverpool', population: 498042, lat: 53.4084, lon: -2.9916, timezone: 'Europe/London', capital: false, major: true },
    { name: 'Edinburgh', population: 524930, lat: 55.9533, lon: -3.1883, timezone: 'Europe/London', capital: false, major: true },
    { name: 'Sheffield', population: 584028, lat: 53.3811, lon: -1.4701, timezone: 'Europe/London', capital: false, major: true },
    { name: 'Bristol', population: 463377, lat: 51.4545, lon: -2.5879, timezone: 'Europe/London', capital: false, major: true },
    { name: 'Newcastle', population: 302820, lat: 54.9783, lon: -1.6178, timezone: 'Europe/London', capital: false, major: true },
    { name: 'Leicester', population: 355218, lat: 52.6369, lon: -1.1398, timezone: 'Europe/London', capital: false, major: true },
    { name: 'Nottingham', population: 331069, lat: 52.9548, lon: -1.1581, timezone: 'Europe/London', capital: false, major: true },
    { name: 'Oxford', population: 154600, lat: 51.7520, lon: -1.2577, timezone: 'Europe/London', capital: false, major: true },
    { name: 'Cambridge', population: 145818, lat: 52.2053, lon: 0.1218, timezone: 'Europe/London', capital: false, major: true },
  ],

  // Australia
  AU: [
    { name: 'Sydney', population: 5312163, lat: -33.8688, lon: 151.2093, timezone: 'Australia/Sydney', capital: false, major: true },
    { name: 'Melbourne', population: 5078193, lat: -37.8136, lon: 144.9631, timezone: 'Australia/Melbourne', capital: false, major: true },
    { name: 'Brisbane', population: 2514184, lat: -27.4698, lon: 153.0251, timezone: 'Australia/Brisbane', capital: false, major: true },
    { name: 'Perth', population: 2125114, lat: -31.9505, lon: 115.8605, timezone: 'Australia/Perth', capital: false, major: true },
    { name: 'Adelaide', population: 1359760, lat: -34.9285, lon: 138.6007, timezone: 'Australia/Adelaide', capital: false, major: true },
    { name: 'Gold Coast', population: 679127, lat: -28.0167, lon: 153.4000, timezone: 'Australia/Brisbane', capital: false, major: true },
    { name: 'Canberra', population: 453558, lat: -35.2809, lon: 149.1300, timezone: 'Australia/Canberra', capital: true, major: true },
    { name: 'Newcastle', population: 322278, lat: -32.9283, lon: 151.7817, timezone: 'Australia/Sydney', capital: false, major: true },
    { name: 'Wollongong', population: 302739, lat: -34.4278, lon: 150.8931, timezone: 'Australia/Sydney', capital: false, major: true },
    { name: 'Hobart', population: 240342, lat: -42.8821, lon: 147.3272, timezone: 'Australia/Hobart', capital: false, major: true },
    { name: 'Cairns', population: 152729, lat: -16.9186, lon: 145.7781, timezone: 'Australia/Brisbane', capital: false, major: true },
    { name: 'Darwin', population: 147255, lat: -12.4634, lon: 130.8456, timezone: 'Australia/Darwin', capital: false, major: true },
  ],

  // Canada
  CA: [
    { name: 'Toronto', population: 2930000, lat: 43.6532, lon: -79.3832, timezone: 'America/Toronto', capital: false, major: true },
    { name: 'Montreal', population: 1780000, lat: 45.5017, lon: -73.5673, timezone: 'America/Toronto', capital: false, major: true },
    { name: 'Vancouver', population: 675218, lat: 49.2827, lon: -123.1207, timezone: 'America/Vancouver', capital: false, major: true },
    { name: 'Calgary', population: 1336000, lat: 51.0447, lon: -114.0719, timezone: 'America/Edmonton', capital: false, major: true },
    { name: 'Edmonton', population: 981280, lat: 53.5461, lon: -113.4938, timezone: 'America/Edmonton', capital: false, major: true },
    { name: 'Ottawa', population: 994837, lat: 45.4215, lon: -75.6972, timezone: 'America/Toronto', capital: true, major: true },
    { name: 'Winnipeg', population: 749534, lat: 49.8951, lon: -97.1384, timezone: 'America/Winnipeg', capital: false, major: true },
    { name: 'Quebec City', population: 542298, lat: 46.8139, lon: -71.2080, timezone: 'America/Toronto', capital: false, major: true },
    { name: 'Hamilton', population: 569353, lat: 43.2557, lon: -79.8711, timezone: 'America/Toronto', capital: false, major: true },
    { name: 'Victoria', population: 91867, lat: 48.4284, lon: -123.3656, timezone: 'America/Vancouver', capital: false, major: true },
    { name: 'Halifax', population: 431479, lat: 44.6488, lon: -63.5752, timezone: 'America/Halifax', capital: false, major: true },
  ],

  // Mexico
  MX: [
    { name: 'Mexico City', population: 9209944, lat: 19.4326, lon: -99.1332, timezone: 'America/Mexico_City', capital: true, major: true },
    { name: 'Guadalajara', population: 1495189, lat: 20.6597, lon: -103.3496, timezone: 'America/Mexico_City', capital: false, major: true },
    { name: 'Monterrey', population: 1135512, lat: 25.6866, lon: -100.3161, timezone: 'America/Monterrey', capital: false, major: true },
    { name: 'Puebla', population: 1692181, lat: 19.0414, lon: -98.2063, timezone: 'America/Mexico_City', capital: false, major: true },
    { name: 'Tijuana', population: 1810645, lat: 32.5149, lon: -117.0382, timezone: 'America/Tijuana', capital: false, major: true },
    { name: 'Cancun', population: 888797, lat: 21.1619, lon: -86.8515, timezone: 'America/Cancun', capital: false, major: true },
    { name: 'Leon', population: 1579803, lat: 21.1250, lon: -101.6864, timezone: 'America/Mexico_City', capital: false, major: true },
    { name: 'Juarez', population: 1501551, lat: 31.6904, lon: -106.4245, timezone: 'America/Ojinaga', capital: false, major: true },
    { name: 'Zapopan', population: 1332272, lat: 20.7214, lon: -103.3918, timezone: 'America/Mexico_City', capital: false, major: true },
    { name: 'Merida', population: 892363, lat: 20.9674, lon: -89.5926, timezone: 'America/Merida', capital: false, major: true },
    { name: 'San Luis Potosi', population: 824229, lat: 22.1565, lon: -100.9855, timezone: 'America/Mexico_City', capital: false, major: true },
    { name: 'Aguascalientes', population: 877190, lat: 21.8853, lon: -102.2916, timezone: 'America/Mexico_City', capital: false, major: true },
    { name: 'Queretaro', population: 878931, lat: 20.5888, lon: -100.3899, timezone: 'America/Mexico_City', capital: false, major: true },
    { name: 'Playa del Carmen', population: 300000, lat: 20.6296, lon: -87.0739, timezone: 'America/Cancun', capital: false, major: true },
  ],

  // Brazil
  BR: [
    { name: 'Sao Paulo', population: 12325232, lat: -23.5505, lon: -46.6333, timezone: 'America/Sao_Paulo', capital: false, major: true },
    { name: 'Rio de Janeiro', population: 6748000, lat: -22.9068, lon: -43.1729, timezone: 'America/Sao_Paulo', capital: false, major: true },
    { name: 'Brasilia', population: 3055149, lat: -15.8267, lon: -47.9218, timezone: 'America/Sao_Paulo', capital: true, major: true },
    { name: 'Salvador', population: 2886698, lat: -12.9714, lon: -38.5014, timezone: 'America/Bahia', capital: false, major: true },
    { name: 'Fortaleza', population: 2686612, lat: -3.7172, lon: -38.5433, timezone: 'America/Fortaleza', capital: false, major: true },
    { name: 'Belo Horizonte', population: 2523794, lat: -19.9167, lon: -43.9345, timezone: 'America/Sao_Paulo', capital: false, major: true },
    { name: 'Manaus', population: 2219580, lat: -3.1190, lon: -60.0217, timezone: 'America/Manaus', capital: false, major: true },
    { name: 'Curitiba', population: 1948626, lat: -25.4284, lon: -49.2733, timezone: 'America/Sao_Paulo', capital: false, major: true },
    { name: 'Recife', population: 1653461, lat: -8.0476, lon: -34.8770, timezone: 'America/Recife', capital: false, major: true },
    { name: 'Porto Alegre', population: 1488252, lat: -30.0346, lon: -51.2177, timezone: 'America/Sao_Paulo', capital: false, major: true },
    { name: 'Goiania', population: 1536097, lat: -16.6869, lon: -49.2648, timezone: 'America/Sao_Paulo', capital: false, major: true },
    { name: 'Belem', population: 1499641, lat: -1.4558, lon: -48.5044, timezone: 'America/Belem', capital: false, major: true },
    { name: 'Florianopolis', population: 508826, lat: -27.5954, lon: -48.5480, timezone: 'America/Sao_Paulo', capital: false, major: true },
  ],

  // Turkey
  TR: [
    { name: 'Istanbul', population: 15460000, lat: 41.0082, lon: 28.9784, timezone: 'Europe/Istanbul', capital: false, major: true },
    { name: 'Ankara', population: 5663322, lat: 39.9334, lon: 32.8597, timezone: 'Europe/Istanbul', capital: true, major: true },
    { name: 'Izmir', population: 4367251, lat: 38.4237, lon: 27.1428, timezone: 'Europe/Istanbul', capital: false, major: true },
    { name: 'Bursa', population: 3056120, lat: 40.1826, lon: 29.0665, timezone: 'Europe/Istanbul', capital: false, major: true },
    { name: 'Antalya', population: 2548308, lat: 36.8969, lon: 30.7133, timezone: 'Europe/Istanbul', capital: false, major: true },
    { name: 'Adana', population: 2237940, lat: 37.0000, lon: 35.3213, timezone: 'Europe/Istanbul', capital: false, major: true },
    { name: 'Gaziantep', population: 2069364, lat: 37.0662, lon: 37.3833, timezone: 'Europe/Istanbul', capital: false, major: true },
    { name: 'Konya', population: 2232374, lat: 37.8746, lon: 32.4932, timezone: 'Europe/Istanbul', capital: false, major: true },
    { name: 'Bodrum', population: 177328, lat: 37.0344, lon: 27.4305, timezone: 'Europe/Istanbul', capital: false, major: true },
    { name: 'Fethiye', population: 150000, lat: 36.6221, lon: 29.1167, timezone: 'Europe/Istanbul', capital: false, major: true },
    { name: 'Cappadocia', population: 50000, lat: 38.6431, lon: 34.8287, timezone: 'Europe/Istanbul', capital: false, major: true },
  ],

  // UAE
  AE: [
    { name: 'Dubai', population: 3478300, lat: 25.2048, lon: 55.2708, timezone: 'Asia/Dubai', capital: false, major: true },
    { name: 'Abu Dhabi', population: 1482816, lat: 24.4539, lon: 54.3773, timezone: 'Asia/Dubai', capital: true, major: true },
    { name: 'Sharjah', population: 1684649, lat: 25.3573, lon: 55.4033, timezone: 'Asia/Dubai', capital: false, major: true },
    { name: 'Al Ain', population: 766936, lat: 24.2075, lon: 55.7447, timezone: 'Asia/Dubai', capital: false, major: true },
    { name: 'Ajman', population: 540000, lat: 25.4052, lon: 55.5136, timezone: 'Asia/Dubai', capital: false, major: true },
    { name: 'Ras Al Khaimah', population: 400000, lat: 25.7854, lon: 55.9432, timezone: 'Asia/Dubai', capital: false, major: true },
    { name: 'Fujairah', population: 225360, lat: 25.1288, lon: 56.3265, timezone: 'Asia/Dubai', capital: false, major: true },
  ],

  // Egypt
  EG: [
    { name: 'Cairo', population: 20900604, lat: 30.0444, lon: 31.2357, timezone: 'Africa/Cairo', capital: true, major: true },
    { name: 'Alexandria', population: 5200000, lat: 31.2001, lon: 29.9187, timezone: 'Africa/Cairo', capital: false, major: true },
    { name: 'Giza', population: 8800000, lat: 30.0131, lon: 31.2089, timezone: 'Africa/Cairo', capital: false, major: true },
    { name: 'Sharm El Sheikh', population: 73000, lat: 27.9158, lon: 34.3300, timezone: 'Africa/Cairo', capital: false, major: true },
    { name: 'Luxor', population: 506588, lat: 25.6872, lon: 32.6396, timezone: 'Africa/Cairo', capital: false, major: true },
    { name: 'Aswan', population: 290327, lat: 24.0889, lon: 32.8998, timezone: 'Africa/Cairo', capital: false, major: true },
    { name: 'Hurghada', population: 248000, lat: 27.2579, lon: 33.8116, timezone: 'Africa/Cairo', capital: false, major: true },
    { name: 'Port Said', population: 749371, lat: 31.2653, lon: 32.3019, timezone: 'Africa/Cairo', capital: false, major: true },
    { name: 'Suez', population: 744189, lat: 29.9668, lon: 32.5498, timezone: 'Africa/Cairo', capital: false, major: true },
  ],

  // Additional major tourist/business destinations
  SG: [
    { name: 'Singapore', population: 5685807, lat: 1.3521, lon: 103.8198, timezone: 'Asia/Singapore', capital: true, major: true },
  ],

  NL: [
    { name: 'Amsterdam', population: 872680, lat: 52.3676, lon: 4.9041, timezone: 'Europe/Amsterdam', capital: true, major: true },
    { name: 'Rotterdam', population: 651446, lat: 51.9244, lon: 4.4777, timezone: 'Europe/Amsterdam', capital: false, major: true },
    { name: 'The Hague', population: 545163, lat: 52.0705, lon: 4.3007, timezone: 'Europe/Amsterdam', capital: false, major: true },
    { name: 'Utrecht', population: 357179, lat: 52.0907, lon: 5.1214, timezone: 'Europe/Amsterdam', capital: false, major: true },
  ],

  BE: [
    { name: 'Brussels', population: 1208542, lat: 50.8503, lon: 4.3517, timezone: 'Europe/Brussels', capital: true, major: true },
    { name: 'Antwerp', population: 529247, lat: 51.2213, lon: 4.4051, timezone: 'Europe/Brussels', capital: false, major: true },
    { name: 'Ghent', population: 262219, lat: 51.0543, lon: 3.7174, timezone: 'Europe/Brussels', capital: false, major: true },
    { name: 'Bruges', population: 118325, lat: 51.2093, lon: 3.2247, timezone: 'Europe/Brussels', capital: false, major: true },
  ],

  CH: [
    { name: 'Zurich', population: 421878, lat: 47.3769, lon: 8.5417, timezone: 'Europe/Zurich', capital: false, major: true },
    { name: 'Geneva', population: 203856, lat: 46.2044, lon: 6.1432, timezone: 'Europe/Zurich', capital: false, major: true },
    { name: 'Basel', population: 177654, lat: 47.5596, lon: 7.5886, timezone: 'Europe/Zurich', capital: false, major: true },
    { name: 'Bern', population: 133115, lat: 46.9480, lon: 7.4474, timezone: 'Europe/Zurich', capital: true, major: true },
    { name: 'Lucerne', population: 82257, lat: 47.0502, lon: 8.3093, timezone: 'Europe/Zurich', capital: false, major: true },
  ],

  AT: [
    { name: 'Vienna', population: 1911191, lat: 48.2082, lon: 16.3738, timezone: 'Europe/Vienna', capital: true, major: true },
    { name: 'Graz', population: 291007, lat: 47.0707, lon: 15.4395, timezone: 'Europe/Vienna', capital: false, major: true },
    { name: 'Linz', population: 206595, lat: 48.3069, lon: 14.2858, timezone: 'Europe/Vienna', capital: false, major: true },
    { name: 'Salzburg', population: 155021, lat: 47.8095, lon: 13.0550, timezone: 'Europe/Vienna', capital: false, major: true },
    { name: 'Innsbruck', population: 132493, lat: 47.2692, lon: 11.4041, timezone: 'Europe/Vienna', capital: false, major: true },
  ],

  PT: [
    { name: 'Lisbon', population: 504718, lat: 38.7223, lon: -9.1393, timezone: 'Europe/Lisbon', capital: true, major: true },
    { name: 'Porto', population: 231962, lat: 41.1579, lon: -8.6291, timezone: 'Europe/Lisbon', capital: false, major: true },
    { name: 'Faro', population: 64560, lat: 37.0194, lon: -7.9322, timezone: 'Europe/Lisbon', capital: false, major: true },
    { name: 'Funchal', population: 111892, lat: 32.6669, lon: -16.9241, timezone: 'Atlantic/Madeira', capital: false, major: true },
  ],

  GR: [
    { name: 'Athens', population: 3154000, lat: 37.9838, lon: 23.7275, timezone: 'Europe/Athens', capital: true, major: true },
    { name: 'Thessaloniki', population: 325182, lat: 40.6401, lon: 22.9444, timezone: 'Europe/Athens', capital: false, major: true },
    { name: 'Patras', population: 214580, lat: 38.2466, lon: 21.7346, timezone: 'Europe/Athens', capital: false, major: true },
    { name: 'Heraklion', population: 173993, lat: 35.3387, lon: 25.1442, timezone: 'Europe/Athens', capital: false, major: true },
    { name: 'Santorini', population: 15550, lat: 36.3932, lon: 25.4615, timezone: 'Europe/Athens', capital: false, major: true },
    { name: 'Mykonos', population: 10134, lat: 37.4467, lon: 25.3289, timezone: 'Europe/Athens', capital: false, major: true },
  ],

  CZ: [
    { name: 'Prague', population: 1309000, lat: 50.0755, lon: 14.4378, timezone: 'Europe/Prague', capital: true, major: true },
    { name: 'Brno', population: 381346, lat: 49.1951, lon: 16.6068, timezone: 'Europe/Prague', capital: false, major: true },
    { name: 'Ostrava', population: 289128, lat: 49.8209, lon: 18.2625, timezone: 'Europe/Prague', capital: false, major: true },
  ],

  PL: [
    { name: 'Warsaw', population: 1790658, lat: 52.2297, lon: 21.0122, timezone: 'Europe/Warsaw', capital: true, major: true },
    { name: 'Krakow', population: 779115, lat: 50.0647, lon: 19.9450, timezone: 'Europe/Warsaw', capital: false, major: true },
    { name: 'Wroclaw', population: 641928, lat: 51.1079, lon: 17.0385, timezone: 'Europe/Warsaw', capital: false, major: true },
    { name: 'Gdansk', population: 470621, lat: 54.3520, lon: 18.6466, timezone: 'Europe/Warsaw', capital: false, major: true },
  ],

  RU: [
    { name: 'Moscow', population: 12615279, lat: 55.7558, lon: 37.6173, timezone: 'Europe/Moscow', capital: true, major: true },
    { name: 'Saint Petersburg', population: 5384342, lat: 59.9343, lon: 30.3351, timezone: 'Europe/Moscow', capital: false, major: true },
    { name: 'Novosibirsk', population: 1625631, lat: 55.0084, lon: 82.9357, timezone: 'Asia/Novosibirsk', capital: false, major: true },
    { name: 'Yekaterinburg', population: 1493749, lat: 56.8389, lon: 60.6057, timezone: 'Asia/Yekaterinburg', capital: false, major: true },
    { name: 'Kazan', population: 1257391, lat: 55.8304, lon: 49.0661, timezone: 'Europe/Moscow', capital: false, major: true },
  ],

  AR: [
    { name: 'Buenos Aires', population: 3075646, lat: -34.6037, lon: -58.3816, timezone: 'America/Argentina/Buenos_Aires', capital: true, major: true },
    { name: 'Cordoba', population: 1391000, lat: -31.4201, lon: -64.1888, timezone: 'America/Argentina/Cordoba', capital: false, major: true },
    { name: 'Rosario', population: 1193605, lat: -32.9442, lon: -60.6505, timezone: 'America/Argentina/Cordoba', capital: false, major: true },
    { name: 'Mendoza', population: 115021, lat: -32.8895, lon: -68.8458, timezone: 'America/Argentina/Mendoza', capital: false, major: true },
  ],

  ZA: [
    { name: 'Johannesburg', population: 5783000, lat: -26.2041, lon: 28.0473, timezone: 'Africa/Johannesburg', capital: false, major: true },
    { name: 'Cape Town', population: 4618000, lat: -33.9249, lon: 18.4241, timezone: 'Africa/Johannesburg', capital: true, major: true },
    { name: 'Durban', population: 3442361, lat: -29.8587, lon: 31.0218, timezone: 'Africa/Johannesburg', capital: false, major: true },
    { name: 'Pretoria', population: 2921488, lat: -25.7479, lon: 28.2293, timezone: 'Africa/Johannesburg', capital: true, major: true },
    { name: 'Port Elizabeth', population: 1263051, lat: -33.9608, lon: 25.6022, timezone: 'Africa/Johannesburg', capital: false, major: true },
  ],

  NZ: [
    { name: 'Auckland', population: 1657200, lat: -36.8485, lon: 174.7633, timezone: 'Pacific/Auckland', capital: false, major: true },
    { name: 'Wellington', population: 215100, lat: -41.2865, lon: 174.7762, timezone: 'Pacific/Auckland', capital: true, major: true },
    { name: 'Christchurch', population: 380600, lat: -43.5321, lon: 172.6362, timezone: 'Pacific/Auckland', capital: false, major: true },
    { name: 'Queenstown', population: 15800, lat: -45.0312, lon: 168.6626, timezone: 'Pacific/Auckland', capital: false, major: true },
  ],

  IE: [
    { name: 'Dublin', population: 1228179, lat: 53.3498, lon: -6.2603, timezone: 'Europe/Dublin', capital: true, major: true },
    { name: 'Cork', population: 210853, lat: 51.8969, lon: -8.4863, timezone: 'Europe/Dublin', capital: false, major: true },
    { name: 'Galway', population: 79934, lat: 53.2707, lon: -9.0568, timezone: 'Europe/Dublin', capital: false, major: true },
  ],

  SE: [
    { name: 'Stockholm', population: 975904, lat: 59.3293, lon: 18.0686, timezone: 'Europe/Stockholm', capital: true, major: true },
    { name: 'Gothenburg', population: 579281, lat: 57.7089, lon: 11.9746, timezone: 'Europe/Stockholm', capital: false, major: true },
    { name: 'Malmo', population: 344166, lat: 55.6050, lon: 13.0038, timezone: 'Europe/Stockholm', capital: false, major: true },
  ],

  NO: [
    { name: 'Oslo', population: 697010, lat: 59.9139, lon: 10.7522, timezone: 'Europe/Oslo', capital: true, major: true },
    { name: 'Bergen', population: 283929, lat: 60.3913, lon: 5.3221, timezone: 'Europe/Oslo', capital: false, major: true },
    { name: 'Trondheim', population: 207595, lat: 63.4305, lon: 10.3951, timezone: 'Europe/Oslo', capital: false, major: true },
  ],

  DK: [
    { name: 'Copenhagen', population: 799033, lat: 55.6761, lon: 12.5683, timezone: 'Europe/Copenhagen', capital: true, major: true },
    { name: 'Aarhus', population: 285273, lat: 56.1629, lon: 10.2039, timezone: 'Europe/Copenhagen', capital: false, major: true },
    { name: 'Odense', population: 180760, lat: 55.4038, lon: 10.4024, timezone: 'Europe/Copenhagen', capital: false, major: true },
  ],

  FI: [
    { name: 'Helsinki', population: 656229, lat: 60.1699, lon: 24.9384, timezone: 'Europe/Helsinki', capital: true, major: true },
    { name: 'Espoo', population: 292796, lat: 60.2055, lon: 24.6559, timezone: 'Europe/Helsinki', capital: false, major: true },
    { name: 'Tampere', population: 244315, lat: 61.4978, lon: 23.7610, timezone: 'Europe/Helsinki', capital: false, major: true },
  ],

  IS: [
    { name: 'Reykjavik', population: 131136, lat: 64.1466, lon: -21.9426, timezone: 'Atlantic/Reykjavik', capital: true, major: true },
  ],

  MA: [
    { name: 'Casablanca', population: 3752000, lat: 33.5731, lon: -7.5898, timezone: 'Africa/Casablanca', capital: false, major: true },
    { name: 'Rabat', population: 580000, lat: 34.0209, lon: -6.8416, timezone: 'Africa/Casablanca', capital: true, major: true },
    { name: 'Marrakech', population: 928850, lat: 31.6295, lon: -7.9811, timezone: 'Africa/Casablanca', capital: false, major: true },
    { name: 'Fes', population: 1150131, lat: 34.0181, lon: -5.0078, timezone: 'Africa/Casablanca', capital: false, major: true },
  ],

  IL: [
    { name: 'Jerusalem', population: 919438, lat: 31.7683, lon: 35.2137, timezone: 'Asia/Jerusalem', capital: true, major: true },
    { name: 'Tel Aviv', population: 460613, lat: 32.0853, lon: 34.7818, timezone: 'Asia/Jerusalem', capital: false, major: true },
    { name: 'Haifa', population: 285316, lat: 32.7940, lon: 34.9896, timezone: 'Asia/Jerusalem', capital: false, major: true },
  ],

  JO: [
    { name: 'Amman', population: 4007526, lat: 31.9454, lon: 35.9284, timezone: 'Asia/Amman', capital: true, major: true },
    { name: 'Petra', population: 1000, lat: 30.3285, lon: 35.4444, timezone: 'Asia/Amman', capital: false, major: true },
  ],

  SA: [
    { name: 'Riyadh', population: 7676654, lat: 24.7136, lon: 46.6753, timezone: 'Asia/Riyadh', capital: true, major: true },
    { name: 'Jeddah', population: 4781000, lat: 21.4858, lon: 39.1925, timezone: 'Asia/Riyadh', capital: false, major: true },
    { name: 'Mecca', population: 2385509, lat: 21.3891, lon: 39.8579, timezone: 'Asia/Riyadh', capital: false, major: true },
    { name: 'Medina', population: 1300000, lat: 24.5247, lon: 39.5692, timezone: 'Asia/Riyadh', capital: false, major: true },
  ],

  PE: [
    { name: 'Lima', population: 9751717, lat: -12.0464, lon: -77.0428, timezone: 'America/Lima', capital: true, major: true },
    { name: 'Cusco', population: 428450, lat: -13.5319, lon: -71.9675, timezone: 'America/Lima', capital: false, major: true },
    { name: 'Arequipa', population: 1008290, lat: -16.4090, lon: -71.5375, timezone: 'America/Lima', capital: false, major: true },
  ],

  CL: [
    { name: 'Santiago', population: 6257516, lat: -33.4489, lon: -70.6693, timezone: 'America/Santiago', capital: true, major: true },
    { name: 'Valparaiso', population: 296655, lat: -33.0472, lon: -71.6127, timezone: 'America/Santiago', capital: false, major: true },
  ],

  CO: [
    { name: 'Bogota', population: 7412566, lat: 4.7110, lon: -74.0721, timezone: 'America/Bogota', capital: true, major: true },
    { name: 'Medellin', population: 2569007, lat: 6.2442, lon: -75.5812, timezone: 'America/Bogota', capital: false, major: true },
    { name: 'Cartagena', population: 1028736, lat: 10.3910, lon: -75.4794, timezone: 'America/Bogota', capital: false, major: true },
  ],

  CR: [
    { name: 'San Jose', population: 342188, lat: 9.9281, lon: -84.0907, timezone: 'America/Costa_Rica', capital: true, major: true },
  ],

  PA: [
    { name: 'Panama City', population: 880691, lat: 8.9936, lon: -79.5197, timezone: 'America/Panama', capital: true, major: true },
  ],

  CU: [
    { name: 'Havana', population: 2141652, lat: 23.1136, lon: -82.3666, timezone: 'America/Havana', capital: true, major: true },
  ],

  KE: [
    { name: 'Nairobi', population: 4922000, lat: -1.2921, lon: 36.8219, timezone: 'Africa/Nairobi', capital: true, major: true },
    { name: 'Mombasa', population: 1208333, lat: -4.0435, lon: 39.6682, timezone: 'Africa/Nairobi', capital: false, major: true },
  ],

  TZ: [
    { name: 'Dar es Salaam', population: 6368000, lat: -6.7924, lon: 39.2083, timezone: 'Africa/Dar_es_Salaam', capital: false, major: true },
    { name: 'Dodoma', population: 410956, lat: -6.1630, lon: 35.7516, timezone: 'Africa/Dar_es_Salaam', capital: true, major: true },
  ],

  NG: [
    { name: 'Lagos', population: 14862000, lat: 6.5244, lon: 3.3792, timezone: 'Africa/Lagos', capital: false, major: true },
    { name: 'Abuja', population: 3652000, lat: 9.0765, lon: 7.3986, timezone: 'Africa/Lagos', capital: true, major: true },
    { name: 'Kano', population: 3999000, lat: 12.0022, lon: 8.5920, timezone: 'Africa/Lagos', capital: false, major: true },
  ],

  LK: [
    { name: 'Colombo', population: 752993, lat: 6.9271, lon: 79.8612, timezone: 'Asia/Colombo', capital: true, major: true },
    { name: 'Kandy', population: 125400, lat: 7.2906, lon: 80.6337, timezone: 'Asia/Colombo', capital: false, major: true },
  ],

  NP: [
    { name: 'Kathmandu', population: 1442271, lat: 27.7172, lon: 85.3240, timezone: 'Asia/Kathmandu', capital: true, major: true },
    { name: 'Pokhara', population: 414141, lat: 28.2096, lon: 83.9856, timezone: 'Asia/Kathmandu', capital: false, major: true },
  ],

  MM: [
    { name: 'Yangon', population: 5209541, lat: 16.8661, lon: 96.1951, timezone: 'Asia/Yangon', capital: false, major: true },
    { name: 'Naypyidaw', population: 1160000, lat: 19.7633, lon: 96.0785, timezone: 'Asia/Yangon', capital: true, major: true },
    { name: 'Mandalay', population: 1225553, lat: 21.9588, lon: 96.0891, timezone: 'Asia/Yangon', capital: false, major: true },
  ],

  KH: [
    { name: 'Phnom Penh', population: 2281951, lat: 11.5564, lon: 104.9282, timezone: 'Asia/Phnom_Penh', capital: true, major: true },
    { name: 'Siem Reap', population: 245494, lat: 13.3671, lon: 103.8448, timezone: 'Asia/Phnom_Penh', capital: false, major: true },
  ],

  LA: [
    { name: 'Vientiane', population: 1001477, lat: 17.9757, lon: 102.6331, timezone: 'Asia/Vientiane', capital: true, major: true },
    { name: 'Luang Prabang', population: 56000, lat: 19.8845, lon: 102.1348, timezone: 'Asia/Vientiane', capital: false, major: true },
  ],

  MV: [
    { name: 'Male', population: 252768, lat: 4.1755, lon: 73.5093, timezone: 'Indian/Maldives', capital: true, major: true },
  ],
};

async function populateCities() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database');

    // First, fetch all regions to create a mapping
    const regionsResult = await client.query('SELECT id, name, country_code FROM regions');
    const regionMap = new Map();

    regionsResult.rows.forEach(region => {
      const key = `${region.country_code}-${region.name}`;
      regionMap.set(key, region.id);
    });

    console.log(`Loaded ${regionMap.size} regions from database`);

    // Statistics
    let totalInserted = 0;
    let totalSkipped = 0;
    const countryStats = {};
    let capitalCount = 0;
    let majorCityCount = 0;

    // Process each country
    for (const [countryCode, cities] of Object.entries(citiesData)) {
      console.log(`\nProcessing ${countryCode} (${cities.length} cities)...`);
      countryStats[countryCode] = 0;

      for (const city of cities) {
        try {
          // Check if city already exists
          const existingCity = await client.query(
            'SELECT id FROM cities WHERE name = $1 AND country_code = $2',
            [city.name, countryCode]
          );

          if (existingCity.rows.length > 0) {
            console.log(`  Skipping ${city.name} (already exists)`);
            totalSkipped++;
            continue;
          }

          // Try to find a matching region
          let regionId = null;

          // Try to match region by searching for regions in this country
          const countryRegions = await client.query(
            'SELECT id, name FROM regions WHERE country_code = $1',
            [countryCode]
          );

          // Simple matching: if there's only one region for the country, use it
          // Otherwise leave it null (can be updated later)
          if (countryRegions.rows.length === 1) {
            regionId = countryRegions.rows[0].id;
          } else if (countryRegions.rows.length > 1) {
            // Try to find a region name that contains the city name or vice versa
            for (const region of countryRegions.rows) {
              const cityNameLower = city.name.toLowerCase();
              const regionNameLower = region.name.toLowerCase();

              if (cityNameLower.includes(regionNameLower) ||
                  regionNameLower.includes(cityNameLower)) {
                regionId = region.id;
                break;
              }
            }
          }

          // Insert the city
          await client.query(`
            INSERT INTO cities (
              region_id, country_code, name, population,
              latitude, longitude, timezone,
              is_capital, is_major_city
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            regionId,
            countryCode,
            city.name,
            city.population,
            city.lat,
            city.lon,
            city.timezone,
            city.capital,
            city.major
          ]);

          totalInserted++;
          countryStats[countryCode]++;

          if (city.capital) capitalCount++;
          if (city.major) majorCityCount++;

          console.log(`  ✓ Added ${city.name}${city.capital ? ' (CAPITAL)' : ''}`);

        } catch (error) {
          console.error(`  ✗ Error adding ${city.name}:`, error.message);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('INSERTION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nTotal cities inserted: ${totalInserted}`);
    console.log(`Total cities skipped (already exist): ${totalSkipped}`);
    console.log(`Capital cities: ${capitalCount}`);
    console.log(`Major cities (population > 500k or tourist destination): ${majorCityCount}`);

    console.log('\n' + '-'.repeat(80));
    console.log('Top 15 Countries by Number of Cities Added:');
    console.log('-'.repeat(80));

    const sortedCountries = Object.entries(countryStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    sortedCountries.forEach(([code, count], index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${code.padEnd(4)} - ${count} cities`);
    });

    // Get final totals from database
    const totalCitiesResult = await client.query('SELECT COUNT(*) FROM cities');
    const totalCapitalsResult = await client.query('SELECT COUNT(*) FROM cities WHERE is_capital = true');
    const totalMajorResult = await client.query('SELECT COUNT(*) FROM cities WHERE is_major_city = true');

    console.log('\n' + '='.repeat(80));
    console.log('DATABASE TOTALS');
    console.log('='.repeat(80));
    console.log(`Total cities in database: ${totalCitiesResult.rows[0].count}`);
    console.log(`Total capital cities in database: ${totalCapitalsResult.rows[0].count}`);
    console.log(`Total major cities in database: ${totalMajorResult.rows[0].count}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

// Run the script
populateCities().catch(console.error);
