"use client";

import { useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type Counter = { type: string; code: string | null; raw_code: string | null };

function injectYandex(code: string) {
  const s = document.createElement("script");
  s.text = `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return}}k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${code},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`;
  document.head.appendChild(s);
  const nos = document.createElement("noscript");
  const img = document.createElement("img");
  img.src = `https://mc.yandex.ru/watch/${code}`;
  img.alt = "";
  img.style.position = "absolute";
  img.style.left = "-9999px";
  nos.appendChild(img);
  document.body.appendChild(nos);
}

function injectGoogle(code: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${code}`;
  document.head.appendChild(s);
  const s2 = document.createElement("script");
  s2.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${code}');`;
  document.head.appendChild(s2);
}

function injectCustom(raw: string) {
  if (/<script/i.test(raw)) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = raw;
    wrapper.querySelectorAll("script").forEach((old) => {
      const ns = document.createElement("script");
      Array.from(old.attributes).forEach((a) => ns.setAttribute(a.name, a.value));
      ns.text = old.textContent || "";
      document.head.appendChild(ns);
    });
  } else {
    const s = document.createElement("script");
    s.text = raw;
    document.head.appendChild(s);
  }
}

export default function AnalyticsCounters() {
  useEffect(() => {
    fetch(`${API}/api/counters`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        (d?.counters || []).forEach((c: Counter) => {
          try {
            if (c.type === "yandex" && c.code) injectYandex(c.code);
            else if (c.type === "google" && c.code) injectGoogle(c.code);
            else if (c.type === "custom" && c.raw_code) injectCustom(c.raw_code);
          } catch {}
        });
      })
      .catch(() => {});
  }, []);
  return null;
}
