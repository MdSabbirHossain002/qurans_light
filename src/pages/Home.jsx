import { useEffect, useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; 
import { Play, Pause, Dices } from "lucide-react";

// ✅ Helper 1: HEX থেকে RGB কনভার্টার (নতুন আয়াতের জন্য)
const hexToRgb = (hex) => {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "16, 185, 129";
};

// ✅ Helper 2: ছবি থেকে অটোমেটিক কালার এক্সট্রাক্টর (পুরোনো আয়াতের জন্য)
const extractDominantColor = (imageUrl, callback) => {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 'cors-bypass=' + Date.now();
  
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width; canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    try {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 40) { // পিক্সেল স্ক্যান
        r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
      }
      if (count > 0) callback(`${Math.floor(r / count)}, ${Math.floor(g / count)}, ${Math.floor(b / count)}`);
      else callback(null);
    } catch (e) { callback(null); }
  };
  img.onerror = () => callback(null);
};

export default function Home({ language }) {
  const [allVerses, setAllVerses] = useState([]);
  const [currentVerse, setCurrentVerse] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // ✅ Dynamic Theme Color State
  const [themeColor, setThemeColor] = useState("16, 185, 129"); // Default Emerald Color
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchAllVerses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "verses"));
        const versesArray = [];
        querySnapshot.forEach((doc) => versesArray.push({ id: doc.id, ...doc.data() }));
        setAllVerses(versesArray);
        
        if (versesArray.length > 0) {
          const uniqueCategories = ["All", ...new Set(versesArray.map(v => v.category).filter(Boolean))];
          setCategories(uniqueCategories);
          const random = versesArray[Math.floor(Math.random() * versesArray.length)];
          setCurrentVerse(random);
        }
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchAllVerses();
  }, []);

  // ✅ আয়াত চেঞ্জ হলে থিম কালার ম্যাজিক ট্রিগার হবে
  useEffect(() => {
    if (currentVerse) {
      if (currentVerse.theme_color) {
        setThemeColor(hexToRgb(currentVerse.theme_color)); // নতুন আয়াতের সরাসরি কালার
      } else if (currentVerse.bg_image) {
        extractDominantColor(currentVerse.bg_image, (color) => {
          setThemeColor(color || "16, 185, 129"); // পুরোনো আয়াতের ছবি স্ক্যান
        });
      }
    }
  }, [currentVerse]);

  const pickRandomVerse = (versesData, category) => {
    let filteredVerses = versesData;
    if (category !== "All") filteredVerses = versesData.filter(v => v.category === category);
    
    if (filteredVerses.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredVerses.length);
      setCurrentVerse(filteredVerses[randomIndex]);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } else setCurrentVerse(null);
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-900 dark:text-white pt-16">Loading...</div>;
  if (!currentVerse && !loading) return <div className="min-h-screen flex items-center justify-center text-gray-900 dark:text-white pt-16">No verses found. Add some from Admin (/admin).</div>;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative bg-cover bg-center transition-all duration-1000 pt-24 pb-10"
      style={{ backgroundImage: `url(${currentVerse?.bg_image})` }}
    >
      <div className="absolute inset-0 bg-white/30 dark:bg-black/50 transition-colors duration-500"></div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center mt-4">
        
        {/* Categories Menu */}
        <div className="w-full max-w-3xl overflow-x-auto no-scrollbar mb-8 px-4">
          <div className="flex gap-2 w-max mx-auto md:justify-center">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => { setActiveCategory(category); pickRandomVerse(allVerses, category); }}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-500 border whitespace-nowrap backdrop-blur-md ${
                  activeCategory === category
                    ? "text-white shadow-lg border-transparent"
                    : "bg-white/60 border-white/40 text-gray-800 hover:bg-white dark:bg-black/60 dark:border-white/20 dark:text-gray-200 dark:hover:bg-black/80"
                }`}
                // 🎨 Dynamic Button Background
                style={activeCategory === category ? { backgroundColor: `rgb(${themeColor})`, boxShadow: `0 4px 15px rgba(${themeColor}, 0.5)` } : {}}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Verse Box */}
        <div className="text-center w-full max-w-4xl px-6 bg-white/70 dark:bg-black/60 p-8 md:p-12 rounded-3xl backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl transition-colors duration-500">
          
          {/* 🎨 Dynamic Category Pill */}
          <span 
            className="px-4 py-1.5 rounded-full border text-gray-900 dark:text-white text-xs font-bold tracking-wider uppercase mb-6 inline-block transition-all duration-500"
            style={{ 
              backgroundColor: `rgba(${themeColor}, 0.3)`, 
              borderColor: `rgba(${themeColor}, 0.5)`,
              boxShadow: `0 0 15px rgba(${themeColor}, 0.2)`
            }}
          >
            {currentVerse.category}
          </span>
          
          <h2 className="text-2xl md:text-2xl lg:text-3xl text-gray-900 dark:text-white mb-8 leading-loose md:leading-loose transition-colors duration-500 drop-shadow-sm" dir="rtl" style={{ fontFamily: "'Amiri', serif" }}>
            {currentVerse.arabic_indopak}
          </h2>

          <p className="text-lg md:text-xl text-gray-800 dark:text-gray-200 mb-8 font-medium leading-relaxed transition-colors duration-500">
            {language === "bn" ? currentVerse.bangla : currentVerse.english}
          </p>

          {/* 🎨 Dynamic Surah Name Indicator Dot */}
          <p className="text-gray-700 dark:text-gray-300 font-bold mb-8 text-sm md:text-base tracking-wide flex items-center justify-center gap-2 transition-colors duration-500">
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: `rgb(${themeColor})`, boxShadow: `0 0 10px rgba(${themeColor}, 0.8)` }}
            ></span>
            Surah {currentVerse.suraName ? currentVerse.suraName : currentVerse.sura} (Ayah {currentVerse.ayat})
          </p>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <audio ref={audioRef} src={currentVerse.audio} onEnded={() => setIsPlaying(false)} />
            
            {/* 🎨 Dynamic Play Button */}
            <button 
              onClick={toggleAudio}
              className="flex items-center justify-center w-14 h-14 rounded-full text-white transition-all hover:scale-110 duration-500"
              style={{ backgroundColor: `rgb(${themeColor})`, boxShadow: `0 8px 25px rgba(${themeColor}, 0.6)` }}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </button>

            <button
              onClick={() => pickRandomVerse(allVerses, activeCategory)}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-gray-800 dark:text-white transition-all backdrop-blur-md border border-gray-300 dark:border-white/10 hover:rotate-180 duration-500 shadow-lg"
              title="Next Verse"
            >
              <Dices size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}