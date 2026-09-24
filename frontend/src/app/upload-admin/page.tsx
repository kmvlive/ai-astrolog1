"use client";

import { useState } from "react";

export default function UploadAdmin() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [folder, setFolder] = useState("space");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setMessage(`✅ Загружено: ${data.url}`);
    } catch (err) {
      setMessage(`❌ Ошибка: ${err}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📁 Upload Admin</h1>
        
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
          <label className="block mb-2 text-sm font-semibold text-slate-400">
            Папка назначения
          </label>
          <input
            type="text"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg mb-4"
            placeholder="space"
          />

          <label className="block mb-2 text-sm font-semibold text-slate-400">
            Выберите файл
          </label>
          <input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-600 file:text-white file:font-semibold hover:file:bg-violet-500 file:cursor-pointer"
          />

          {uploading && <p className="mt-4 text-blue-400">⏳ Загрузка...</p>}
          {message && <p className="mt-4 text-sm">{message}</p>}
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-3">📋 Инструкция</h2>
          <ol className="list-decimal list-inside space-y-2 text-slate-300">
            <li>Выберите папку (для Земли: <code className="bg-slate-800 px-2 py-1 rounded">space</code>)</li>
            <li>Выберите файл (например, <code className="bg-slate-800 px-2 py-1 rounded">earth_day.jpg</code>)</li>
            <li>Дождитесь завершения загрузки</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
