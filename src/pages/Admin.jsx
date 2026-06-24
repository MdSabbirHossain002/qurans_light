import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Trash2, Edit2, Check, X } from "lucide-react";

<<<<<<< HEAD
export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

=======
// নির্দিষ্ট ক্যাটাগরি লিস্ট
const CATEGORY_LIST = ["Faith", "Prayer", "Mercy", "Warning", "Patience", "Guidance", "Hereafter", "Charity", "Prophets", "Forgiveness", "Motivation", "Loneliness", "Peace", "Sadness", "Gratitude", "Hope", "Healing", "Hardship", "Love", "Justice", "Wisdom", "Anxiety", "Joy", "Reflection", "Trust"];

export default function Admin() {
  // === Add Verse States ===
>>>>>>> eed9d05a610eed88ace5ee1dcdf75e0b0ddbc57e
  const [sura, setSura] = useState("");
  const [ayat, setAyat] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

<<<<<<< HEAD
  const handleLogin = (e) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;
=======
  // === Management Table States ===
  const [versesList, setVersesList] = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");
  const [categories, setCategories] = useState([]);
  
  // === Loading & Error States ===
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  
  // === Edit Category States ===
  const [editingId, setEditingId] = useState(null);
  const [editCategoryVal, setEditCategoryVal] = useState("");
>>>>>>> eed9d05a610eed88ace5ee1dcdf75e0b0ddbc57e

  const fetchVersesList = async () => {
    setListLoading(true);
    setListError("");
    try {
      const querySnapshot = await getDocs(collection(db, "verses"));
      const versesArray = [];
      querySnapshot.forEach((doc) => {
        versesArray.push({ id: doc.id, ...doc.data() });
      });
      setVersesList(versesArray);

      const uniqueCategories = ["All", ...new Set(versesArray.map(v => v.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching verses list:", error);
      setListError(error.message);
    } finally {
      setListLoading(false);
    }
  };

<<<<<<< HEAD
  const handleFetchAndSave = async (e) => {
    e.preventDefault();
=======
  useEffect(() => {
    fetchVersesList();
  }, []);

  const handleFetchAndSave = async () => {
    if (!sura || !ayat) return setMessage("Please enter Sura and Ayat number");
>>>>>>> eed9d05a610eed88ace5ee1dcdf75e0b0ddbc57e
    setLoading(true);
    setMessage("");

    try {
<<<<<<< HEAD
      const [arabicRes, banglaRes, englishRes, audioRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/ayah/${sura}:${ayah}/quran-indo-pak`),
        fetch(`https://api.alquran.cloud/v1/ayah/${sura}:${ayah}/bn.bengali`),
        fetch(`https://api.alquran.cloud/v1/ayah/${sura}:${ayah}/en.asad`),
        fetch(`https://api.alquran.cloud/v1/ayah/${sura}:${ayah}/ar.alafasy`)
      ]);
      
      if (!arabicRes.ok || !banglaRes.ok || !englishRes.ok) {
        throw new Error("Invalid Surah or Ayah number! Please check again.");
      }
=======
      const quranRes = await fetch(`https://api.alquran.cloud/v1/ayah/${sura}:${ayat}/editions/quran-indopak,en.asad,bn.bengali`);
      const quranData = await quranRes.json();
      if (quranData.code !== 200) throw new Error("Verse not found!");
>>>>>>> eed9d05a610eed88ace5ee1dcdf75e0b0ddbc57e

      const arabic_indopak = quranData.data[0].text;
      const suraName = quranData.data[0].surah.englishName;
      const english = quranData.data[1].text;
      const bangla = quranData.data[2].text;

      const audioRes = await fetch(`https://api.alquran.cloud/v1/ayah/${sura}:${ayat}/ar.alafasy`);
      const audioData = await audioRes.json();
      const audio = audioData.data.audio;

<<<<<<< HEAD
      const arabic = arabicData.data.text;
      const bangla = banglaData.data.text;
      const english = englishData.data.text;
      const suraName = arabicData.data.surah.englishName;
      const audioUrl = audioData.data.audio;

=======
      // Gemini API Fetch (Category & Keyword)
>>>>>>> eed9d05a610eed88ace5ee1dcdf75e0b0ddbc57e
      const prompt = `Analyze this Quranic verse translation: "${english}". 
      Return a valid JSON object with exactly two keys:
      1. "category": Choose EXACTLY ONE category from this strict list: ["Faith", "Prayer", "Mercy", "Warning", "Patience", "Guidance", "Hereafter", "Charity", "Prophets", "Forgiveness", "Motivation", "Loneliness", "Peace", "Sadness", "Gratitude", "Hope", "Healing", "Hardship", "Love", "Justice", "Wisdom", "Anxiety", "Joy", "Reflection", "Trust"].
      2. "image_keyword": Provide a 1-3 word highly specific visual search term for Unsplash. 
      - RULE 1: Prioritize elegant Islamic/spiritual aesthetics if appropriate for the verse (e.g., "mosque silhouette", "Islamic arch", "lantern", "crescent moon", "prayer beads", "dome").
      - RULE 2: If religious objects don't fit the verse's exact meaning, use majestic, peaceful nature elements that evoke a spiritual feeling (e.g., "starry night sky", "light rays", "calm ocean", "desert night").
      - RULE 3: STRICTLY avoid human faces, animals, or modern busy objects. The vibe must be minimal, religious, and suitable for a Quranic background.`;
      
      
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      if (!geminiRes.ok) throw new Error("Gemini API Error!");
      
      const geminiData = await geminiRes.json();
      let aiText = geminiData.candidates[0].content.parts[0].text.trim();
      
      aiText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const aiResponse = JSON.parse(aiText);

<<<<<<< HEAD
      const unsplashRes = await fetch(`https://api.unsplash.com/photos/random?query=${aiResponse.image_keyword}&orientation=landscape&client_id=${import.meta.env.VITE_UNSPLASH_ACCESS_KEY}`);
      if (!unsplashRes.ok) throw new Error("Unsplash API Error! Image not found.");

      const unsplashData = await unsplashRes.json();
      const bg_image = unsplashData.urls?.regular || "https://images.unsplash.com/photo-1572949645841-094f3a9c4c94";
      
      // ✅ নতুন ম্যাজিক: আনস্প্ল্যাশ থেকে সরাসরি ছবির মূল কালার কোড বের করে আনা
      const theme_color = unsplashData.color || "#10b981"; 

      const verseDoc = {
=======
      const unsplashRes = await fetch(`https://api.unsplash.com/search/photos?query=${aiResponse.image_keyword}&orientation=landscape&client_id=${import.meta.env.VITE_UNSPLASH_ACCESS_KEY}`);
      const unsplashData = await unsplashRes.json();
      const bg_image = unsplashData.results.length > 0 ? unsplashData.results[0].urls.regular : "https://source.unsplash.com/random/1920x1080/?nature";

      await addDoc(collection(db, "verses"), {
>>>>>>> eed9d05a610eed88ace5ee1dcdf75e0b0ddbc57e
        sura: Number(sura),
        suraName,
        ayat: Number(ayat),
        arabic_indopak,
        english,
        bangla,
        audio,
        category: aiResponse.category,
<<<<<<< HEAD
        bg_image: bg_image,
        theme_color: theme_color, // ✅ ডেটাবেসে কালার কোড সেভ করা হচ্ছে
        createdAt: new Date()
      };

      await addDoc(collection(db, "verses"), verseDoc);
      setMessage("Success! Verse added with matching vibe image & morphing color.");
      setSura("");
      setAyah("");
=======
        bg_image,
        timestamp: new Date()
      });

      setMessage("✅ Verse added successfully!");
      setSura(""); setAyat("");
      fetchVersesList(); 
>>>>>>> eed9d05a610eed88ace5ee1dcdf75e0b0ddbc57e

    } catch (error) {
      console.error(error);
      setMessage(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this verse?")) {
      try {
        await deleteDoc(doc(db, "verses", id));
        fetchVersesList(); 
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete.");
      }
    }
  };

<<<<<<< HEAD
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6 pt-20">
        <div className="max-w-sm w-full bg-gray-800 p-8 rounded-2xl shadow-xl text-center border border-gray-700">
          <h2 className="text-2xl font-bold mb-2 text-emerald-400">Admin Area</h2>
          <p className="text-gray-400 text-sm mb-8">Enter the secret key to manage verses.</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
=======
  const handleUpdateCategory = async (id) => {
    try {
      await updateDoc(doc(db, "verses", id), {
        category: editCategoryVal
      });
      setEditingId(null);
      fetchVersesList(); 
    } catch (error) {
      console.error("Error updating category: ", error);
      alert("Failed to update category.");
    }
  };

  const filteredVerses = filterCategory === "All" 
    ? versesList 
    : versesList.filter(v => v.category === filterCategory);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-20 text-gray-900 dark:text-white px-4">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* ================= ADD VERSE SECTION ================= */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center text-emerald-600">Add New Verse</h2>
          <div className="flex flex-col gap-4">
>>>>>>> eed9d05a610eed88ace5ee1dcdf75e0b0ddbc57e
            <input 
              type="number" 
              placeholder="Surah Number (e.g., 2)" 
              value={sura} onChange={(e) => setSura(e.target.value)}
              className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input 
              type="number" 
              placeholder="Ayat Number (e.g., 255)" 
              value={ayat} onChange={(e) => setAyat(e.target.value)}
              className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
            />
<<<<<<< HEAD
            <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold transition-all shadow-lg shadow-emerald-600/20">
              Unlock Access
=======
            <button 
              onClick={handleFetchAndSave} 
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center"
            >
              {loading ? "Processing..." : "Fetch & Save to Database"}
>>>>>>> eed9d05a610eed88ace5ee1dcdf75e0b0ddbc57e
            </button>
            {message && <p className="text-center font-medium mt-2 text-sm">{message}</p>}
          </div>
        </div>

<<<<<<< HEAD
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6 pt-24">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-emerald-400">Add New Verse</h2>
          <button onClick={() => setIsAuthenticated(false)} className="text-xs text-gray-400 hover:text-red-400 transition-colors">Lock</button>
        </div>
        <form onSubmit={handleFetchAndSave} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Surah Number (1-114)</label>
            <input type="number" value={sura} onChange={(e) => setSura(e.target.value)} required min="1" max="114" className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg outline-none focus:border-emerald-500 transition-all"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Ayah Number</label>
            <input type="number" value={ayah} onChange={(e) => setAyah(e.target.value)} required min="1" className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg outline-none focus:border-emerald-500 transition-all"/>
          </div>
          <button type="submit" disabled={loading} className="mt-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 rounded-lg font-bold transition-all shadow-lg">
            {loading ? "Analyzing Vibe & Saving..." : "Add Verse"}
          </button>
        </form>
        {message && <p className={`mt-6 text-center text-sm font-medium p-3 rounded-lg ${message.includes('Success') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{message}</p>}
=======
        {/* ================= MANAGE VERSES SECTION ================= */}
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Verses ({filteredVerses.length})</h2>
            
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  <th className="p-4 border-b dark:border-gray-600 rounded-tl-lg whitespace-nowrap">Surah:Ayah</th>
                  <th className="p-4 border-b dark:border-gray-600">Bangla Translation</th>
                  <th className="p-4 border-b dark:border-gray-600">Category</th>
                  <th className="p-4 border-b dark:border-gray-600 rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listLoading && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-emerald-600 font-bold animate-pulse">Loading verses from database...</td>
                  </tr>
                )}
                
                {listError && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-red-500 font-bold">Error loading list: {listError}</td>
                  </tr>
                )}

                {!listLoading && !listError && filteredVerses.map((verse) => (
                  <tr key={verse.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="p-4 font-bold whitespace-nowrap align-top">
                      {verse.suraName} <br/><span className="text-sm font-normal text-gray-500">({verse.sura}:{verse.ayat})</span>
                    </td>
                    
                    {/* বাংলা অনুবাদ সুন্দর করে পড়ার জন্য max-w-md এবং leading-relaxed দেওয়া হয়েছে */}
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300 max-w-md leading-relaxed align-top">
                      {verse.bangla}
                    </td>

                    <td className="p-4 align-top">
                      {editingId === verse.id ? (
                        <div className="flex items-center gap-2">
                          {/* ক্যাটাগরি এডিট এখন ড্রপডাউন */}
                          <select 
                            value={editCategoryVal} 
                            onChange={(e) => setEditCategoryVal(e.target.value)}
                            className="p-1 border rounded text-sm bg-white dark:bg-gray-900 dark:border-gray-600 outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            {CATEGORY_LIST.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <button onClick={() => handleUpdateCategory(verse.id)} className="text-green-600 hover:text-green-800"><Check size={18} /></button>
                          <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-700"><X size={18} /></button>
                        </div>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded whitespace-nowrap">
                          {verse.category}
                        </span>
                      )}
                    </td>

                    <td className="p-4 align-top">
                      <div className="flex gap-2">
                        {/* আইকনের সাইজ ফিক্স করার জন্য w-8 h-8 ব্যবহার করা হয়েছে */}
                        <button 
                          onClick={() => { setEditingId(verse.id); setEditCategoryVal(verse.category); }}
                          className="text-blue-500 hover:text-blue-700 w-8 h-8 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded shrink-0 transition"
                          title="Edit Category"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(verse.id)}
                          className="text-red-500 hover:text-red-700 w-8 h-8 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded shrink-0 transition"
                          title="Delete Verse"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!listLoading && !listError && filteredVerses.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">No verses found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
>>>>>>> eed9d05a610eed88ace5ee1dcdf75e0b0ddbc57e
      </div>
    </div>
  );
}
