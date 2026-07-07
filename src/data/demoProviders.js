const imageBase = "https://images.unsplash.com";

export const demoProviders = [
  ["demo-aarav", "Aarav Mehta", "Mumbai", "Maharashtra", "Male", "Sports", 900, 4.9, "Cricket, street food and evening walks around Bandra.", "Sports companion", `${imageBase}/photo-1500648767791-00dcc994a43e?w=900&auto=format&fit=crop&q=85`],
  ["demo-isha", "Isha Kapoor", "Delhi", "Delhi", "Female", "Coffee", 700, 4.8, "Cafe conversations, book stores and calm public meetups.", "Cafe buddy", `${imageBase}/photo-1494790108377-be9c29b29330?w=900&auto=format&fit=crop&q=85`],
  ["demo-rohan", "Rohan Nair", "Bengaluru", "Karnataka", "Male", "Movies", 850, 4.7, "Hindi films, stand-up shows and weekend mall plans.", "Movie companion", `${imageBase}/photo-1507003211169-0a1dd7228f2d?w=900&auto=format&fit=crop&q=85`],
  ["demo-meera", "Meera Iyer", "Chennai", "Tamil Nadu", "Female", "Dinner", 1000, 4.9, "South Indian food walks and friendly dinner company.", "Food explorer", `${imageBase}/photo-1544005313-94ddf0286df2?w=900&auto=format&fit=crop&q=85`],
  ["demo-kabir", "Kabir Singh", "Jaipur", "Rajasthan", "Male", "City walk", 650, 4.6, "Old city walks, forts, chai stops and photo corners.", "Local guide", `${imageBase}/photo-1506794778202-cad84cf45f1d?w=900&auto=format&fit=crop&q=85`],
  ["demo-ananya", "Ananya Rao", "Hyderabad", "Telangana", "Female", "Shopping", 800, 4.8, "Shopping malls, biryani spots and relaxed public plans.", "Shopping buddy", `${imageBase}/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop&q=85`],
  ["demo-vikram", "Vikram Joshi", "Pune", "Maharashtra", "Male", "Gaming", 750, 4.7, "Arcades, gaming cafes and easygoing weekend hangouts.", "Gaming buddy", `${imageBase}/photo-1519085360753-af0119f7cbe7?w=900&auto=format&fit=crop&q=85`],
  ["demo-sanya", "Sanya Malhotra", "Kolkata", "West Bengal", "Female", "Coffee", 650, 4.9, "Coffee, art galleries and good conversations in public places.", "Conversation buddy", `${imageBase}/photo-1524504388940-b1c1722653e1?w=900&auto=format&fit=crop&q=85`],
  ["demo-dev", "Dev Sharma", "Ahmedabad", "Gujarat", "Male", "Dinner", 700, 4.6, "Gujarati food trails and safe evening meetups.", "Food buddy", `${imageBase}/photo-1506794778202-cad84cf45f1d?w=900&auto=format&fit=crop&q=85`],
  ["demo-priya", "Priya Menon", "Kochi", "Kerala", "Female", "City walk", 900, 4.8, "Marine Drive walks, cafes and cultural places.", "City companion", `${imageBase}/photo-1517841905240-472988babdf9?w=900&auto=format&fit=crop&q=85`],
  ["demo-arjun", "Arjun Verma", "Lucknow", "Uttar Pradesh", "Male", "Movies", 600, 4.5, "Movies, kebab spots and relaxed public company.", "Movie buddy", `${imageBase}/photo-1527980965255-d3b416303d12?w=900&auto=format&fit=crop&q=85`],
  ["demo-nisha", "Nisha Bansal", "Indore", "Madhya Pradesh", "Female", "Sports", 650, 4.7, "Badminton, cricket screenings and snack walks.", "Sports buddy", `${imageBase}/photo-1508214751196-bcfd4ca60f91?w=900&auto=format&fit=crop&q=85`],
  ["demo-yash", "Yash Patel", "Surat", "Gujarat", "Male", "Shopping", 550, 4.6, "Textile markets, street food and friendly shopping help.", "Shopping companion", `${imageBase}/photo-1507591064344-4c6ce005b128?w=900&auto=format&fit=crop&q=85`],
  ["demo-riya", "Riya Sen", "Gurugram", "Haryana", "Female", "Dinner", 1100, 4.9, "Cyber Hub dinners, coffee and premium public meetups.", "Dinner companion", `${imageBase}/photo-1488426862026-3ee34a7d66df?w=900&auto=format&fit=crop&q=85`],
  ["demo-aditya", "Aditya Kulkarni", "Nagpur", "Maharashtra", "Male", "Coffee", 500, 4.5, "Chai, college-area cafes and casual conversations.", "Cafe companion", `${imageBase}/photo-1504257432389-52343af06ae3?w=900&auto=format&fit=crop&q=85`],
  ["demo-tara", "Tara Dutta", "Bhubaneswar", "Odisha", "Female", "City walk", 600, 4.7, "Temple trails, parks and cultural public spaces.", "Walk buddy", `${imageBase}/photo-1531123897727-8f129e1688ce?w=900&auto=format&fit=crop&q=85`],
  ["demo-rahul", "Rahul Das", "Guwahati", "Assam", "Male", "Sports", 700, 4.6, "Football, cafes and riverside public meetups.", "Sports companion", `${imageBase}/photo-1463453091185-61582044d556?w=900&auto=format&fit=crop&q=85`],
  ["demo-kavya", "Kavya Reddy", "Vijayawada", "Andhra Pradesh", "Female", "Movies", 750, 4.8, "Telugu films, malls and safe public hangouts.", "Movie companion", `${imageBase}/photo-1520813792240-56fc4a3765a7?w=900&auto=format&fit=crop&q=85`],
  ["demo-samar", "Samar Khan", "Bhopal", "Madhya Pradesh", "Male", "Gaming", 650, 4.5, "Gaming lounges, lakeside chai and relaxed meetups.", "Gaming buddy", `${imageBase}/photo-1507591064344-4c6ce005b128?w=900&auto=format&fit=crop&q=85`],
  ["demo-avni", "Avni Jain", "Noida", "Uttar Pradesh", "Female", "Shopping", 850, 4.8, "Mall plans, cafes and clean public meeting spots.", "Shopping companion", `${imageBase}/photo-1524503033411-c9566986fc8f?w=900&auto=format&fit=crop&q=85`],
].map(([id, name, city, state, gender, activity, price, rating, bio, profession, image], index) => ({
  id,
  name,
  city,
  state,
  gender,
  activities: [activity],
  price,
  rating,
  reviews: 18 + index * 3,
  bio,
  profession,
  headline: bio,
  image,
  images: [image],
  age: 22 + (index % 10),
  available: true,
  languages: "Hindi, English",
  availabilityDays: "Weekends and evenings",
}));

export function getDemoProvider(id) {
  return demoProviders.find((provider) => provider.id === id) || null;
}
