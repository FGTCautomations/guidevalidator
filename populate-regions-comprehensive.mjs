import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

// Comprehensive regions data for all major countries
const REGIONS_DATA = {
  // ASIA-PACIFIC
  US: [
    { name: "Alabama", type: "State", code: "AL", capital: "Montgomery" },
    { name: "Alaska", type: "State", code: "AK", capital: "Juneau" },
    { name: "Arizona", type: "State", code: "AZ", capital: "Phoenix" },
    { name: "Arkansas", type: "State", code: "AR", capital: "Little Rock" },
    { name: "California", type: "State", code: "CA", capital: "Sacramento" },
    { name: "Colorado", type: "State", code: "CO", capital: "Denver" },
    { name: "Connecticut", type: "State", code: "CT", capital: "Hartford" },
    { name: "Delaware", type: "State", code: "DE", capital: "Dover" },
    { name: "Florida", type: "State", code: "FL", capital: "Tallahassee" },
    { name: "Georgia", type: "State", code: "GA", capital: "Atlanta" },
    { name: "Hawaii", type: "State", code: "HI", capital: "Honolulu" },
    { name: "Idaho", type: "State", code: "ID", capital: "Boise" },
    { name: "Illinois", type: "State", code: "IL", capital: "Springfield" },
    { name: "Indiana", type: "State", code: "IN", capital: "Indianapolis" },
    { name: "Iowa", type: "State", code: "IA", capital: "Des Moines" },
    { name: "Kansas", type: "State", code: "KS", capital: "Topeka" },
    { name: "Kentucky", type: "State", code: "KY", capital: "Frankfort" },
    { name: "Louisiana", type: "State", code: "LA", capital: "Baton Rouge" },
    { name: "Maine", type: "State", code: "ME", capital: "Augusta" },
    { name: "Maryland", type: "State", code: "MD", capital: "Annapolis" },
    { name: "Massachusetts", type: "State", code: "MA", capital: "Boston" },
    { name: "Michigan", type: "State", code: "MI", capital: "Lansing" },
    { name: "Minnesota", type: "State", code: "MN", capital: "Saint Paul" },
    { name: "Mississippi", type: "State", code: "MS", capital: "Jackson" },
    { name: "Missouri", type: "State", code: "MO", capital: "Jefferson City" },
    { name: "Montana", type: "State", code: "MT", capital: "Helena" },
    { name: "Nebraska", type: "State", code: "NE", capital: "Lincoln" },
    { name: "Nevada", type: "State", code: "NV", capital: "Carson City" },
    { name: "New Hampshire", type: "State", code: "NH", capital: "Concord" },
    { name: "New Jersey", type: "State", code: "NJ", capital: "Trenton" },
    { name: "New Mexico", type: "State", code: "NM", capital: "Santa Fe" },
    { name: "New York", type: "State", code: "NY", capital: "Albany" },
    { name: "North Carolina", type: "State", code: "NC", capital: "Raleigh" },
    { name: "North Dakota", type: "State", code: "ND", capital: "Bismarck" },
    { name: "Ohio", type: "State", code: "OH", capital: "Columbus" },
    { name: "Oklahoma", type: "State", code: "OK", capital: "Oklahoma City" },
    { name: "Oregon", type: "State", code: "OR", capital: "Salem" },
    { name: "Pennsylvania", type: "State", code: "PA", capital: "Harrisburg" },
    { name: "Rhode Island", type: "State", code: "RI", capital: "Providence" },
    { name: "South Carolina", type: "State", code: "SC", capital: "Columbia" },
    { name: "South Dakota", type: "State", code: "SD", capital: "Pierre" },
    { name: "Tennessee", type: "State", code: "TN", capital: "Nashville" },
    { name: "Texas", type: "State", code: "TX", capital: "Austin" },
    { name: "Utah", type: "State", code: "UT", capital: "Salt Lake City" },
    { name: "Vermont", type: "State", code: "VT", capital: "Montpelier" },
    { name: "Virginia", type: "State", code: "VA", capital: "Richmond" },
    { name: "Washington", type: "State", code: "WA", capital: "Olympia" },
    { name: "West Virginia", type: "State", code: "WV", capital: "Charleston" },
    { name: "Wisconsin", type: "State", code: "WI", capital: "Madison" },
    { name: "Wyoming", type: "State", code: "WY", capital: "Cheyenne" }
  ],
  CN: [
    { name: "Beijing", type: "Municipality", code: "BJ", capital: "Beijing" },
    { name: "Shanghai", type: "Municipality", code: "SH", capital: "Shanghai" },
    { name: "Tianjin", type: "Municipality", code: "TJ", capital: "Tianjin" },
    { name: "Chongqing", type: "Municipality", code: "CQ", capital: "Chongqing" },
    { name: "Guangdong", type: "Province", code: "GD", capital: "Guangzhou" },
    { name: "Sichuan", type: "Province", code: "SC", capital: "Chengdu" },
    { name: "Henan", type: "Province", code: "HA", capital: "Zhengzhou" },
    { name: "Shandong", type: "Province", code: "SD", capital: "Jinan" },
    { name: "Jiangsu", type: "Province", code: "JS", capital: "Nanjing" },
    { name: "Hebei", type: "Province", code: "HE", capital: "Shijiazhuang" },
    { name: "Hunan", type: "Province", code: "HN", capital: "Changsha" },
    { name: "Anhui", type: "Province", code: "AH", capital: "Hefei" },
    { name: "Hubei", type: "Province", code: "HB", capital: "Wuhan" },
    { name: "Zhejiang", type: "Province", code: "ZJ", capital: "Hangzhou" },
    { name: "Guangxi", type: "Autonomous Region", code: "GX", capital: "Nanning" },
    { name: "Yunnan", type: "Province", code: "YN", capital: "Kunming" },
    { name: "Jiangxi", type: "Province", code: "JX", capital: "Nanchang" },
    { name: "Liaoning", type: "Province", code: "LN", capital: "Shenyang" },
    { name: "Fujian", type: "Province", code: "FJ", capital: "Fuzhou" },
    { name: "Shaanxi", type: "Province", code: "SN", capital: "Xi'an" },
    { name: "Heilongjiang", type: "Province", code: "HL", capital: "Harbin" },
    { name: "Shanxi", type: "Province", code: "SX", capital: "Taiyuan" },
    { name: "Guizhou", type: "Province", code: "GZ", capital: "Guiyang" },
    { name: "Jilin", type: "Province", code: "JL", capital: "Changchun" },
    { name: "Inner Mongolia", type: "Autonomous Region", code: "NM", capital: "Hohhot" },
    { name: "Xinjiang", type: "Autonomous Region", code: "XJ", capital: "Urumqi" },
    { name: "Gansu", type: "Province", code: "GS", capital: "Lanzhou" },
    { name: "Tibet", type: "Autonomous Region", code: "XZ", capital: "Lhasa" },
    { name: "Ningxia", type: "Autonomous Region", code: "NX", capital: "Yinchuan" },
    { name: "Hainan", type: "Province", code: "HI", capital: "Haikou" },
    { name: "Qinghai", type: "Province", code: "QH", capital: "Xining" }
  ],
  IN: [
    { name: "Andhra Pradesh", type: "State", code: "AP", capital: "Amaravati" },
    { name: "Arunachal Pradesh", type: "State", code: "AR", capital: "Itanagar" },
    { name: "Assam", type: "State", code: "AS", capital: "Dispur" },
    { name: "Bihar", type: "State", code: "BR", capital: "Patna" },
    { name: "Chhattisgarh", type: "State", code: "CT", capital: "Raipur" },
    { name: "Goa", type: "State", code: "GA", capital: "Panaji" },
    { name: "Gujarat", type: "State", code: "GJ", capital: "Gandhinagar" },
    { name: "Haryana", type: "State", code: "HR", capital: "Chandigarh" },
    { name: "Himachal Pradesh", type: "State", code: "HP", capital: "Shimla" },
    { name: "Jharkhand", type: "State", code: "JH", capital: "Ranchi" },
    { name: "Karnataka", type: "State", code: "KA", capital: "Bengaluru" },
    { name: "Kerala", type: "State", code: "KL", capital: "Thiruvananthapuram" },
    { name: "Madhya Pradesh", type: "State", code: "MP", capital: "Bhopal" },
    { name: "Maharashtra", type: "State", code: "MH", capital: "Mumbai" },
    { name: "Manipur", type: "State", code: "MN", capital: "Imphal" },
    { name: "Meghalaya", type: "State", code: "ML", capital: "Shillong" },
    { name: "Mizoram", type: "State", code: "MZ", capital: "Aizawl" },
    { name: "Nagaland", type: "State", code: "NL", capital: "Kohima" },
    { name: "Odisha", type: "State", code: "OR", capital: "Bhubaneswar" },
    { name: "Punjab", type: "State", code: "PB", capital: "Chandigarh" },
    { name: "Rajasthan", type: "State", code: "RJ", capital: "Jaipur" },
    { name: "Sikkim", type: "State", code: "SK", capital: "Gangtok" },
    { name: "Tamil Nadu", type: "State", code: "TN", capital: "Chennai" },
    { name: "Telangana", type: "State", code: "TG", capital: "Hyderabad" },
    { name: "Tripura", type: "State", code: "TR", capital: "Agartala" },
    { name: "Uttar Pradesh", type: "State", code: "UP", capital: "Lucknow" },
    { name: "Uttarakhand", type: "State", code: "UT", capital: "Dehradun" },
    { name: "West Bengal", type: "State", code: "WB", capital: "Kolkata" },
    { name: "Delhi", type: "Union Territory", code: "DL", capital: "New Delhi" },
    { name: "Jammu and Kashmir", type: "Union Territory", code: "JK", capital: "Srinagar" },
    { name: "Ladakh", type: "Union Territory", code: "LA", capital: "Leh" },
    { name: "Puducherry", type: "Union Territory", code: "PY", capital: "Puducherry" }
  ],
  VN: [
    { name: "Hanoi", type: "Municipality", code: "HN", capital: "Hanoi" },
    { name: "Ho Chi Minh City", type: "Municipality", code: "SG", capital: "Ho Chi Minh City" },
    { name: "Da Nang", type: "Municipality", code: "DN", capital: "Da Nang" },
    { name: "Hai Phong", type: "Municipality", code: "HP", capital: "Hai Phong" },
    { name: "Can Tho", type: "Municipality", code: "CT", capital: "Can Tho" },
    { name: "Ha Giang", type: "Province", code: "HG", capital: "Ha Giang" },
    { name: "Cao Bang", type: "Province", code: "CB", capital: "Cao Bang" },
    { name: "Lao Cai", type: "Province", code: "LC", capital: "Lao Cai" },
    { name: "Bac Kan", type: "Province", code: "BK", capital: "Bac Kan" },
    { name: "Lang Son", type: "Province", code: "LS", capital: "Lang Son" },
    { name: "Quang Ninh", type: "Province", code: "QN", capital: "Ha Long" },
    { name: "Bac Giang", type: "Province", code: "BG", capital: "Bac Giang" },
    { name: "Phu Tho", type: "Province", code: "PT", capital: "Viet Tri" },
    { name: "Vinh Phuc", type: "Province", code: "VP", capital: "Vinh Yen" },
    { name: "Bac Ninh", type: "Province", code: "BN", capital: "Bac Ninh" },
    { name: "Hai Duong", type: "Province", code: "HD", capital: "Hai Duong" },
    { name: "Hung Yen", type: "Province", code: "HY", capital: "Hung Yen" },
    { name: "Thai Binh", type: "Province", code: "TB", capital: "Thai Binh" },
    { name: "Ha Nam", type: "Province", code: "HNM", capital: "Phu Ly" },
    { name: "Nam Dinh", type: "Province", code: "ND", capital: "Nam Dinh" },
    { name: "Ninh Binh", type: "Province", code: "NB", capital: "Ninh Binh" },
    { name: "Thanh Hoa", type: "Province", code: "TH", capital: "Thanh Hoa" },
    { name: "Nghe An", type: "Province", code: "NA", capital: "Vinh" },
    { name: "Ha Tinh", type: "Province", code: "HT", capital: "Ha Tinh" },
    { name: "Quang Binh", type: "Province", code: "QB", capital: "Dong Hoi" },
    { name: "Quang Tri", type: "Province", code: "QT", capital: "Dong Ha" },
    { name: "Thua Thien-Hue", type: "Province", code: "TTH", capital: "Hue" },
    { name: "Quang Nam", type: "Province", code: "QNM", capital: "Tam Ky" },
    { name: "Quang Ngai", type: "Province", code: "QNG", capital: "Quang Ngai" },
    { name: "Binh Dinh", type: "Province", code: "BD", capital: "Quy Nhon" },
    { name: "Phu Yen", type: "Province", code: "PY", capital: "Tuy Hoa" },
    { name: "Khanh Hoa", type: "Province", code: "KH", capital: "Nha Trang" },
    { name: "Ninh Thuan", type: "Province", code: "NT", capital: "Phan Rang-Thap Cham" },
    { name: "Binh Thuan", type: "Province", code: "BTH", capital: "Phan Thiet" },
    { name: "Kon Tum", type: "Province", code: "KT", capital: "Kon Tum" },
    { name: "Gia Lai", type: "Province", code: "GL", capital: "Pleiku" },
    { name: "Dak Lak", type: "Province", code: "DL", capital: "Buon Ma Thuot" },
    { name: "Dak Nong", type: "Province", code: "DNO", capital: "Gia Nghia" },
    { name: "Lam Dong", type: "Province", code: "LD", capital: "Da Lat" },
    { name: "Binh Phuoc", type: "Province", code: "BP", capital: "Dong Xoai" },
    { name: "Tay Ninh", type: "Province", code: "TN", capital: "Tay Ninh" },
    { name: "Binh Duong", type: "Province", code: "BDU", capital: "Thu Dau Mot" },
    { name: "Dong Nai", type: "Province", code: "DNI", capital: "Bien Hoa" },
    { name: "Ba Ria-Vung Tau", type: "Province", code: "VT", capital: "Vung Tau" },
    { name: "Long An", type: "Province", code: "LA", capital: "Tan An" },
    { name: "Tien Giang", type: "Province", code: "TG", capital: "My Tho" },
    { name: "Ben Tre", type: "Province", code: "BT", capital: "Ben Tre" },
    { name: "Tra Vinh", type: "Province", code: "TV", capital: "Tra Vinh" },
    { name: "Vinh Long", type: "Province", code: "VL", capital: "Vinh Long" },
    { name: "Dong Thap", type: "Province", code: "DT", capital: "Cao Lanh" },
    { name: "An Giang", type: "Province", code: "AG", capital: "Long Xuyen" },
    { name: "Kien Giang", type: "Province", code: "KG", capital: "Rach Gia" },
    { name: "Hau Giang", type: "Province", code: "HGI", capital: "Vi Thanh" },
    { name: "Soc Trang", type: "Province", code: "ST", capital: "Soc Trang" },
    { name: "Bac Lieu", type: "Province", code: "BL", capital: "Bac Lieu" },
    { name: "Ca Mau", type: "Province", code: "CM", capital: "Ca Mau" }
  ],
  TH: [
    { name: "Bangkok", type: "Special Administrative Area", code: "10", capital: "Bangkok" },
    { name: "Chiang Mai", type: "Province", code: "50", capital: "Chiang Mai" },
    { name: "Chiang Rai", type: "Province", code: "57", capital: "Chiang Rai" },
    { name: "Phuket", type: "Province", code: "83", capital: "Phuket City" },
    { name: "Krabi", type: "Province", code: "81", capital: "Krabi" },
    { name: "Surat Thani", type: "Province", code: "84", capital: "Surat Thani" },
    { name: "Phang Nga", type: "Province", code: "82", capital: "Phang Nga" },
    { name: "Ranong", type: "Province", code: "85", capital: "Ranong" },
    { name: "Chumphon", type: "Province", code: "86", capital: "Chumphon" },
    { name: "Nakhon Si Thammarat", type: "Province", code: "80", capital: "Nakhon Si Thammarat" },
    { name: "Songkhla", type: "Province", code: "90", capital: "Songkhla" },
    { name: "Pattani", type: "Province", code: "94", capital: "Pattani" },
    { name: "Yala", type: "Province", code: "95", capital: "Yala" },
    { name: "Narathiwat", type: "Province", code: "96", capital: "Narathiwat" },
    { name: "Chonburi", type: "Province", code: "20", capital: "Chonburi" },
    { name: "Rayong", type: "Province", code: "21", capital: "Rayong" },
    { name: "Prachuap Khiri Khan", type: "Province", code: "77", capital: "Prachuap Khiri Khan" },
    { name: "Kanchanaburi", type: "Province", code: "71", capital: "Kanchanaburi" },
    { name: "Nakhon Ratchasima", type: "Province", code: "30", capital: "Nakhon Ratchasima" },
    { name: "Ubon Ratchathani", type: "Province", code: "34", capital: "Ubon Ratchathani" },
    { name: "Khon Kaen", type: "Province", code: "40", capital: "Khon Kaen" },
    { name: "Udon Thani", type: "Province", code: "41", capital: "Udon Thani" },
    { name: "Nong Khai", type: "Province", code: "43", capital: "Nong Khai" },
    { name: "Ayutthaya", type: "Province", code: "13", capital: "Ayutthaya" },
    { name: "Lopburi", type: "Province", code: "16", capital: "Lopburi" },
    { name: "Sukhothai", type: "Province", code: "64", capital: "Sukhothai" }
  ],
  ID: [
    { name: "Jakarta", type: "Special Capital Region", code: "JK", capital: "Jakarta" },
    { name: "West Java", type: "Province", code: "JB", capital: "Bandung" },
    { name: "Central Java", type: "Province", code: "JT", capital: "Semarang" },
    { name: "East Java", type: "Province", code: "JI", capital: "Surabaya" },
    { name: "Yogyakarta", type: "Special Region", code: "YO", capital: "Yogyakarta" },
    { name: "Banten", type: "Province", code: "BT", capital: "Serang" },
    { name: "Bali", type: "Province", code: "BA", capital: "Denpasar" },
    { name: "West Nusa Tenggara", type: "Province", code: "NB", capital: "Mataram" },
    { name: "East Nusa Tenggara", type: "Province", code: "NT", capital: "Kupang" },
    { name: "North Sumatra", type: "Province", code: "SU", capital: "Medan" },
    { name: "West Sumatra", type: "Province", code: "SB", capital: "Padang" },
    { name: "South Sumatra", type: "Province", code: "SS", capital: "Palembang" },
    { name: "Riau", type: "Province", code: "RI", capital: "Pekanbaru" },
    { name: "Riau Islands", type: "Province", code: "KR", capital: "Tanjung Pinang" },
    { name: "Lampung", type: "Province", code: "LA", capital: "Bandar Lampung" },
    { name: "Aceh", type: "Special Region", code: "AC", capital: "Banda Aceh" },
    { name: "West Kalimantan", type: "Province", code: "KB", capital: "Pontianak" },
    { name: "Central Kalimantan", type: "Province", code: "KT", capital: "Palangkaraya" },
    { name: "South Kalimantan", type: "Province", code: "KS", capital: "Banjarmasin" },
    { name: "East Kalimantan", type: "Province", code: "KI", capital: "Samarinda" },
    { name: "North Kalimantan", type: "Province", code: "KU", capital: "Tanjung Selor" },
    { name: "North Sulawesi", type: "Province", code: "SA", capital: "Manado" },
    { name: "Central Sulawesi", type: "Province", code: "ST", capital: "Palu" },
    { name: "South Sulawesi", type: "Province", code: "SN", capital: "Makassar" },
    { name: "Southeast Sulawesi", type: "Province", code: "SG", capital: "Kendari" },
    { name: "Gorontalo", type: "Province", code: "GO", capital: "Gorontalo" },
    { name: "West Sulawesi", type: "Province", code: "SR", capital: "Mamuju" },
    { name: "Maluku", type: "Province", code: "MA", capital: "Ambon" },
    { name: "North Maluku", type: "Province", code: "MU", capital: "Sofifi" },
    { name: "Papua", type: "Province", code: "PA", capital: "Jayapura" },
    { name: "West Papua", type: "Province", code: "PB", capital: "Manokwari" }
  ],
  PH: [
    { name: "National Capital Region", type: "Region", code: "NCR", capital: "Manila" },
    { name: "Ilocos Region", type: "Region", code: "I", capital: "San Fernando" },
    { name: "Cagayan Valley", type: "Region", code: "II", capital: "Tuguegarao" },
    { name: "Central Luzon", type: "Region", code: "III", capital: "San Fernando" },
    { name: "Calabarzon", type: "Region", code: "IVA", capital: "Calamba" },
    { name: "Mimaropa", type: "Region", code: "IVB", capital: "Calapan" },
    { name: "Bicol Region", type: "Region", code: "V", capital: "Legazpi" },
    { name: "Western Visayas", type: "Region", code: "VI", capital: "Iloilo City" },
    { name: "Central Visayas", type: "Region", code: "VII", capital: "Cebu City" },
    { name: "Eastern Visayas", type: "Region", code: "VIII", capital: "Tacloban" },
    { name: "Zamboanga Peninsula", type: "Region", code: "IX", capital: "Pagadian" },
    { name: "Northern Mindanao", type: "Region", code: "X", capital: "Cagayan de Oro" },
    { name: "Davao Region", type: "Region", code: "XI", capital: "Davao City" },
    { name: "Soccsksargen", type: "Region", code: "XII", capital: "Koronadal" },
    { name: "Caraga", type: "Region", code: "XIII", capital: "Butuan" },
    { name: "Bangsamoro", type: "Autonomous Region", code: "BARMM", capital: "Cotabato City" },
    { name: "Cordillera Administrative Region", type: "Region", code: "CAR", capital: "Baguio" }
  ],
  JP: [
    { name: "Tokyo", type: "Prefecture", code: "13", capital: "Tokyo" },
    { name: "Osaka", type: "Prefecture", code: "27", capital: "Osaka" },
    { name: "Kyoto", type: "Prefecture", code: "26", capital: "Kyoto" },
    { name: "Hokkaido", type: "Prefecture", code: "01", capital: "Sapporo" },
    { name: "Kanagawa", type: "Prefecture", code: "14", capital: "Yokohama" },
    { name: "Aichi", type: "Prefecture", code: "23", capital: "Nagoya" },
    { name: "Fukuoka", type: "Prefecture", code: "40", capital: "Fukuoka" },
    { name: "Hyogo", type: "Prefecture", code: "28", capital: "Kobe" },
    { name: "Saitama", type: "Prefecture", code: "11", capital: "Saitama" },
    { name: "Chiba", type: "Prefecture", code: "12", capital: "Chiba" },
    { name: "Hiroshima", type: "Prefecture", code: "34", capital: "Hiroshima" },
    { name: "Okinawa", type: "Prefecture", code: "47", capital: "Naha" },
    { name: "Nagano", type: "Prefecture", code: "20", capital: "Nagano" },
    { name: "Ishikawa", type: "Prefecture", code: "17", capital: "Kanazawa" },
    { name: "Nara", type: "Prefecture", code: "29", capital: "Nara" },
    { name: "Shizuoka", type: "Prefecture", code: "22", capital: "Shizuoka" },
    { name: "Miyagi", type: "Prefecture", code: "04", capital: "Sendai" },
    { name: "Gifu", type: "Prefecture", code: "21", capital: "Gifu" },
    { name: "Niigata", type: "Prefecture", code: "15", capital: "Niigata" },
    { name: "Kumamoto", type: "Prefecture", code: "43", capital: "Kumamoto" },
    { name: "Kagoshima", type: "Prefecture", code: "46", capital: "Kagoshima" },
    { name: "Nagasaki", type: "Prefecture", code: "42", capital: "Nagasaki" },
    { name: "Mie", type: "Prefecture", code: "24", capital: "Tsu" },
    { name: "Yamanashi", type: "Prefecture", code: "19", capital: "Kofu" }
  ],
  KR: [
    { name: "Seoul", type: "Special City", code: "11", capital: "Seoul" },
    { name: "Busan", type: "Metropolitan City", code: "26", capital: "Busan" },
    { name: "Incheon", type: "Metropolitan City", code: "28", capital: "Incheon" },
    { name: "Daegu", type: "Metropolitan City", code: "27", capital: "Daegu" },
    { name: "Daejeon", type: "Metropolitan City", code: "30", capital: "Daejeon" },
    { name: "Gwangju", type: "Metropolitan City", code: "29", capital: "Gwangju" },
    { name: "Ulsan", type: "Metropolitan City", code: "31", capital: "Ulsan" },
    { name: "Sejong", type: "Special Self-Governing City", code: "36", capital: "Sejong" },
    { name: "Gyeonggi", type: "Province", code: "41", capital: "Suwon" },
    { name: "Gangwon", type: "Province", code: "42", capital: "Chuncheon" },
    { name: "North Chungcheong", type: "Province", code: "43", capital: "Cheongju" },
    { name: "South Chungcheong", type: "Province", code: "44", capital: "Hongseong" },
    { name: "North Jeolla", type: "Province", code: "45", capital: "Jeonju" },
    { name: "South Jeolla", type: "Province", code: "46", capital: "Muan" },
    { name: "North Gyeongsang", type: "Province", code: "47", capital: "Andong" },
    { name: "South Gyeongsang", type: "Province", code: "48", capital: "Changwon" },
    { name: "Jeju", type: "Special Self-Governing Province", code: "50", capital: "Jeju City" }
  ],
  MY: [
    { name: "Johor", type: "State", code: "01", capital: "Johor Bahru" },
    { name: "Kedah", type: "State", code: "02", capital: "Alor Setar" },
    { name: "Kelantan", type: "State", code: "03", capital: "Kota Bharu" },
    { name: "Malacca", type: "State", code: "04", capital: "Malacca City" },
    { name: "Negeri Sembilan", type: "State", code: "05", capital: "Seremban" },
    { name: "Pahang", type: "State", code: "06", capital: "Kuantan" },
    { name: "Penang", type: "State", code: "07", capital: "George Town" },
    { name: "Perak", type: "State", code: "08", capital: "Ipoh" },
    { name: "Perlis", type: "State", code: "09", capital: "Kangar" },
    { name: "Selangor", type: "State", code: "10", capital: "Shah Alam" },
    { name: "Terengganu", type: "State", code: "11", capital: "Kuala Terengganu" },
    { name: "Sabah", type: "State", code: "12", capital: "Kota Kinabalu" },
    { name: "Sarawak", type: "State", code: "13", capital: "Kuching" },
    { name: "Kuala Lumpur", type: "Federal Territory", code: "14", capital: "Kuala Lumpur" },
    { name: "Labuan", type: "Federal Territory", code: "15", capital: "Victoria" },
    { name: "Putrajaya", type: "Federal Territory", code: "16", capital: "Putrajaya" }
  ],
  SG: [
    { name: "Central Region", type: "Region", code: "01", capital: "Singapore" },
    { name: "East Region", type: "Region", code: "02", capital: "Singapore" },
    { name: "North Region", type: "Region", code: "03", capital: "Singapore" },
    { name: "North-East Region", type: "Region", code: "04", capital: "Singapore" },
    { name: "West Region", type: "Region", code: "05", capital: "Singapore" }
  ],
  // EUROPE
  FR: [
    { name: "Ile-de-France", type: "Region", code: "IDF", capital: "Paris" },
    { name: "Auvergne-Rhone-Alpes", type: "Region", code: "ARA", capital: "Lyon" },
    { name: "Provence-Alpes-Cote d'Azur", type: "Region", code: "PAC", capital: "Marseille" },
    { name: "Nouvelle-Aquitaine", type: "Region", code: "NAQ", capital: "Bordeaux" },
    { name: "Occitanie", type: "Region", code: "OCC", capital: "Toulouse" },
    { name: "Hauts-de-France", type: "Region", code: "HDF", capital: "Lille" },
    { name: "Brittany", type: "Region", code: "BRE", capital: "Rennes" },
    { name: "Grand Est", type: "Region", code: "GES", capital: "Strasbourg" },
    { name: "Normandy", type: "Region", code: "NOR", capital: "Rouen" },
    { name: "Pays de la Loire", type: "Region", code: "PDL", capital: "Nantes" },
    { name: "Centre-Val de Loire", type: "Region", code: "CVL", capital: "Orleans" },
    { name: "Bourgogne-Franche-Comte", type: "Region", code: "BFC", capital: "Dijon" },
    { name: "Corsica", type: "Region", code: "COR", capital: "Ajaccio" }
  ],
  IT: [
    { name: "Lazio", type: "Region", code: "LAZ", capital: "Rome" },
    { name: "Lombardy", type: "Region", code: "LOM", capital: "Milan" },
    { name: "Campania", type: "Region", code: "CAM", capital: "Naples" },
    { name: "Sicily", type: "Region", code: "SIC", capital: "Palermo" },
    { name: "Veneto", type: "Region", code: "VEN", capital: "Venice" },
    { name: "Piedmont", type: "Region", code: "PIE", capital: "Turin" },
    { name: "Emilia-Romagna", type: "Region", code: "EMR", capital: "Bologna" },
    { name: "Tuscany", type: "Region", code: "TOS", capital: "Florence" },
    { name: "Apulia", type: "Region", code: "PUG", capital: "Bari" },
    { name: "Calabria", type: "Region", code: "CAL", capital: "Catanzaro" },
    { name: "Sardinia", type: "Region", code: "SAR", capital: "Cagliari" },
    { name: "Liguria", type: "Region", code: "LIG", capital: "Genoa" },
    { name: "Marche", type: "Region", code: "MAR", capital: "Ancona" },
    { name: "Abruzzo", type: "Region", code: "ABR", capital: "L'Aquila" },
    { name: "Friuli-Venezia Giulia", type: "Region", code: "FVG", capital: "Trieste" },
    { name: "Trentino-Alto Adige", type: "Region", code: "TAA", capital: "Trento" },
    { name: "Umbria", type: "Region", code: "UMB", capital: "Perugia" },
    { name: "Basilicata", type: "Region", code: "BAS", capital: "Potenza" },
    { name: "Molise", type: "Region", code: "MOL", capital: "Campobasso" },
    { name: "Aosta Valley", type: "Region", code: "VDA", capital: "Aosta" }
  ],
  ES: [
    { name: "Madrid", type: "Autonomous Community", code: "MD", capital: "Madrid" },
    { name: "Catalonia", type: "Autonomous Community", code: "CT", capital: "Barcelona" },
    { name: "Andalusia", type: "Autonomous Community", code: "AN", capital: "Seville" },
    { name: "Valencia", type: "Autonomous Community", code: "VC", capital: "Valencia" },
    { name: "Galicia", type: "Autonomous Community", code: "GA", capital: "Santiago de Compostela" },
    { name: "Castile and Leon", type: "Autonomous Community", code: "CL", capital: "Valladolid" },
    { name: "Basque Country", type: "Autonomous Community", code: "PV", capital: "Vitoria-Gasteiz" },
    { name: "Canary Islands", type: "Autonomous Community", code: "CN", capital: "Las Palmas / Santa Cruz" },
    { name: "Castile-La Mancha", type: "Autonomous Community", code: "CM", capital: "Toledo" },
    { name: "Murcia", type: "Autonomous Community", code: "MC", capital: "Murcia" },
    { name: "Aragon", type: "Autonomous Community", code: "AR", capital: "Zaragoza" },
    { name: "Extremadura", type: "Autonomous Community", code: "EX", capital: "Merida" },
    { name: "Balearic Islands", type: "Autonomous Community", code: "IB", capital: "Palma" },
    { name: "Asturias", type: "Autonomous Community", code: "AS", capital: "Oviedo" },
    { name: "Navarre", type: "Autonomous Community", code: "NC", capital: "Pamplona" },
    { name: "Cantabria", type: "Autonomous Community", code: "CB", capital: "Santander" },
    { name: "La Rioja", type: "Autonomous Community", code: "RI", capital: "Logrono" }
  ],
  DE: [
    { name: "Baden-Wurttemberg", type: "State", code: "BW", capital: "Stuttgart" },
    { name: "Bavaria", type: "State", code: "BY", capital: "Munich" },
    { name: "Berlin", type: "State", code: "BE", capital: "Berlin" },
    { name: "Brandenburg", type: "State", code: "BB", capital: "Potsdam" },
    { name: "Bremen", type: "State", code: "HB", capital: "Bremen" },
    { name: "Hamburg", type: "State", code: "HH", capital: "Hamburg" },
    { name: "Hesse", type: "State", code: "HE", capital: "Wiesbaden" },
    { name: "Lower Saxony", type: "State", code: "NI", capital: "Hanover" },
    { name: "Mecklenburg-Vorpommern", type: "State", code: "MV", capital: "Schwerin" },
    { name: "North Rhine-Westphalia", type: "State", code: "NW", capital: "Dusseldorf" },
    { name: "Rhineland-Palatinate", type: "State", code: "RP", capital: "Mainz" },
    { name: "Saarland", type: "State", code: "SL", capital: "Saarbrucken" },
    { name: "Saxony", type: "State", code: "SN", capital: "Dresden" },
    { name: "Saxony-Anhalt", type: "State", code: "ST", capital: "Magdeburg" },
    { name: "Schleswig-Holstein", type: "State", code: "SH", capital: "Kiel" },
    { name: "Thuringia", type: "State", code: "TH", capital: "Erfurt" }
  ],
  GB: [
    { name: "England", type: "Country", code: "ENG", capital: "London" },
    { name: "Scotland", type: "Country", code: "SCT", capital: "Edinburgh" },
    { name: "Wales", type: "Country", code: "WLS", capital: "Cardiff" },
    { name: "Northern Ireland", type: "Country", code: "NIR", capital: "Belfast" },
    { name: "Greater London", type: "Region", code: "LND", capital: "London" },
    { name: "South East England", type: "Region", code: "SEE", capital: "Guildford" },
    { name: "North West England", type: "Region", code: "NWE", capital: "Manchester" },
    { name: "South West England", type: "Region", code: "SWE", capital: "Bristol" },
    { name: "Yorkshire and the Humber", type: "Region", code: "YTH", capital: "Leeds" },
    { name: "West Midlands", type: "Region", code: "WMD", capital: "Birmingham" },
    { name: "East Midlands", type: "Region", code: "EMD", capital: "Nottingham" },
    { name: "East of England", type: "Region", code: "EOE", capital: "Cambridge" },
    { name: "North East England", type: "Region", code: "NEE", capital: "Newcastle" }
  ],
  // AMERICAS
  CA: [
    { name: "Ontario", type: "Province", code: "ON", capital: "Toronto" },
    { name: "Quebec", type: "Province", code: "QC", capital: "Quebec City" },
    { name: "British Columbia", type: "Province", code: "BC", capital: "Victoria" },
    { name: "Alberta", type: "Province", code: "AB", capital: "Edmonton" },
    { name: "Manitoba", type: "Province", code: "MB", capital: "Winnipeg" },
    { name: "Saskatchewan", type: "Province", code: "SK", capital: "Regina" },
    { name: "Nova Scotia", type: "Province", code: "NS", capital: "Halifax" },
    { name: "New Brunswick", type: "Province", code: "NB", capital: "Fredericton" },
    { name: "Newfoundland and Labrador", type: "Province", code: "NL", capital: "St. John's" },
    { name: "Prince Edward Island", type: "Province", code: "PE", capital: "Charlottetown" },
    { name: "Northwest Territories", type: "Territory", code: "NT", capital: "Yellowknife" },
    { name: "Yukon", type: "Territory", code: "YT", capital: "Whitehorse" },
    { name: "Nunavut", type: "Territory", code: "NU", capital: "Iqaluit" }
  ],
  MX: [
    { name: "Aguascalientes", type: "State", code: "AGU", capital: "Aguascalientes" },
    { name: "Baja California", type: "State", code: "BCN", capital: "Mexicali" },
    { name: "Baja California Sur", type: "State", code: "BCS", capital: "La Paz" },
    { name: "Campeche", type: "State", code: "CAM", capital: "Campeche" },
    { name: "Chiapas", type: "State", code: "CHP", capital: "Tuxtla Gutierrez" },
    { name: "Chihuahua", type: "State", code: "CHH", capital: "Chihuahua" },
    { name: "Coahuila", type: "State", code: "COA", capital: "Saltillo" },
    { name: "Colima", type: "State", code: "COL", capital: "Colima" },
    { name: "Durango", type: "State", code: "DUR", capital: "Durango" },
    { name: "Guanajuato", type: "State", code: "GUA", capital: "Guanajuato" },
    { name: "Guerrero", type: "State", code: "GRO", capital: "Chilpancingo" },
    { name: "Hidalgo", type: "State", code: "HID", capital: "Pachuca" },
    { name: "Jalisco", type: "State", code: "JAL", capital: "Guadalajara" },
    { name: "Mexico City", type: "Federal District", code: "CMX", capital: "Mexico City" },
    { name: "Mexico State", type: "State", code: "MEX", capital: "Toluca" },
    { name: "Michoacan", type: "State", code: "MIC", capital: "Morelia" },
    { name: "Morelos", type: "State", code: "MOR", capital: "Cuernavaca" },
    { name: "Nayarit", type: "State", code: "NAY", capital: "Tepic" },
    { name: "Nuevo Leon", type: "State", code: "NLE", capital: "Monterrey" },
    { name: "Oaxaca", type: "State", code: "OAX", capital: "Oaxaca" },
    { name: "Puebla", type: "State", code: "PUE", capital: "Puebla" },
    { name: "Queretaro", type: "State", code: "QUE", capital: "Queretaro" },
    { name: "Quintana Roo", type: "State", code: "ROO", capital: "Chetumal" },
    { name: "San Luis Potosi", type: "State", code: "SLP", capital: "San Luis Potosi" },
    { name: "Sinaloa", type: "State", code: "SIN", capital: "Culiacan" },
    { name: "Sonora", type: "State", code: "SON", capital: "Hermosillo" },
    { name: "Tabasco", type: "State", code: "TAB", capital: "Villahermosa" },
    { name: "Tamaulipas", type: "State", code: "TAM", capital: "Ciudad Victoria" },
    { name: "Tlaxcala", type: "State", code: "TLA", capital: "Tlaxcala" },
    { name: "Veracruz", type: "State", code: "VER", capital: "Xalapa" },
    { name: "Yucatan", type: "State", code: "YUC", capital: "Merida" },
    { name: "Zacatecas", type: "State", code: "ZAC", capital: "Zacatecas" }
  ],
  BR: [
    { name: "Sao Paulo", type: "State", code: "SP", capital: "Sao Paulo" },
    { name: "Rio de Janeiro", type: "State", code: "RJ", capital: "Rio de Janeiro" },
    { name: "Minas Gerais", type: "State", code: "MG", capital: "Belo Horizonte" },
    { name: "Bahia", type: "State", code: "BA", capital: "Salvador" },
    { name: "Parana", type: "State", code: "PR", capital: "Curitiba" },
    { name: "Rio Grande do Sul", type: "State", code: "RS", capital: "Porto Alegre" },
    { name: "Pernambuco", type: "State", code: "PE", capital: "Recife" },
    { name: "Ceara", type: "State", code: "CE", capital: "Fortaleza" },
    { name: "Para", type: "State", code: "PA", capital: "Belem" },
    { name: "Santa Catarina", type: "State", code: "SC", capital: "Florianopolis" },
    { name: "Goias", type: "State", code: "GO", capital: "Goiania" },
    { name: "Maranhao", type: "State", code: "MA", capital: "Sao Luis" },
    { name: "Paraiba", type: "State", code: "PB", capital: "Joao Pessoa" },
    { name: "Amazonas", type: "State", code: "AM", capital: "Manaus" },
    { name: "Espirito Santo", type: "State", code: "ES", capital: "Vitoria" },
    { name: "Mato Grosso", type: "State", code: "MT", capital: "Cuiaba" },
    { name: "Rio Grande do Norte", type: "State", code: "RN", capital: "Natal" },
    { name: "Piaui", type: "State", code: "PI", capital: "Teresina" },
    { name: "Alagoas", type: "State", code: "AL", capital: "Maceio" },
    { name: "Distrito Federal", type: "Federal District", code: "DF", capital: "Brasilia" },
    { name: "Mato Grosso do Sul", type: "State", code: "MS", capital: "Campo Grande" },
    { name: "Sergipe", type: "State", code: "SE", capital: "Aracaju" },
    { name: "Rondonia", type: "State", code: "RO", capital: "Porto Velho" },
    { name: "Tocantins", type: "State", code: "TO", capital: "Palmas" },
    { name: "Acre", type: "State", code: "AC", capital: "Rio Branco" },
    { name: "Amapa", type: "State", code: "AP", capital: "Macapa" },
    { name: "Roraima", type: "State", code: "RR", capital: "Boa Vista" }
  ],
  AU: [
    { name: "New South Wales", type: "State", code: "NSW", capital: "Sydney" },
    { name: "Victoria", type: "State", code: "VIC", capital: "Melbourne" },
    { name: "Queensland", type: "State", code: "QLD", capital: "Brisbane" },
    { name: "Western Australia", type: "State", code: "WA", capital: "Perth" },
    { name: "South Australia", type: "State", code: "SA", capital: "Adelaide" },
    { name: "Tasmania", type: "State", code: "TAS", capital: "Hobart" },
    { name: "Northern Territory", type: "Territory", code: "NT", capital: "Darwin" },
    { name: "Australian Capital Territory", type: "Territory", code: "ACT", capital: "Canberra" }
  ],
  // ADDITIONAL MAJOR COUNTRIES
  RU: [
    { name: "Moscow", type: "Federal City", code: "MOW", capital: "Moscow" },
    { name: "Saint Petersburg", type: "Federal City", code: "SPE", capital: "Saint Petersburg" },
    { name: "Moscow Oblast", type: "Oblast", code: "MOS", capital: "Moscow" },
    { name: "Krasnodar Krai", type: "Krai", code: "KDA", capital: "Krasnodar" },
    { name: "Sverdlovsk Oblast", type: "Oblast", code: "SVE", capital: "Yekaterinburg" },
    { name: "Rostov Oblast", type: "Oblast", code: "ROS", capital: "Rostov-on-Don" },
    { name: "Bashkortostan", type: "Republic", code: "BA", capital: "Ufa" },
    { name: "Tatarstan", type: "Republic", code: "TA", capital: "Kazan" },
    { name: "Chelyabinsk Oblast", type: "Oblast", code: "CHE", capital: "Chelyabinsk" },
    { name: "Samara Oblast", type: "Oblast", code: "SAM", capital: "Samara" },
    { name: "Nizhny Novgorod Oblast", type: "Oblast", code: "NIZ", capital: "Nizhny Novgorod" },
    { name: "Krasnoyarsk Krai", type: "Krai", code: "KYA", capital: "Krasnoyarsk" }
  ],
  TR: [
    { name: "Istanbul", type: "Province", code: "34", capital: "Istanbul" },
    { name: "Ankara", type: "Province", code: "06", capital: "Ankara" },
    { name: "Izmir", type: "Province", code: "35", capital: "Izmir" },
    { name: "Antalya", type: "Province", code: "07", capital: "Antalya" },
    { name: "Bursa", type: "Province", code: "16", capital: "Bursa" },
    { name: "Adana", type: "Province", code: "01", capital: "Adana" },
    { name: "Gaziantep", type: "Province", code: "27", capital: "Gaziantep" },
    { name: "Konya", type: "Province", code: "42", capital: "Konya" },
    { name: "Mersin", type: "Province", code: "33", capital: "Mersin" },
    { name: "Kayseri", type: "Province", code: "38", capital: "Kayseri" },
    { name: "Mugla", type: "Province", code: "48", capital: "Mugla" },
    { name: "Aydin", type: "Province", code: "09", capital: "Aydin" }
  ],
  IR: [
    { name: "Tehran", type: "Province", code: "TEH", capital: "Tehran" },
    { name: "Razavi Khorasan", type: "Province", code: "KHR", capital: "Mashhad" },
    { name: "Isfahan", type: "Province", code: "ISF", capital: "Isfahan" },
    { name: "Fars", type: "Province", code: "FAR", capital: "Shiraz" },
    { name: "Khuzestan", type: "Province", code: "KHZ", capital: "Ahvaz" },
    { name: "East Azerbaijan", type: "Province", code: "EAZ", capital: "Tabriz" },
    { name: "West Azerbaijan", type: "Province", code: "WAZ", capital: "Urmia" },
    { name: "Mazandaran", type: "Province", code: "MAZ", capital: "Sari" },
    { name: "Gilan", type: "Province", code: "GIL", capital: "Rasht" },
    { name: "Kerman", type: "Province", code: "KER", capital: "Kerman" }
  ],
  PK: [
    { name: "Punjab", type: "Province", code: "PB", capital: "Lahore" },
    { name: "Sindh", type: "Province", code: "SD", capital: "Karachi" },
    { name: "Khyber Pakhtunkhwa", type: "Province", code: "KP", capital: "Peshawar" },
    { name: "Balochistan", type: "Province", code: "BA", capital: "Quetta" },
    { name: "Islamabad Capital Territory", type: "Territory", code: "IS", capital: "Islamabad" },
    { name: "Gilgit-Baltistan", type: "Territory", code: "GB", capital: "Gilgit" },
    { name: "Azad Kashmir", type: "Territory", code: "JK", capital: "Muzaffarabad" }
  ],
  BD: [
    { name: "Dhaka", type: "Division", code: "C", capital: "Dhaka" },
    { name: "Chittagong", type: "Division", code: "B", capital: "Chittagong" },
    { name: "Rajshahi", type: "Division", code: "D", capital: "Rajshahi" },
    { name: "Khulna", type: "Division", code: "E", capital: "Khulna" },
    { name: "Barisal", type: "Division", code: "A", capital: "Barisal" },
    { name: "Sylhet", type: "Division", code: "F", capital: "Sylhet" },
    { name: "Rangpur", type: "Division", code: "G", capital: "Rangpur" },
    { name: "Mymensingh", type: "Division", code: "H", capital: "Mymensingh" }
  ],
  EG: [
    { name: "Cairo", type: "Governorate", code: "C", capital: "Cairo" },
    { name: "Alexandria", type: "Governorate", code: "ALX", capital: "Alexandria" },
    { name: "Giza", type: "Governorate", code: "GZ", capital: "Giza" },
    { name: "Qalyubia", type: "Governorate", code: "KB", capital: "Benha" },
    { name: "Dakahlia", type: "Governorate", code: "DK", capital: "Mansoura" },
    { name: "Sharqia", type: "Governorate", code: "SHR", capital: "Zagazig" },
    { name: "Red Sea", type: "Governorate", code: "BA", capital: "Hurghada" },
    { name: "South Sinai", type: "Governorate", code: "JS", capital: "El-Tor" },
    { name: "Luxor", type: "Governorate", code: "LX", capital: "Luxor" },
    { name: "Aswan", type: "Governorate", code: "ASN", capital: "Aswan" }
  ],
  ZA: [
    { name: "Gauteng", type: "Province", code: "GT", capital: "Johannesburg" },
    { name: "KwaZulu-Natal", type: "Province", code: "NL", capital: "Pietermaritzburg" },
    { name: "Western Cape", type: "Province", code: "WC", capital: "Cape Town" },
    { name: "Eastern Cape", type: "Province", code: "EC", capital: "Bhisho" },
    { name: "Limpopo", type: "Province", code: "LP", capital: "Polokwane" },
    { name: "Mpumalanga", type: "Province", code: "MP", capital: "Mbombela" },
    { name: "North West", type: "Province", code: "NW", capital: "Mahikeng" },
    { name: "Free State", type: "Province", code: "FS", capital: "Bloemfontein" },
    { name: "Northern Cape", type: "Province", code: "NC", capital: "Kimberley" }
  ],
  NZ: [
    { name: "Auckland", type: "Region", code: "AUK", capital: "Auckland" },
    { name: "Wellington", type: "Region", code: "WGN", capital: "Wellington" },
    { name: "Canterbury", type: "Region", code: "CAN", capital: "Christchurch" },
    { name: "Waikato", type: "Region", code: "WKO", capital: "Hamilton" },
    { name: "Bay of Plenty", type: "Region", code: "BOP", capital: "Tauranga" },
    { name: "Otago", type: "Region", code: "OTA", capital: "Dunedin" },
    { name: "Manawatu-Wanganui", type: "Region", code: "MWT", capital: "Palmerston North" },
    { name: "Northland", type: "Region", code: "NTL", capital: "Whangarei" },
    { name: "Hawke's Bay", type: "Region", code: "HKB", capital: "Napier" },
    { name: "Taranaki", type: "Region", code: "TKI", capital: "New Plymouth" },
    { name: "Nelson", type: "Region", code: "NSN", capital: "Nelson" },
    { name: "Marlborough", type: "Region", code: "MBH", capital: "Blenheim" },
    { name: "Southland", type: "Region", code: "STL", capital: "Invercargill" },
    { name: "Tasman", type: "Region", code: "TAS", capital: "Richmond" },
    { name: "Gisborne", type: "Region", code: "GIS", capital: "Gisborne" },
    { name: "West Coast", type: "Region", code: "WTC", capital: "Greymouth" }
  ],
  AR: [
    { name: "Buenos Aires", type: "Province", code: "B", capital: "La Plata" },
    { name: "Buenos Aires City", type: "Autonomous City", code: "C", capital: "Buenos Aires" },
    { name: "Cordoba", type: "Province", code: "X", capital: "Cordoba" },
    { name: "Santa Fe", type: "Province", code: "S", capital: "Santa Fe" },
    { name: "Mendoza", type: "Province", code: "M", capital: "Mendoza" },
    { name: "Tucuman", type: "Province", code: "T", capital: "San Miguel de Tucuman" },
    { name: "Entre Rios", type: "Province", code: "E", capital: "Parana" },
    { name: "Salta", type: "Province", code: "A", capital: "Salta" },
    { name: "Chaco", type: "Province", code: "H", capital: "Resistencia" },
    { name: "Corrientes", type: "Province", code: "W", capital: "Corrientes" },
    { name: "Misiones", type: "Province", code: "N", capital: "Posadas" },
    { name: "San Juan", type: "Province", code: "J", capital: "San Juan" }
  ],
  CL: [
    { name: "Santiago Metropolitan", type: "Region", code: "RM", capital: "Santiago" },
    { name: "Valparaiso", type: "Region", code: "VS", capital: "Valparaiso" },
    { name: "Biobio", type: "Region", code: "BI", capital: "Concepcion" },
    { name: "Maule", type: "Region", code: "ML", capital: "Talca" },
    { name: "La Araucania", type: "Region", code: "AR", capital: "Temuco" },
    { name: "Los Lagos", type: "Region", code: "LL", capital: "Puerto Montt" },
    { name: "O'Higgins", type: "Region", code: "LI", capital: "Rancagua" },
    { name: "Antofagasta", type: "Region", code: "AN", capital: "Antofagasta" },
    { name: "Coquimbo", type: "Region", code: "CO", capital: "La Serena" },
    { name: "Los Rios", type: "Region", code: "LR", capital: "Valdivia" },
    { name: "Magallanes", type: "Region", code: "MA", capital: "Punta Arenas" }
  ],
  PE: [
    { name: "Lima", type: "Region", code: "LIM", capital: "Lima" },
    { name: "Cusco", type: "Region", code: "CUS", capital: "Cusco" },
    { name: "Arequipa", type: "Region", code: "ARE", capital: "Arequipa" },
    { name: "La Libertad", type: "Region", code: "LAL", capital: "Trujillo" },
    { name: "Piura", type: "Region", code: "PIU", capital: "Piura" },
    { name: "Lambayeque", type: "Region", code: "LAM", capital: "Chiclayo" },
    { name: "Junin", type: "Region", code: "JUN", capital: "Huancayo" },
    { name: "Cajamarca", type: "Region", code: "CAJ", capital: "Cajamarca" },
    { name: "Puno", type: "Region", code: "PUN", capital: "Puno" },
    { name: "Loreto", type: "Region", code: "LOR", capital: "Iquitos" }
  ],
  CO: [
    { name: "Bogota", type: "Capital District", code: "DC", capital: "Bogota" },
    { name: "Antioquia", type: "Department", code: "ANT", capital: "Medellin" },
    { name: "Valle del Cauca", type: "Department", code: "VAC", capital: "Cali" },
    { name: "Cundinamarca", type: "Department", code: "CUN", capital: "Bogota" },
    { name: "Atlantico", type: "Department", code: "ATL", capital: "Barranquilla" },
    { name: "Santander", type: "Department", code: "SAN", capital: "Bucaramanga" },
    { name: "Bolivar", type: "Department", code: "BOL", capital: "Cartagena" },
    { name: "Norte de Santander", type: "Department", code: "NSA", capital: "Cucuta" },
    { name: "Tolima", type: "Department", code: "TOL", capital: "Ibague" },
    { name: "Caldas", type: "Department", code: "CAL", capital: "Manizales" }
  ],
  // AFRICA
  NG: [
    { name: "Lagos", type: "State", code: "LA", capital: "Ikeja" },
    { name: "Kano", type: "State", code: "KN", capital: "Kano" },
    { name: "Kaduna", type: "State", code: "KD", capital: "Kaduna" },
    { name: "Rivers", type: "State", code: "RI", capital: "Port Harcourt" },
    { name: "Oyo", type: "State", code: "OY", capital: "Ibadan" },
    { name: "Abuja", type: "Federal Capital Territory", code: "FC", capital: "Abuja" },
    { name: "Ogun", type: "State", code: "OG", capital: "Abeokuta" },
    { name: "Delta", type: "State", code: "DE", capital: "Asaba" },
    { name: "Edo", type: "State", code: "ED", capital: "Benin City" },
    { name: "Imo", type: "State", code: "IM", capital: "Owerri" }
  ],
  KE: [
    { name: "Nairobi", type: "County", code: "30", capital: "Nairobi" },
    { name: "Mombasa", type: "County", code: "01", capital: "Mombasa" },
    { name: "Nakuru", type: "County", code: "32", capital: "Nakuru" },
    { name: "Kiambu", type: "County", code: "22", capital: "Kiambu" },
    { name: "Kisumu", type: "County", code: "42", capital: "Kisumu" },
    { name: "Uasin Gishu", type: "County", code: "27", capital: "Eldoret" },
    { name: "Machakos", type: "County", code: "16", capital: "Machakos" },
    { name: "Kilifi", type: "County", code: "03", capital: "Kilifi" },
    { name: "Kajiado", type: "County", code: "34", capital: "Kajiado" },
    { name: "Kakamega", type: "County", code: "37", capital: "Kakamega" }
  ],
  ET: [
    { name: "Addis Ababa", type: "Chartered City", code: "AA", capital: "Addis Ababa" },
    { name: "Oromia", type: "Region", code: "OR", capital: "Addis Ababa" },
    { name: "Amhara", type: "Region", code: "AM", capital: "Bahir Dar" },
    { name: "Tigray", type: "Region", code: "TI", capital: "Mekele" },
    { name: "Southern Nations", type: "Region", code: "SN", capital: "Hawassa" },
    { name: "Somali", type: "Region", code: "SO", capital: "Jijiga" },
    { name: "Dire Dawa", type: "Chartered City", code: "DD", capital: "Dire Dawa" }
  ],
  MA: [
    { name: "Casablanca-Settat", type: "Region", code: "06", capital: "Casablanca" },
    { name: "Rabat-Sale-Kenitra", type: "Region", code: "04", capital: "Rabat" },
    { name: "Fes-Meknes", type: "Region", code: "03", capital: "Fes" },
    { name: "Marrakech-Safi", type: "Region", code: "07", capital: "Marrakech" },
    { name: "Tangier-Tetouan-Al Hoceima", type: "Region", code: "01", capital: "Tangier" },
    { name: "Souss-Massa", type: "Region", code: "09", capital: "Agadir" },
    { name: "Oriental", type: "Region", code: "02", capital: "Oujda" }
  ],
  // MIDDLE EAST
  SA: [
    { name: "Riyadh", type: "Region", code: "01", capital: "Riyadh" },
    { name: "Makkah", type: "Region", code: "02", capital: "Mecca" },
    { name: "Madinah", type: "Region", code: "03", capital: "Medina" },
    { name: "Eastern Province", type: "Region", code: "04", capital: "Dammam" },
    { name: "Asir", type: "Region", code: "14", capital: "Abha" },
    { name: "Qassim", type: "Region", code: "05", capital: "Buraydah" },
    { name: "Tabuk", type: "Region", code: "07", capital: "Tabuk" },
    { name: "Hail", type: "Region", code: "06", capital: "Hail" },
    { name: "Jazan", type: "Region", code: "09", capital: "Jazan" },
    { name: "Al Jawf", type: "Region", code: "12", capital: "Sakaka" }
  ],
  AE: [
    { name: "Abu Dhabi", type: "Emirate", code: "AZ", capital: "Abu Dhabi" },
    { name: "Dubai", type: "Emirate", code: "DU", capital: "Dubai" },
    { name: "Sharjah", type: "Emirate", code: "SH", capital: "Sharjah" },
    { name: "Ajman", type: "Emirate", code: "AJ", capital: "Ajman" },
    { name: "Umm Al Quwain", type: "Emirate", code: "UQ", capital: "Umm Al Quwain" },
    { name: "Ras Al Khaimah", type: "Emirate", code: "RK", capital: "Ras Al Khaimah" },
    { name: "Fujairah", type: "Emirate", code: "FU", capital: "Fujairah" }
  ],
  IL: [
    { name: "Jerusalem", type: "District", code: "JM", capital: "Jerusalem" },
    { name: "Tel Aviv", type: "District", code: "TA", capital: "Tel Aviv" },
    { name: "Haifa", type: "District", code: "HA", capital: "Haifa" },
    { name: "Central", type: "District", code: "M", capital: "Ramla" },
    { name: "Southern", type: "District", code: "D", capital: "Beersheba" },
    { name: "Northern", type: "District", code: "Z", capital: "Nazareth" }
  ],
  // SOUTHEAST ASIA (Additional)
  MM: [
    { name: "Yangon", type: "Region", code: "06", capital: "Yangon" },
    { name: "Mandalay", type: "Region", code: "04", capital: "Mandalay" },
    { name: "Naypyidaw", type: "Union Territory", code: "18", capital: "Naypyidaw" },
    { name: "Bago", type: "Region", code: "02", capital: "Bago" },
    { name: "Ayeyarwady", type: "Region", code: "07", capital: "Pathein" },
    { name: "Shan", type: "State", code: "17", capital: "Taunggyi" }
  ],
  KH: [
    { name: "Phnom Penh", type: "Municipality", code: "12", capital: "Phnom Penh" },
    { name: "Siem Reap", type: "Province", code: "17", capital: "Siem Reap" },
    { name: "Battambang", type: "Province", code: "02", capital: "Battambang" },
    { name: "Kandal", type: "Province", code: "08", capital: "Ta Khmau" },
    { name: "Preah Sihanouk", type: "Province", code: "18", capital: "Sihanoukville" },
    { name: "Kampong Cham", type: "Province", code: "03", capital: "Kampong Cham" }
  ],
  LA: [
    { name: "Vientiane Prefecture", type: "Prefecture", code: "VT", capital: "Vientiane" },
    { name: "Champasak", type: "Province", code: "CH", capital: "Pakse" },
    { name: "Luang Prabang", type: "Province", code: "LP", capital: "Luang Prabang" },
    { name: "Savannakhet", type: "Province", code: "SV", capital: "Savannakhet" },
    { name: "Vientiane", type: "Province", code: "VI", capital: "Vientiane" }
  ],
  // EUROPEAN ADDITIONS
  NL: [
    { name: "North Holland", type: "Province", code: "NH", capital: "Haarlem" },
    { name: "South Holland", type: "Province", code: "ZH", capital: "The Hague" },
    { name: "North Brabant", type: "Province", code: "NB", capital: "'s-Hertogenbosch" },
    { name: "Gelderland", type: "Province", code: "GE", capital: "Arnhem" },
    { name: "Utrecht", type: "Province", code: "UT", capital: "Utrecht" },
    { name: "Limburg", type: "Province", code: "LI", capital: "Maastricht" },
    { name: "Overijssel", type: "Province", code: "OV", capital: "Zwolle" },
    { name: "Friesland", type: "Province", code: "FR", capital: "Leeuwarden" },
    { name: "Groningen", type: "Province", code: "GR", capital: "Groningen" },
    { name: "Drenthe", type: "Province", code: "DR", capital: "Assen" },
    { name: "Flevoland", type: "Province", code: "FL", capital: "Lelystad" },
    { name: "Zeeland", type: "Province", code: "ZE", capital: "Middelburg" }
  ],
  BE: [
    { name: "Brussels", type: "Region", code: "BRU", capital: "Brussels" },
    { name: "Flanders", type: "Region", code: "VLG", capital: "Brussels" },
    { name: "Wallonia", type: "Region", code: "WAL", capital: "Namur" },
    { name: "Antwerp", type: "Province", code: "VAN", capital: "Antwerp" },
    { name: "East Flanders", type: "Province", code: "VOV", capital: "Ghent" },
    { name: "West Flanders", type: "Province", code: "VWV", capital: "Bruges" },
    { name: "Flemish Brabant", type: "Province", code: "VBR", capital: "Leuven" },
    { name: "Limburg", type: "Province", code: "VLI", capital: "Hasselt" },
    { name: "Liege", type: "Province", code: "WLG", capital: "Liege" },
    { name: "Namur", type: "Province", code: "WNA", capital: "Namur" }
  ],
  CH: [
    { name: "Zurich", type: "Canton", code: "ZH", capital: "Zurich" },
    { name: "Bern", type: "Canton", code: "BE", capital: "Bern" },
    { name: "Geneva", type: "Canton", code: "GE", capital: "Geneva" },
    { name: "Vaud", type: "Canton", code: "VD", capital: "Lausanne" },
    { name: "Valais", type: "Canton", code: "VS", capital: "Sion" },
    { name: "Ticino", type: "Canton", code: "TI", capital: "Bellinzona" },
    { name: "Lucerne", type: "Canton", code: "LU", capital: "Lucerne" },
    { name: "Basel-City", type: "Canton", code: "BS", capital: "Basel" },
    { name: "Basel-Landschaft", type: "Canton", code: "BL", capital: "Liestal" },
    { name: "Aargau", type: "Canton", code: "AG", capital: "Aarau" }
  ],
  AT: [
    { name: "Vienna", type: "State", code: "9", capital: "Vienna" },
    { name: "Lower Austria", type: "State", code: "3", capital: "St. Polten" },
    { name: "Upper Austria", type: "State", code: "4", capital: "Linz" },
    { name: "Styria", type: "State", code: "6", capital: "Graz" },
    { name: "Tyrol", type: "State", code: "7", capital: "Innsbruck" },
    { name: "Salzburg", type: "State", code: "5", capital: "Salzburg" },
    { name: "Carinthia", type: "State", code: "2", capital: "Klagenfurt" },
    { name: "Vorarlberg", type: "State", code: "8", capital: "Bregenz" },
    { name: "Burgenland", type: "State", code: "1", capital: "Eisenstadt" }
  ],
  SE: [
    { name: "Stockholm", type: "County", code: "AB", capital: "Stockholm" },
    { name: "Vastra Gotaland", type: "County", code: "O", capital: "Gothenburg" },
    { name: "Skane", type: "County", code: "M", capital: "Malmo" },
    { name: "Uppsala", type: "County", code: "C", capital: "Uppsala" },
    { name: "Ostergotland", type: "County", code: "E", capital: "Linkoping" },
    { name: "Jonkoping", type: "County", code: "F", capital: "Jonkoping" },
    { name: "Dalarna", type: "County", code: "W", capital: "Falun" },
    { name: "Vastmanland", type: "County", code: "U", capital: "Vasteras" }
  ],
  NO: [
    { name: "Oslo", type: "County", code: "03", capital: "Oslo" },
    { name: "Viken", type: "County", code: "30", capital: "Oslo" },
    { name: "Innlandet", type: "County", code: "34", capital: "Hamar" },
    { name: "Vestfold og Telemark", type: "County", code: "38", capital: "Tonsberg" },
    { name: "Agder", type: "County", code: "42", capital: "Kristiansand" },
    { name: "Rogaland", type: "County", code: "11", capital: "Stavanger" },
    { name: "Vestland", type: "County", code: "46", capital: "Bergen" },
    { name: "More og Romsdal", type: "County", code: "15", capital: "Molde" },
    { name: "Nordland", type: "County", code: "18", capital: "Bodo" },
    { name: "Troms og Finnmark", type: "County", code: "54", capital: "Tromso" }
  ],
  DK: [
    { name: "Capital Region", type: "Region", code: "84", capital: "Copenhagen" },
    { name: "Zealand", type: "Region", code: "85", capital: "Sorø" },
    { name: "Southern Denmark", type: "Region", code: "83", capital: "Vejle" },
    { name: "Central Denmark", type: "Region", code: "82", capital: "Viborg" },
    { name: "North Denmark", type: "Region", code: "81", capital: "Aalborg" }
  ],
  FI: [
    { name: "Uusimaa", type: "Region", code: "01", capital: "Helsinki" },
    { name: "Pirkanmaa", type: "Region", code: "06", capital: "Tampere" },
    { name: "Southwest Finland", type: "Region", code: "02", capital: "Turku" },
    { name: "North Ostrobothnia", type: "Region", code: "14", capital: "Oulu" },
    { name: "Central Finland", type: "Region", code: "13", capital: "Jyvaskyla" },
    { name: "Lapland", type: "Region", code: "19", capital: "Rovaniemi" }
  ],
  PL: [
    { name: "Masovian", type: "Voivodeship", code: "MZ", capital: "Warsaw" },
    { name: "Silesian", type: "Voivodeship", code: "SL", capital: "Katowice" },
    { name: "Greater Poland", type: "Voivodeship", code: "WP", capital: "Poznan" },
    { name: "Lesser Poland", type: "Voivodeship", code: "MA", capital: "Krakow" },
    { name: "Lower Silesian", type: "Voivodeship", code: "DS", capital: "Wroclaw" },
    { name: "Pomeranian", type: "Voivodeship", code: "PM", capital: "Gdansk" },
    { name: "Lodz", type: "Voivodeship", code: "LD", capital: "Lodz" },
    { name: "West Pomeranian", type: "Voivodeship", code: "ZP", capital: "Szczecin" }
  ],
  CZ: [
    { name: "Prague", type: "Capital City", code: "PR", capital: "Prague" },
    { name: "Central Bohemian", type: "Region", code: "ST", capital: "Prague" },
    { name: "South Moravian", type: "Region", code: "JM", capital: "Brno" },
    { name: "Moravian-Silesian", type: "Region", code: "MO", capital: "Ostrava" },
    { name: "Plzen", type: "Region", code: "PL", capital: "Plzen" },
    { name: "South Bohemian", type: "Region", code: "JC", capital: "Ceske Budejovice" },
    { name: "Usti nad Labem", type: "Region", code: "US", capital: "Usti nad Labem" },
    { name: "Hradec Kralove", type: "Region", code: "KR", capital: "Hradec Kralove" }
  ],
  GR: [
    { name: "Attica", type: "Region", code: "I", capital: "Athens" },
    { name: "Central Macedonia", type: "Region", code: "B", capital: "Thessaloniki" },
    { name: "Crete", type: "Region", code: "M", capital: "Heraklion" },
    { name: "Western Greece", type: "Region", code: "G", capital: "Patras" },
    { name: "Thessaly", type: "Region", code: "E", capital: "Larissa" },
    { name: "Peloponnese", type: "Region", code: "J", capital: "Tripoli" },
    { name: "South Aegean", type: "Region", code: "L", capital: "Ermoupoli" }
  ],
  PT: [
    { name: "Lisbon", type: "Region", code: "11", capital: "Lisbon" },
    { name: "Porto", type: "Region", code: "13", capital: "Porto" },
    { name: "Braga", type: "Region", code: "03", capital: "Braga" },
    { name: "Setubal", type: "Region", code: "15", capital: "Setubal" },
    { name: "Faro", type: "Region", code: "08", capital: "Faro" },
    { name: "Coimbra", type: "Region", code: "06", capital: "Coimbra" },
    { name: "Azores", type: "Autonomous Region", code: "20", capital: "Ponta Delgada" },
    { name: "Madeira", type: "Autonomous Region", code: "30", capital: "Funchal" }
  ],
  IE: [
    { name: "Dublin", type: "County", code: "D", capital: "Dublin" },
    { name: "Cork", type: "County", code: "CO", capital: "Cork" },
    { name: "Galway", type: "County", code: "G", capital: "Galway" },
    { name: "Limerick", type: "County", code: "LK", capital: "Limerick" },
    { name: "Kerry", type: "County", code: "KY", capital: "Tralee" },
    { name: "Clare", type: "County", code: "CE", capital: "Ennis" }
  ],
  // ASIAN ADDITIONS
  LK: [
    { name: "Western", type: "Province", code: "1", capital: "Colombo" },
    { name: "Central", type: "Province", code: "2", capital: "Kandy" },
    { name: "Southern", type: "Province", code: "3", capital: "Galle" },
    { name: "Northern", type: "Province", code: "4", capital: "Jaffna" },
    { name: "Eastern", type: "Province", code: "5", capital: "Trincomalee" },
    { name: "North Western", type: "Province", code: "6", capital: "Kurunegala" },
    { name: "North Central", type: "Province", code: "7", capital: "Anuradhapura" },
    { name: "Uva", type: "Province", code: "8", capital: "Badulla" },
    { name: "Sabaragamuwa", type: "Province", code: "9", capital: "Ratnapura" }
  ],
  NP: [
    { name: "Bagmati", type: "Province", code: "P3", capital: "Kathmandu" },
    { name: "Gandaki", type: "Province", code: "P4", capital: "Pokhara" },
    { name: "Province 1", type: "Province", code: "P1", capital: "Biratnagar" },
    { name: "Lumbini", type: "Province", code: "P5", capital: "Butwal" },
    { name: "Madhesh", type: "Province", code: "P2", capital: "Janakpur" },
    { name: "Karnali", type: "Province", code: "P6", capital: "Birendranagar" },
    { name: "Sudurpashchim", type: "Province", code: "P7", capital: "Dhangadhi" }
  ],
  // CENTRAL ASIA
  KZ: [
    { name: "Almaty", type: "City", code: "ALA", capital: "Almaty" },
    { name: "Almaty Region", type: "Region", code: "ALM", capital: "Taldykorgan" },
    { name: "Nur-Sultan", type: "City", code: "AST", capital: "Nur-Sultan" },
    { name: "Karaganda", type: "Region", code: "KAR", capital: "Karaganda" },
    { name: "Shymkent", type: "City", code: "SHY", capital: "Shymkent" },
    { name: "East Kazakhstan", type: "Region", code: "VOS", capital: "Oskemen" }
  ],
  UZ: [
    { name: "Tashkent", type: "City", code: "TK", capital: "Tashkent" },
    { name: "Tashkent Region", type: "Region", code: "TO", capital: "Tashkent" },
    { name: "Samarkand", type: "Region", code: "SA", capital: "Samarkand" },
    { name: "Fergana", type: "Region", code: "FA", capital: "Fergana" },
    { name: "Andijan", type: "Region", code: "AN", capital: "Andijan" },
    { name: "Bukhara", type: "Region", code: "BU", capital: "Bukhara" }
  ]
};

async function insertRegions(client) {
  const stats = {};
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  console.log('\nStarting comprehensive region population...\n');

  for (const [countryCode, regions] of Object.entries(REGIONS_DATA)) {
    console.log(`Processing ${countryCode}...`);
    let inserted = 0;
    let skipped = 0;

    for (const region of regions) {
      try {
        // Check if region already exists
        const checkResult = await client.query(
          'SELECT id FROM regions WHERE country_code = $1 AND name = $2',
          [countryCode, region.name]
        );

        if (checkResult.rows.length > 0) {
          skipped++;
          continue;
        }

        // Insert region
        // Use the region's code as region_code (required field)
        const regionCode = region.code || `${countryCode}-${region.name.substring(0, 3).toUpperCase()}`;

        await client.query(
          `INSERT INTO regions (country_code, region_code, name, type, code, capital, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [countryCode, regionCode, region.name, region.type, region.code, region.capital]
        );

        inserted++;
      } catch (error) {
        console.error(`Error inserting ${region.name} in ${countryCode}:`, error.message);
        totalErrors++;
      }
    }

    stats[countryCode] = { inserted, skipped, total: regions.length };
    totalInserted += inserted;
    totalSkipped += skipped;

    console.log(`  ${countryCode}: ${inserted} inserted, ${skipped} skipped`);
  }

  return { stats, totalInserted, totalSkipped, totalErrors };
}

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    const { stats, totalInserted, totalSkipped, totalErrors } = await insertRegions(client);

    console.log('\n' + '='.repeat(80));
    console.log('COMPREHENSIVE REGION POPULATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nTotal regions inserted: ${totalInserted}`);
    console.log(`Total regions skipped (already exist): ${totalSkipped}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log(`\nCountries processed: ${Object.keys(stats).length}`);

    console.log('\n' + '-'.repeat(80));
    console.log('DETAILED STATISTICS BY COUNTRY');
    console.log('-'.repeat(80));

    // Group by region for better organization
    const regions = {
      'Asia-Pacific': ['US', 'CN', 'IN', 'VN', 'TH', 'ID', 'PH', 'JP', 'KR', 'MY', 'SG', 'MM', 'KH', 'LA', 'LK', 'NP'],
      'Europe': ['FR', 'IT', 'ES', 'DE', 'GB', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'GR', 'PT', 'IE', 'RU'],
      'Americas': ['CA', 'MX', 'BR', 'AR', 'CL', 'PE', 'CO', 'AU'],
      'Middle East': ['TR', 'IR', 'SA', 'AE', 'IL'],
      'Africa': ['EG', 'ZA', 'NG', 'KE', 'ET', 'MA'],
      'Central Asia': ['PK', 'BD', 'KZ', 'UZ'],
      'Oceania': ['NZ']
    };

    for (const [regionName, countries] of Object.entries(regions)) {
      console.log(`\n${regionName}:`);
      for (const code of countries) {
        if (stats[code]) {
          const s = stats[code];
          console.log(`  ${code}: ${s.inserted} inserted / ${s.total} total (${s.skipped} already existed)`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

main();
