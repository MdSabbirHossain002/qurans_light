import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [sura, setSura] = useState("");
  const [ayah, setAyah] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (passwordInput === correctPassword) { 
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Incorrect password! Try again.");
    }
  };

  const handleFetchAndSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const [arabicRes, banglaRes, englishRes, audioRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/ayah/${sura}:${ayah}/quran-indo-pak`),
        fetch(`https://api.alquran.cloud/v1/ayah/${sura}:${ayah}/bn.bengali`),
        fetch(`https://api.alquran.cloud/v1/ayah/${sura}:${ayah}/en.asad`),
        fetch(`https://api.alquran.cloud/v1/ayah/${sura}:${ayah}/ar.alafasy`)
      ]);
      
      if (!arabicRes.ok || !banglaRes.ok || !englishRes.ok) {
        throw new Error("Invalid Surah or Ayah number! Please check again.");
      }

      const arabicData = await arabicRes.json();
      const banglaData = await banglaRes.json();
      const englishData = await englishRes.json();
      const audioData = await audioRes.json();

      const arabic = arabicData.data.text;
      const bangla = banglaData.data.text;
      const english = englishData.data.text;
      const suraName = arabicData.data.surah.englishName;
      const audioUrl = audioData.data.audio;

      const prompt = `Analyze this Quranic verse translation: "${english}". 
      Return a valid JSON object with exactly two keys:
      1. "category": Choose EXACTLY ONE category from this strict list: [
        "Faith", "Prayer", "Mercy", "Warning", "Patience", "Guidance", "Hereafter", "Charity", "Prophets", "Forgiveness", 
        "Motivation", "Loneliness", "Peace", "Sadness", "Gratitude", "Hope", "Healing", "Hardship", "Love", "Justice", 
        "Wisdom", "Anxiety", "Joy", "Reflection", "Trust"
      ]. Do not use any word outside this list.
      2. "image_keyword": A 1-2 word aesthetic visual search term for Unsplash that captures the VIBE of the verse (e.g., "stormy ocean", "sunlight clouds", "desert night", "peaceful dawn", "stars", "fire", "hell", "haven", "mountain"). 
      Do not add any markdown formatting, only output the pure JSON.`;

      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      
      if (!geminiRes.ok) throw new Error("Gemini API Error! Failed to generate category.");

      const geminiData = await geminiRes.json();
      let aiText = geminiData.candidates[0].content.parts[0].text;
      aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiResponse = JSON.parse(aiText);

      const unsplashRes = await fetch(`https://api.unsplash.com/photos/random?query=${aiResponse.image_keyword}&orientation=landscape&client_id=${import.meta.env.VITE_UNSPLASH_ACCESS_KEY}`);
      if (!unsplashRes.ok) throw new Error("Unsplash API Error! Image not found.");

      const unsplashData = await unsplashRes.json();
      const bg_image = unsplashData.urls?.regular || "https://images.unsplash.com/photo-1572949645841-094f3a9c4c94";
      
      // ✅ নতুন ম্যাজিক: আনস্প্ল্যাশ থেকে সরাসরি ছবির মূল কালার কোড বের করে আনা
      const theme_color = unsplashData.color || "#10b981"; 

      const verseDoc = {
        sura: Number(sura),
        ayat: Number(ayah),
        suraName: suraName,
        arabic_indopak: arabic,
        bangla: bangla,
        english: english,
        audio: audioUrl,
        category: aiResponse.category,
        bg_image: bg_image,
        theme_color: theme_color, // ✅ ডেটাবেসে কালার কোড সেভ করা হচ্ছে
        createdAt: new Date()
      };

      await addDoc(collection(db, "verses"), verseDoc);
      setMessage("Success! Verse added with matching vibe image & morphing color.");
      setSura("");
      setAyah("");

    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error occurred! Check console.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6 pt-20">
        <div className="max-w-sm w-full bg-gray-800 p-8 rounded-2xl shadow-xl text-center border border-gray-700">
          <h2 className="text-2xl font-bold mb-2 text-emerald-400">Admin Area</h2>
          <p className="text-gray-400 text-sm mb-8">Enter the secret key to manage verses.</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              placeholder="Enter password..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center tracking-widest transition-all"
              required
            />
            <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold transition-all shadow-lg shadow-emerald-600/20">
              Unlock Access
            </button>
          </form>
          {loginError && <p className="mt-4 text-red-400 text-sm font-medium animate-pulse">{loginError}</p>}
        </div>
      </div>
    );
  }

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
      </div>
    </div>
  );
}