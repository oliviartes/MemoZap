// mapa.js
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.esm.js';
import { auth, db } from './firebaseConfig.js';
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

export let map;
let marker;

// Inicializa o mapa
export function initMap() {
  map = L.map('map').setView([-23.55052, -46.633308], 12); // São Paulo
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  marker = L.marker([-23.55052, -46.633308]).addTo(map);

  // Compartilhar localização em tempo real
  const shareBtn = document.getElementById("shareLiveLocation");
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      if(!navigator.geolocation) return alert("Seu navegador não suporta localização.");

      navigator.geolocation.watchPosition(async pos => {
        const { latitude, longitude } = pos.coords;
        const user = auth.currentUser;
        if(!user) return;

        await setDoc(doc(db, "live_locations", user.uid), {
          lat: latitude,
          lng: longitude,
          updatedAt: serverTimestamp(),
        });

        if(!marker) marker = L.marker([latitude, longitude]).addTo(map);
        else marker.setLatLng([latitude, longitude]);

        map.setView([latitude, longitude], 15);
      }, err => {
        alert("Erro ao obter localização: " + err.message);
      }, { enableHighAccuracy: true });
    });
  }
}

// Buscar endereço e centralizar no mapa
export async function goToAddress(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const res = await fetch(url);
    const data = await res.json();
    if(data.length > 0) {
      const { lat, lon } = data[0];
      const position = [parseFloat(lat), parseFloat(lon)];
      map.setView(position, 15);

      if(!marker) {
        marker = L.marker(position).addTo(map).bindPopup(address).openPopup();
      } else {
        marker.setLatLng(position).bindPopup(address).openPopup();
      }
    } else {
      alert("Endereço não encontrado.");
    }
  } catch(err) {
    console.error(err);
    alert("Erro ao buscar endereço.");
  }
}

// Inicializa o mapa automaticamente ao carregar o módulo
initMap();
