import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Trash2, Edit2, Check, X } from "lucide-react";

export default function Admin() {
  // === Add Verse States ===
  const [sura, setSura] = useState("");
  const [ayat, setAyat] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // === Management Table States ===
  const [versesList, setVersesList] = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");
  const [categories, setCategories] = useState([]);
  
  // === Loading & Error States for List ===
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  
  // === Edit Category States ===
  const [editingId, setEditingId] = useState(null);
  const [editCategoryVal, setEditCategoryVal] = useState("");

  // ১. ফায়ারবেস থেকে সব আয়াত নিয়ে আসার ফাংশন
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

      // ইউনিক ক্যাটাগরি বের করা ফিল্টারের জন্য
      const uniqueCategories = ["All", ...new Set(versesArray.map(v => v.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching verses list:", error);
      setListError(error.message); // স্ক্রিনে এরর দেখানোর জন্য
    } finally {
      setListLoading(false);
    }
  };

  // কম্পোনেন্ট লোড হলে আয়াতগুলো দেখাবে
  useEffect(() => {
    fetchVersesList();
  }, []);

  // ২. নতুন আয়াত যুক্ত করার মেইন লজিক
  const handleFetchAndSave = async () => {
    if (!sura || !ayat) return setMessage("Please enter Sura and Ayat number");
    setLoading(true);
    setMessage("");

    try {
      // Al-Quran Cloud API Fetch
      const quranRes = await fetch(`https://api.alquran.cloud/v1/ayah/${sura}:${ayat}/editions/quran-indopak,en.asad,bn.bengali`);
      const quranData = await quranRes.json();
      if (quranData.code !== 200) throw new Error("Verse not found!");

      const arabic_indopak = quranData.data[0].text;
      const suraName = quranData.data[0].surah.englishName;
      const english = quranData.data[1].text;
      const bangla = quranData.data[2].text;

      // Audio API Fetch
      const audioRes = await fetch(`https://api.alquran.cloud/v1/ayah/${sura}:${ayat}/ar.alafasy`);
      const audioData = await audioRes.json();
      const audio = audioData.data.audio;

      // Gemini API Fetch (Category & Keyword)
      const prompt = `Analyze this Quranic verse translation: "${english}". 
      Return a valid JSON object with exactly two keys:
      1. "category": Choose EXACTLY ONE category from this strict list: ["Faith", "Prayer", "Mercy", "Warning", "Patience", "Guidance", "Hereafter", "Charity", "Prophets", "Forgiveness", "Motivation", "Loneliness", "Peace", "Sadness", "Gratitude", "Hope", "Healing", "Hardship", "Love", "Justice", "Wisdom", "Anxiety", "Joy", "Reflection", "Trust"].
      2. "image_keyword": A 1-2 word aesthetic visual search term for Unsplash that captures the VIBE of the verse.`;

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
      
      // Fixed Regex line break issue
      aiText = aiText.replace(/```json/gi, '').replace(/
```/g, '').trim();
      const aiResponse = JSON.parse(aiText);

      // Unsplash API Fetch
      const unsplashRes = await fetch(`https://api.unsplash.com/search/photos?query=${aiResponse.image_keyword}&orientation=landscape&client_id=${import.meta.env.VITE_UNSPLASH_ACCESS_KEY}`);
      const unsplashData = await unsplashRes.json();
      const bg_image = unsplashData.results.length > 0 ? unsplashData.results[0].urls.regular : "https://source.unsplash.com/random/1920x1080/?nature";

      // Firebase-এ সেভ করা
      await addDoc(collection(db, "verses"), {
        sura: Number(sura),
        suraName,
        ayat: Number(ayat),
        arabic_indopak,
        english,
        bangla,
        audio,
        category: aiResponse.category,
        bg_image,
        timestamp: new Date()
      });

      setMessage("✅ Verse added successfully!");
      setSura(""); setAyat("");
      fetchVersesList(); // নতুন আয়াত যোগ হলে লিস্ট আপডেট হবে

    } catch (error) {
      console.error(error);
      setMessage(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  // ৩. আয়াত ডিলিট করার ফাংশন
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this verse?")) {
      try {
        await deleteDoc(doc(db, "verses", id));
        fetchVersesList(); // ডিলিট করার পর লিস্ট রিফ্রেশ
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete.");
      }
    }
  };

  // ৪. ক্যাটাগরি আপডেট করার ফাংশন
  const handleUpdateCategory = async (id) => {
    try {
      await updateDoc(doc(db, "verses", id), {
        category: editCategoryVal
      });
      setEditingId(null);
      fetchVersesList(); // আপডেট করার পর লিস্ট রিফ্রেশ
    } catch (error) {
      console.error("Error updating category: ", error);
      alert("Failed to update category.");
    }
  };

  // ফিল্টার করা লিস্ট
  const filteredVerses = filterCategory === "All" 
    ? versesList 
    : versesList.filter(v => v.category === filterCategory);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-20 text-gray-900 dark:text-white px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        
        
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center text-emerald-600">Add New Verse</h2>
          <div className="flex flex-col gap-4">
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
            <button 
              onClick={handleFetchAndSave} 
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center"
            >
              {loading ? "Processing..." : "Fetch & Save to Database"}
            </button>
            {message && <p className="text-center font-medium mt-2 text-sm">{message}</p>}
          </div>
        </div>

        
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
                  <th className="p-4 border-b dark:border-gray-600 rounded-tl-lg">Surah:Ayah</th>
                  <th className="p-4 border-b dark:border-gray-600">English Translation</th>
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
                    <td colSpan="4" className="p-8 text-center text-red-500 font-bold">
                      Error loading list: {listError} <br/> 
                      <span className="text-sm font-normal text-gray-500 mt-2 block">If it says 'Missing or insufficient permissions', please check your Firebase Firestore rules.</span>
                    </td>
                  </tr>
                )}

                
                {!listLoading && !listError && filteredVerses.map((verse) => (
                  <tr key={verse.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="p-4 font-bold whitespace-nowrap">
                      {verse.suraName} ({verse.sura}:{verse.ayat})
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {verse.english}
                    </td>
                    <td className="p-4">
                      {editingId === verse.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={editCategoryVal} 
                            onChange={(e) => setEditCategoryVal(e.target.value)}
                            className="p-1 border rounded text-sm w-24 bg-white dark:bg-gray-900 dark:border-gray-600 outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button onClick={() => handleUpdateCategory(verse.id)} className="text-green-600 hover:text-green-800"><Check size="{18}"/></button>
                          <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-700"><X size="{18}"/></button>
                        </div>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded">
                          {verse.category}
                        </span>
                      )}
                    </td>
                    <td className="p-4 flex gap-3">
                      <button 
                        onClick={() => { setEditingId(verse.id); setEditCategoryVal(verse.category); }}
                        className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 dark:bg-blue-900/20 rounded"
                        title="Edit Category"
                      >
                        <Edit2 size="{18}"/>
                      </button>
                      <button 
                        onClick={() => handleDelete(verse.id)}
                        className="text-red-500 hover:text-red-700 p-1 bg-red-50 dark:bg-red-900/20 rounded"
                        title="Delete Verse"
                      >
                        <Trash2 size="{18}"/>
                      </button>
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
        
      </div>
    </div>
  );
}
