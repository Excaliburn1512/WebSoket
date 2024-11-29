const WebSocket = require('ws');
const mysql = require('mysql');

// Konfigurasi database MySQL (sesuaikan dengan detail database cloud atau database Anda)
const db = mysql.createConnection({
  host: 'localhost',  // Ganti dengan host database yang sesuai, misalnya URL dari layanan MySQL cloud
  user: 'root',       // Ganti dengan username database
  password: '',       // Ganti dengan password database
  database: 'nganjukkk' // Ganti dengan nama database Anda
});

db.connect(err => {
  if (err) throw err;
  console.log('Database terhubung!');
});

// WebSocket server berjalan pada port yang disediakan oleh environment
const wss = new WebSocket.Server({ port: process.env.PORT || 8081 });

wss.on('connection', ws => {
  console.log('Koneksi WebSocket baru');

  // Kirim pesan ke client saat terhubung
  ws.send(JSON.stringify({ message: 'Koneksi berhasil' }));

  // Tangani koneksi terputus
  ws.on('close', () => {
    console.log('Koneksi WebSocket ditutup');
  });
});

let lastNotificationId = 0; // ID notifikasi terakhir yang dikirim

function checkNewNotifications() {
  db.query('SELECT * FROM notifikasi WHERE id_notif > ? ORDER BY waktu DESC', [lastNotificationId], (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      const notification = result[0];
      console.log(`Received notification: ${notification.id_notif}`);
      lastNotificationId = notification.id_notif; // Update ID terakhir yang dikirim
      
      // Log untuk memverifikasi pembaruan ID
      console.log('Last Notification ID updated to: ' + lastNotificationId);

      // Kirim notifikasi sesuai jenisnya
      if (notification.judul.includes('Event Baru')) {
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              id: notification.id_notif,
              judul: notification.judul,
              isi: notification.isi,
              waktu: notification.waktu,
            }));
          }
        });
      }
    }
  });
}

// Periksa notifikasi baru setiap 2 detik
setInterval(checkNewNotifications, 2000);

console.log('Server WebSocket berjalan di ws://localhost:8081');
