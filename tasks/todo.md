# Yapılacaklar

- [x] Hatanın kök nedenini belirle ve ilgili ders kaydını güncelle
- [x] Global erişim için failing test ekle
- [x] Fonksiyonları güvenli biçimde `window` üstüne bağla
- [x] Script asset'lerine sürüm parametresi ekleyerek cache uyumsuzluğunu kapat
- [x] Test ve sözdizimi doğrulamalarını tekrar çalıştır

# İnceleme

- Semptom yalnızca yeni inline handler'da görüldüğü için HTML ile cache'deki eski JS sürümünün uyuşması riski kapatıldı.
- `browser-handlers.js` eklendi; inline handler fonksiyonları açıkça `window` nesnesine bağlandı.
- `index.html` içindeki script URL'lerine sürüm parametresi eklendi.
- Doğrulama: `node tests/browser-handlers.test.js`, `node tests/step1-state.test.js`, `node --check browser-handlers.js`, `node --check step1-state.js`, `node --check script.js`
