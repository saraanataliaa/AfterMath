import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';

export default function App() {
  const [step, setStep] = useState<'upload' | 'chat'>('upload');
  const [status, setStatus] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [persona, setPersona] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Prioritize voices that sound more mature, gentle, and nurturing
    const preferredVoice = voices.find(v => 
      v.name.toLowerCase().includes('serena') || 
      v.name.toLowerCase().includes('catherine') || 
      v.name.toLowerCase().includes('female') && v.name.toLowerCase().includes('en-gb')
    ) || voices.find(v => v.name.toLowerCase().includes('female')) || voices[0];
    
    utterance.voice = preferredVoice;
    utterance.rate = 0.8; // Slower, more gentle pace
    utterance.pitch = 0.85; // Lower, warmer, more mature pitch
    window.speechSynthesis.speak(utterance);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'text' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'image') {
      setAvatarUrl(URL.createObjectURL(file));
    } else if (type === 'text') {
      const text = await file.text();
      setPersona(text.substring(0, 3000));
    } else if (type === 'audio') {
      const url = URL.createObjectURL(file);
      if (audioRef.current) audioRef.current.src = url;
    }
  };

  const handleUpload = async () => {
    setStatus('Synthesizing personality and likeness...');
    await new Promise(resolve => setTimeout(resolve, 2500));
    setStatus('Aftermath is ready.');
    setTimeout(() => setStep('chat'), 1000);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setChatHistory(prev => [...prev, userMsg]);
    setInput('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '', vertexai: true });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { 
          role: 'user', 
          parts: [{ 
            text: `You are a digital twin. Description: ${description}. Adopt the tone, vocabulary, and conversational style found in these messages: "${persona}". Respond to the user's input naturally, with a warm, gentle, mature, and nurturing motherly tone. Do not use emojis.` 
          }] 
        }
      });
      const reply = response.text || '...';
      setChatHistory(prev => [...prev, { role: 'model', text: reply }]);
      speak(reply);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'model', text: 'Connection to Aftermath lost.' }]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-100 to-stone-200 p-6 flex flex-col text-stone-800">
      <audio ref={audioRef} className="hidden" />
      <header className="mb-10 text-center">
        <h1 className="text-6xl font-black tracking-tighter text-stone-900">AFTERMATH</h1>
        <p className="text-stone-600 uppercase tracking-widest text-sm mt-2 font-medium">Digital Consciousness Interface</p>
      </header>

      {step === 'upload' ? (
        <div className="max-w-xl mx-auto w-full bg-white/60 p-8 rounded-3xl border border-stone-200 backdrop-blur-md shadow-xl">
          <div className="space-y-6">
            <label className="block">
              <span className="text-sm font-bold text-stone-700">Brief Description of Persona</span>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-2 bg-white/50 p-3 rounded-xl border border-stone-300 text-stone-900"
                placeholder="e.g., 'I am witty, sarcastic, and love tech.'"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-stone-700">Portrait (Likeness)</span>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} className="block w-full mt-2 text-sm text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-stone-800 file:text-white hover:file:bg-stone-900 cursor-pointer" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-stone-700">Voice Reference (.mp3, .mp4)</span>
              <input type="file" accept="audio/*,video/mp4" onChange={(e) => handleFileChange(e, 'audio')} className="block w-full mt-2 text-sm text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-stone-800 file:text-white hover:file:bg-stone-900 cursor-pointer" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-stone-700">WhatsApp Chat History (.txt)</span>
              <input type="file" accept=".txt" onChange={(e) => handleFileChange(e, 'text')} className="block w-full mt-2 text-sm text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-stone-800 file:text-white hover:file:bg-stone-900 cursor-pointer" />
            </label>
          </div>
          <button onClick={handleUpload} className="w-full mt-8 py-4 bg-stone-900 text-white hover:bg-stone-800 rounded-2xl font-black uppercase tracking-wider transition shadow-lg">
            {status || 'Initialize Aftermath'}
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-12 gap-8 flex-1 max-w-5xl mx-auto w-full">
          <div className="md:col-span-4 flex flex-col items-center">
            <div className="relative w-full aspect-square rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-stone-300">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Digital Twin" className="w-full h-full object-cover object-center" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-500">No Portrait</div>
              )}
            </div>
          </div>
          
          <div className="md:col-span-8 bg-white/50 rounded-3xl border border-stone-200 flex flex-col shadow-xl backdrop-blur-md">
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 px-6 rounded-2xl max-w-md ${msg.role === 'user' ? 'bg-stone-800 text-white' : 'bg-white text-stone-800 shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-stone-200">
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="w-full bg-white p-4 rounded-2xl border border-stone-300 focus:outline-none focus:border-stone-500 transition"
                placeholder="Message your twin..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}