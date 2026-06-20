import { useEffect, useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; 
import { Play, Pause, Dices } from "lucide-react";

export default function Home({ language }) {
  const [allVerses, setAllVerses] = useState([]);
  const [currentVerse, setCurrentVerse] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  // Home.jsx এ useEffect অংশটি এভাবে লিখুন:
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
        // এখানে সরাসরি কল করুন
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
      {/* Updated Overlay: Much lighter, no blur on the whole screen so image is clear */}
      <div className="absolute inset-0 bg-white/30 dark:bg-black/50 transition-colors duration-500"></div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center mt-4">
        
        {/* Categories */}
        <div className="w-full max-w-3xl overflow-x-auto no-scrollbar mb-8 px-4">
          <div className="flex gap-2 w-max mx-auto md:justify-center">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => { setActiveCategory(category); pickRandomVerse(allVerses, category); }}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 border whitespace-nowrap backdrop-blur-md ${
                  activeCategory === category
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg"
                    : "bg-white/60 border-white/40 text-gray-800 hover:bg-white dark:bg-black/60 dark:border-white/20 dark:text-gray-200 dark:hover:bg-black/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Verse Box - Glassmorphism Effect Applied Here */}
        <div className="text-center w-full max-w-4xl px-6 bg-white/70 dark:bg-black/60 p-8 md:p-12 rounded-3xl backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl transition-colors duration-500">
          <span className="px-4 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold tracking-wider uppercase mb-6 inline-block">
            {currentVerse.category}
          </span>
          
          <h2 className="text-2xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-8 leading-loose md:leading-loose transition-colors duration-500 drop-shadow-sm" dir="rtl" style={{ fontFamily: "'Scheherazade New', serif" }}>
            {currentVerse.arabic_indopak}
          </h2>

          <p className="text-lg md:text-xl text-gray-800 dark:text-gray-200 mb-8 font-medium leading-relaxed transition-colors duration-500">
            {language === "bn" ? currentVerse.bangla : currentVerse.english}
          </p>

          <p className="text-emerald-700 dark:text-emerald-400 font-bold mb-8 text-sm md:text-base tracking-wide">
            — Surah {currentVerse.suraName ? currentVerse.suraName : currentVerse.sura} (Ayah {currentVerse.ayat})
          </p>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <audio ref={audioRef} src={currentVerse.audio} onEnded={() => setIsPlaying(false)} />
            
            <button 
              onClick={toggleAudio}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xl hover:scale-110"
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