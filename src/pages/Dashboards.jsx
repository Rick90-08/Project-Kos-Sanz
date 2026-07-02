import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// =====================================================================
// --- UTILITAS: KOMPRES GAMBAR KE BASE64 (max 800px, kualitas 0.7) ---
// =====================================================================
const kompresGambar = (file, maxSize = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Format angka jadi format Rupiah: 800000 -> "800.000"
const formatRupiah = (angka) => {
  if (!angka) return '0';
  return Number(angka).toLocaleString('id-ID');
};

// =====================================================================
// --- KOMPONEN CUSTOM MODAL / POP-OUT ---
// =====================================================================
const CustomModal = ({ show, title, message, isConfirm, onConfirm, onClose }) => {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#1e1e1e', padding: '25px', borderRadius: '12px', width: '400px', maxWidth: '90%', border: '1px solid #333', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
        <h3 style={{ margin: '0 0 15px 0', color: isConfirm ? '#f59e0b' : '#3b82f6', fontSize: '22px' }}>{title}</h3>
        <p style={{ color: '#ccc', lineHeight: '1.5', marginBottom: '25px' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          {isConfirm && <button onClick={onClose} style={{ padding: '10px 20px', background: '#444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Batal</button>}
          <button onClick={() => { onConfirm(); onClose(); }} style={{ padding: '10px 20px', background: isConfirm ? '#ef4444' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isConfirm ? 'Ya, Lanjutkan' : 'OK Mengerti'}
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// --- KOMPONEN LOGOUT ---
// =====================================================================
const LogoutButton = () => {
  const navigate = useNavigate();
  return <button onClick={() => { localStorage.removeItem('user'); navigate('/login'); }} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Keluar / Logout</button>;
};

// =====================================================================
// --- SEED DATA KOS DEMO (dijalankan sekali jika belum ada) ---
// =====================================================================
const seedDemoKos = async () => {
  try {
    const q = query(collection(db, "kamar"), where("is_demo", "==", true));
    const snap = await getDocs(q);
    if (!snap.empty) return; // Data demo sudah ada, jangan tambah lagi

    const dataDemo = [
      {
        nomor_kamar: '101', tipe_kamar: 'Standar', harga_sewa: '800000',
        fasilitas: 'Kasur, Lemari, WiFi, Kipas Angin',
        nama_kos: 'Kos-Sanz Menteng', alamat_lengkap: 'Jl. Kebon Sirih No. 45, Menteng, Jakarta Pusat 10340',
        link_maps: 'https://maps.google.com/?q=Jl+Kebon+Sirih+No+45+Menteng+Jakarta+Pusat',
        foto_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400',
        status_kamar: 'Tersedia', id_user: 'demo', is_demo: true
      },
      {
        nomor_kamar: '102', tipe_kamar: 'Eksklusif', harga_sewa: '1500000',
        fasilitas: 'AC, Kamar Mandi Dalam, Spring Bed, Meja Belajar, WiFi',
        nama_kos: 'Kos-Sanz Menteng', alamat_lengkap: 'Jl. Kebon Sirih No. 45, Menteng, Jakarta Pusat 10340',
        link_maps: 'https://maps.google.com/?q=Jl+Kebon+Sirih+No+45+Menteng+Jakarta+Pusat',
        foto_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
        status_kamar: 'Tersedia', id_user: 'demo', is_demo: true
      },
      {
        nomor_kamar: '201', tipe_kamar: 'Eksklusif Premium', harga_sewa: '2200000',
        fasilitas: 'AC, Kamar Mandi Dalam, Smart TV, Kulkas Mini, Spring Bed, Balkon, WiFi 50Mbps',
        nama_kos: 'Kos-Sanz Menteng', alamat_lengkap: 'Jl. Kebon Sirih No. 45, Menteng, Jakarta Pusat 10340',
        link_maps: 'https://maps.google.com/?q=Jl+Kebon+Sirih+No+45+Menteng+Jakarta+Pusat',
        foto_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
        status_kamar: 'Tersedia', id_user: 'demo', is_demo: true
      }
    ];
    for (const kamar of dataDemo) {
      await addDoc(collection(db, "kamar"), kamar);
    }
    console.log('Data kos demo berhasil ditambahkan.');
  } catch (error) {
    console.error('Gagal seed demo kos:', error);
  }
};

// Komponen kecil untuk menampilkan foto kamar atau placeholder
const FotoKamar = ({ src, tinggi = '160px' }) => {
  if (!src) {
    return (
      <div style={{ width: '100%', height: tinggi, background: '#2d2d2d', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777', fontSize: '14px', border: '1px dashed #444' }}>
        Foto tidak tersedia
      </div>
    );
  }
  return <img src={src} alt="Foto Kamar" style={{ width: '100%', height: tinggi, objectFit: 'cover', borderRadius: '8px' }} />;
};

// =====================================================================
// --- DASHBOARD ADMIN (VERIFIKASI PEMBAYARAN) ---
// =====================================================================
export const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [transaksis, setTransaksis] = useState([]);
  const [modal, setModal] = useState({ show: false, title: '', message: '', isConfirm: false, onConfirm: null });
  const [buktiModal, setBuktiModal] = useState({ show: false, gambar: '', nama: '' });

  const showAlert = (title, message) => setModal({ show: true, title, message, isConfirm: false, onConfirm: () => {} });
  const showConfirm = (title, message, action) => setModal({ show: true, title, message, isConfirm: true, onConfirm: action });

  const fetchTransaksi = async () => {
    const snap = await getDocs(collection(db, "transaksi"));
    setTransaksis(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchTransaksi(); }, []);

  const handleVerifikasi = (id) => {
    showConfirm('Verifikasi Pembayaran', 'Tandai pembayaran ini sebagai LUNAS?', async () => {
      await updateDoc(doc(db, "transaksi", id), { status_pembayaran: 'Lunas', tanggal_verifikasi: new Date().toISOString() });
      showAlert('Berhasil', 'Pembayaran telah diverifikasi sebagai Lunas.');
      fetchTransaksi();
    });
  };

  const handleTolak = (id) => {
    showConfirm('Tolak Pembayaran', 'Tolak pembayaran ini? Status kembali ke "Belum Dibayar" dan bukti dihapus.', async () => {
      await updateDoc(doc(db, "transaksi", id), { status_pembayaran: 'Belum Dibayar', bukti_pembayaran: '', nama_pengirim: '' });
      showAlert('Ditolak', 'Pembayaran ditolak. Penghuni harus mengulang pembayaran.');
      fetchTransaksi();
    });
  };

  // Hitung statistik
  const totalTransaksi = transaksis.length;
  const totalLunas = transaksis.filter(t => t.status_pembayaran === 'Lunas').length;
  const totalMenunggu = transaksis.filter(t => t.status_pembayaran === 'Menunggu Verifikasi').length;
  const totalBelum = transaksis.filter(t => t.status_pembayaran === 'Belum Dibayar').length;

  const cardStyle = { background: '#1e1e1e', padding: '20px', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' };
  const badgeStatus = (status) => {
    const map = { 'Lunas': '#10b981', 'Menunggu Verifikasi': '#f59e0b', 'Belum Dibayar': '#ef4444' };
    return <span style={{ padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', background: map[status] || '#777', color: '#fff' }}>{status}</span>;
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <CustomModal {...modal} onClose={() => setModal({ ...modal, show: false })} />

      {/* Modal Lihat Bukti Pembayaran */}
      {buktiModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setBuktiModal({ show: false, gambar: '', nama: '' })}>
          <div style={{ background: '#1e1e1e', padding: '25px', borderRadius: '12px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto', border: '1px solid #333', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: '#3b82f6' }}>Bukti Pembayaran</h3>
            <p style={{ color: '#ccc' }}>Pengirim: <strong style={{ color: '#fff' }}>{buktiModal.nama || '-'}</strong></p>
            {buktiModal.gambar
              ? <img src={buktiModal.gambar} alt="Bukti" style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px', border: '1px solid #444' }} />
              : <p style={{ color: '#777' }}>Tidak ada gambar bukti.</p>}
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => setBuktiModal({ show: false, gambar: '', nama: '' })} style={{ padding: '10px 20px', background: '#444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#3b82f6', margin: 0 }}>Dashboard Admin — Kos-Sanz</h1>
        <LogoutButton />
      </div>
      <p style={{ color: '#ccc', marginTop: '-15px', marginBottom: '30px' }}>Selamat datang, {user?.nama}! Verifikasi pembayaran masuk di bawah ini.</p>

      {/* KARTU STATISTIK */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ ...cardStyle, flex: 1, textAlign: 'center', borderTop: '4px solid #3b82f6', minWidth: '160px' }}><h3 style={{ color: '#aaa', margin: 0, fontSize: '14px' }}>Total Transaksi</h3><h1 style={{ margin: '10px 0 0 0', fontSize: '32px' }}>{totalTransaksi}</h1></div>
        <div style={{ ...cardStyle, flex: 1, textAlign: 'center', borderTop: '4px solid #10b981', minWidth: '160px' }}><h3 style={{ color: '#aaa', margin: 0, fontSize: '14px' }}>Lunas</h3><h1 style={{ margin: '10px 0 0 0', fontSize: '32px', color: '#10b981' }}>{totalLunas}</h1></div>
        <div style={{ ...cardStyle, flex: 1, textAlign: 'center', borderTop: '4px solid #f59e0b', minWidth: '160px' }}><h3 style={{ color: '#aaa', margin: 0, fontSize: '14px' }}>Menunggu Verifikasi</h3><h1 style={{ margin: '10px 0 0 0', fontSize: '32px', color: '#f59e0b' }}>{totalMenunggu}</h1></div>
        <div style={{ ...cardStyle, flex: 1, textAlign: 'center', borderTop: '4px solid #ef4444', minWidth: '160px' }}><h3 style={{ color: '#aaa', margin: 0, fontSize: '14px' }}>Belum Dibayar</h3><h1 style={{ margin: '10px 0 0 0', fontSize: '32px', color: '#ef4444' }}>{totalBelum}</h1></div>
      </div>

      {/* TABEL SEMUA TRANSAKSI */}
      <div style={{ ...cardStyle, overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Semua Transaksi Pembayaran</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead><tr style={{ borderBottom: '1px solid #444' }}><th style={{ padding: '12px' }}>Tanggal</th><th style={{ padding: '12px' }}>Penghuni</th><th style={{ padding: '12px' }}>Kamar</th><th style={{ padding: '12px' }}>Nominal</th><th style={{ padding: '12px' }}>Status</th><th style={{ padding: '12px' }}>Aksi</th></tr></thead>
          <tbody>
            {transaksis.map((trx) => (
              <tr key={trx.id} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '12px' }}>{new Date(trx.tanggal_booking).toLocaleDateString('id-ID')}</td>
                <td style={{ padding: '12px' }}>{trx.nama_penghuni}</td>
                <td style={{ padding: '12px' }}>{trx.nomor_kamar}</td>
                <td style={{ padding: '12px', color: '#10b981' }}>Rp {formatRupiah(trx.harga_sewa)}</td>
                <td style={{ padding: '12px' }}>{badgeStatus(trx.status_pembayaran)}</td>
                <td style={{ padding: '12px' }}>
                  {trx.status_pembayaran === 'Menunggu Verifikasi' ? (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button onClick={() => setBuktiModal({ show: true, gambar: trx.bukti_pembayaran, nama: trx.nama_pengirim })} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>👁 Lihat Bukti</button>
                      <button onClick={() => handleVerifikasi(trx.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✅ Verifikasi</button>
                      <button onClick={() => handleTolak(trx.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>❌ Tolak</button>
                    </div>
                  ) : (
                    <span style={{ color: '#777', fontSize: '13px' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
            {transaksis.length === 0 && <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>Belum ada transaksi.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =====================================================================
// --- DASHBOARD PEMILIK KOS ---
// =====================================================================
export const PemilikDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [kamars, setKamars] = useState([]);
  const [transaksis, setTransaksis] = useState([]);
  const [komplains, setKomplains] = useState([]);
  const [dashboard, setDashboard] = useState({ totalKamar: 0, tersedia: 0, terisi: 0 });
  const [form, setForm] = useState({ nomor_kamar: '', tipe_kamar: 'Standar', harga_sewa: '', fasilitas: '', status_kamar: 'Tersedia', nama_kos: '', alamat_lengkap: '', link_maps: '', foto_url: '' });
  const [uploading, setUploading] = useState(false);

  const [modal, setModal] = useState({ show: false, title: '', message: '', isConfirm: false, onConfirm: null });
  const showAlert = (title, message) => setModal({ show: true, title, message, isConfirm: false, onConfirm: () => {} });
  const showConfirm = (title, message, action) => setModal({ show: true, title, message, isConfirm: true, onConfirm: action });

  const fetchKamar = async () => {
    const q = query(collection(db, "kamar"), where("id_user", "==", user.uid));
    const querySnapshot = await getDocs(q);
    const dataKamar = []; let tersedia = 0, terisi = 0;
    querySnapshot.forEach((d) => {
      const data = d.data(); dataKamar.push({ id: d.id, ...data });
      if (data.status_kamar === 'Tersedia') tersedia++; if (data.status_kamar === 'Terisi') terisi++;
    });
    setKamars(dataKamar); setDashboard({ totalKamar: dataKamar.length, tersedia, terisi });
  };

  const fetchTransaksi = async () => {
    const q = query(collection(db, "transaksi"), where("id_pemilik", "==", user.uid));
    const querySnapshot = await getDocs(q);
    setTransaksis(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchKomplain = async () => {
    const q = query(collection(db, "komplain"), where("id_pemilik", "==", user.uid));
    const querySnapshot = await getDocs(q);
    setKomplains(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { if (user?.uid) { fetchKamar(); fetchTransaksi(); fetchKomplain(); } }, []);

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Upload + kompres gambar dari laptop
  const handleUploadFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showAlert('Error', 'File harus berupa gambar.'); return; }
    setUploading(true);
    try {
      const base64 = await kompresGambar(file);
      setForm((prev) => ({ ...prev, foto_url: base64 }));
    } catch {
      showAlert('Error', 'Gagal memproses gambar.');
    } finally {
      setUploading(false);
    }
  };

  const handleTambahKamar = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "kamar"), { ...form, id_user: user.uid });
      showAlert('Berhasil', 'Kamar berhasil ditambahkan!');
      setForm({ nomor_kamar: '', tipe_kamar: 'Standar', harga_sewa: '', fasilitas: '', status_kamar: 'Tersedia', nama_kos: '', alamat_lengkap: '', link_maps: '', foto_url: '' });
      fetchKamar();
    } catch (error) { showAlert('Error', 'Gagal menambahkan kamar.'); }
  };

  const handleUpdateStatus = async (id_kamar, status_baru) => {
    await updateDoc(doc(db, "kamar", id_kamar), { status_kamar: status_baru }); fetchKamar();
  };

  const handleDelete = (id_kamar) => {
    showConfirm('Hapus Kamar', 'Tindakan ini tidak bisa dibatalkan. Yakin ingin menghapus kamar ini?', async () => {
      await deleteDoc(doc(db, "kamar", id_kamar));
      fetchKamar();
    });
  };

  const handleUpdateStatusKomplain = async (id_komplain, status_baru) => {
    await updateDoc(doc(db, "komplain", id_komplain), { status: status_baru }); fetchKomplain();
  };

  const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#2d2d2d', color: '#fff', width: '100%' };
  const cardStyle = { background: '#1e1e1e', padding: '20px', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <CustomModal {...modal} onClose={() => setModal({ ...modal, show: false })} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#3b82f6', margin: 0 }}>Dashboard Mitra: {user?.nama}</h1>
        <LogoutButton />
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ ...cardStyle, flex: 1, textAlign: 'center', borderTop: '4px solid #3b82f6' }}><h3 style={{ color: '#aaa', margin: 0 }}>Total Kamar</h3><h1 style={{ margin: '10px 0 0 0', fontSize: '36px' }}>{dashboard.totalKamar}</h1></div>
        <div style={{ ...cardStyle, flex: 1, textAlign: 'center', borderTop: '4px solid #10b981' }}><h3 style={{ color: '#aaa', margin: 0 }}>Kamar Tersedia</h3><h1 style={{ margin: '10px 0 0 0', fontSize: '36px', color: '#10b981' }}>{dashboard.tersedia}</h1></div>
        <div style={{ ...cardStyle, flex: 1, textAlign: 'center', borderTop: '4px solid #ef4444' }}><h3 style={{ color: '#aaa', margin: 0 }}>Kamar Terisi</h3><h1 style={{ margin: '10px 0 0 0', fontSize: '36px', color: '#ef4444' }}>{dashboard.terisi}</h1></div>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        <div style={{ ...cardStyle, flex: '1 1 320px' }}>
          <h3 style={{ marginTop: 0 }}>Tambah Kamar Baru</h3>
          <form onSubmit={handleTambahKamar} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" name="nomor_kamar" placeholder="Nomor Kamar (ex: A01)" value={form.nomor_kamar} onChange={handleInputChange} required style={inputStyle} />
            <select name="tipe_kamar" value={form.tipe_kamar} onChange={handleInputChange} style={inputStyle}>
              <option value="Standar">Standar (Non-AC)</option>
              <option value="Eksklusif">Eksklusif (AC + Kamar Mandi)</option>
              <option value="Eksklusif Premium">Eksklusif Premium</option>
            </select>
            <input type="number" name="harga_sewa" placeholder="Harga Sewa/Bulan" value={form.harga_sewa} onChange={handleInputChange} required style={inputStyle} />
            <textarea name="fasilitas" placeholder="Fasilitas (Kasur, Lemari, dll)" value={form.fasilitas} onChange={handleInputChange} required style={{ ...inputStyle, height: '70px' }} />

            {/* --- FIELD LOKASI (UPDATE 3) --- */}
            <input type="text" name="nama_kos" placeholder="Nama Kos (ex: Kos Melati)" value={form.nama_kos} onChange={handleInputChange} style={inputStyle} />
            <textarea name="alamat_lengkap" placeholder="Alamat Lengkap" value={form.alamat_lengkap} onChange={handleInputChange} style={{ ...inputStyle, height: '60px' }} />
            <input type="text" name="link_maps" placeholder="Link Google Maps (https://maps.google.com/...)" value={form.link_maps} onChange={handleInputChange} style={inputStyle} />

            {/* --- FOTO KAMAR (UPDATE 2) --- */}
            <div style={{ borderTop: '1px solid #333', paddingTop: '12px' }}>
              <label style={{ fontSize: '13px', color: '#aaa', display: 'block', marginBottom: '6px' }}>Foto Kamar — Opsi A: Tempel Link URL</label>
              <input type="text" name="foto_url" placeholder="https://contoh.com/foto.jpg" value={form.foto_url.startsWith('data:') ? '' : form.foto_url} onChange={handleInputChange} style={inputStyle} />
              <label style={{ fontSize: '13px', color: '#aaa', display: 'block', margin: '12px 0 6px' }}>Opsi B: Upload dari Laptop</label>
              <input type="file" accept="image/*" onChange={handleUploadFoto} style={{ ...inputStyle, padding: '8px' }} />
              {uploading && <p style={{ color: '#f59e0b', fontSize: '13px', margin: '8px 0 0' }}>Memproses gambar...</p>}
              {form.foto_url && <div style={{ marginTop: '12px' }}><FotoKamar src={form.foto_url} tinggi="120px" /></div>}
            </div>

            <button type="submit" style={{ padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Simpan Kamar</button>
          </form>
        </div>

        <div style={{ ...cardStyle, flex: '2 1 600px', overflowX: 'auto' }}>
          <h3 style={{ marginTop: 0 }}>Daftar Kamar Anda</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead><tr style={{ borderBottom: '1px solid #444' }}><th style={{ padding: '12px' }}>Kamar</th><th style={{ padding: '12px' }}>Tipe</th><th style={{ padding: '12px' }}>Harga/Bln</th><th style={{ padding: '12px' }}>Status</th><th style={{ padding: '12px' }}>Aksi</th></tr></thead>
            <tbody>
              {kamars.map((kamar) => (
                <tr key={kamar.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {kamar.foto_url
                        ? <img src={kamar.foto_url} alt="kamar" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                        : <div style={{ width: '60px', height: '60px', background: '#2d2d2d', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#777', textAlign: 'center' }}>No Foto</div>}
                      <div><strong>{kamar.nomor_kamar}</strong><br /><small style={{ color: '#aaa' }}>{kamar.fasilitas}</small></div>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>{kamar.tipe_kamar}</td>
                  <td style={{ padding: '12px', color: '#10b981' }}>Rp {formatRupiah(kamar.harga_sewa)}</td>
                  <td style={{ padding: '12px' }}>
                    <select value={kamar.status_kamar} onChange={(e) => handleUpdateStatus(kamar.id, e.target.value)} style={{ padding: '6px', borderRadius: '4px', background: '#2d2d2d', color: '#fff', border: '1px solid #555' }}>
                      <option value="Tersedia">Tersedia</option><option value="Terisi">Terisi</option><option value="Maintenance">Maintenance</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px' }}><button onClick={() => handleDelete(kamar.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Hapus</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: '30px', overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Riwayat Transaksi & Pembayaran</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead><tr style={{ borderBottom: '1px solid #444' }}><th style={{ padding: '12px' }}>Tanggal</th><th style={{ padding: '12px' }}>Penghuni</th><th style={{ padding: '12px' }}>Kamar</th><th style={{ padding: '12px' }}>Nominal</th><th style={{ padding: '12px' }}>Status</th></tr></thead>
          <tbody>
            {transaksis.map((trx) => (
              <tr key={trx.id} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '12px' }}>{new Date(trx.tanggal_booking).toLocaleDateString('id-ID')}</td><td style={{ padding: '12px' }}>{trx.nama_penghuni}</td><td style={{ padding: '12px' }}>{trx.nomor_kamar}</td><td style={{ padding: '12px', color: '#10b981' }}>Rp {formatRupiah(trx.harga_sewa)}</td>
                <td style={{ padding: '12px', color: trx.status_pembayaran === 'Lunas' ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>{trx.status_pembayaran}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...cardStyle, marginTop: '30px', borderTop: '4px solid #f59e0b', overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0, color: '#f59e0b' }}>Komplain dari Penghuni</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead><tr style={{ borderBottom: '1px solid #444' }}><th style={{ padding: '12px' }}>Tanggal</th><th style={{ padding: '12px' }}>Penghuni</th><th style={{ padding: '12px' }}>Kamar</th><th style={{ padding: '12px' }}>Keluhan</th><th style={{ padding: '12px' }}>Status Penanganan</th></tr></thead>
          <tbody>
            {komplains.map((k) => (
              <tr key={k.id} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '12px' }}>{new Date(k.tanggal_dibuat).toLocaleDateString('id-ID')}</td><td style={{ padding: '12px' }}>{k.nama_penghuni}</td><td style={{ padding: '12px' }}>{k.nomor_kamar}</td>
                <td style={{ padding: '12px' }}><strong style={{ color: '#f59e0b' }}>{k.kategori}</strong><br />{k.deskripsi}</td>
                <td style={{ padding: '12px' }}>
                  <select value={k.status} onChange={(e) => handleUpdateStatusKomplain(k.id, e.target.value)} style={{ padding: '6px', borderRadius: '4px', background: '#2d2d2d', color: '#fff', border: '1px solid #555' }}>
                    <option value="Menunggu">Menunggu</option><option value="Diproses">Diproses</option><option value="Selesai">Selesai</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =====================================================================
// --- DASHBOARD PENGHUNI ---
// =====================================================================
export const PenghuniDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [kamarTersedia, setKamarTersedia] = useState([]);
  const [tagihans, setTagihans] = useState([]);
  const [komplains, setKomplains] = useState([]);
  const [formKomplain, setFormKomplain] = useState({ id_transaksi_terpilih: '', kategori: 'Fasilitas Rusak', deskripsi: '' });
  const [copiedId, setCopiedId] = useState(null);

  // State modal pembayaran
  const [bayarModal, setBayarModal] = useState({ show: false, trx: null });
  const [bayarForm, setBayarForm] = useState({ nama_pengirim: '', bukti: '' });
  const [prosesBayar, setProsesBayar] = useState(false);

  const [modal, setModal] = useState({ show: false, title: '', message: '', isConfirm: false, onConfirm: null });
  const showAlert = (title, message) => setModal({ show: true, title, message, isConfirm: false, onConfirm: () => {} });
  const showConfirm = (title, message, action) => setModal({ show: true, title, message, isConfirm: true, onConfirm: action });

  const fetchData = async () => {
    const qKamar = query(collection(db, "kamar"), where("status_kamar", "==", "Tersedia"));
    const snapKamar = await getDocs(qKamar);
    setKamarTersedia(snapKamar.docs.map(d => ({ id: d.id, ...d.data() })));

    const qTagihan = query(collection(db, "transaksi"), where("id_penghuni", "==", user.uid));
    const snapTagihan = await getDocs(qTagihan);
    setTagihans(snapTagihan.docs.map(d => ({ id: d.id, ...d.data() })));

    const qKomplain = query(collection(db, "komplain"), where("id_penghuni", "==", user.uid));
    const snapKomplain = await getDocs(qKomplain);
    setKomplains(snapKomplain.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // Seed data demo + ambil data saat halaman dibuka
  useEffect(() => {
    const init = async () => {
      await seedDemoKos();
      if (user?.uid) await fetchData();
    };
    init();
  }, []);

  const handleBooking = (kamar) => {
    showConfirm('Konfirmasi Booking', `Yakin ingin booking Kamar ${kamar.nomor_kamar} seharga Rp ${formatRupiah(kamar.harga_sewa)} / bulan?`, async () => {
      await addDoc(collection(db, "transaksi"), {
        id_kamar: kamar.id, nomor_kamar: kamar.nomor_kamar, id_pemilik: kamar.id_user,
        id_penghuni: user.uid, nama_penghuni: user.nama, harga_sewa: kamar.harga_sewa,
        nama_kos: kamar.nama_kos || '', tanggal_booking: new Date().toISOString(), status_pembayaran: 'Belum Dibayar'
      });
      await updateDoc(doc(db, "kamar", kamar.id), { status_kamar: 'Terisi' });
      showAlert("Sukses", "Booking Berhasil! Silakan cek menu Tagihan Anda untuk membayar.");
      fetchData();
    });
  };

  // Buka modal pembayaran QR
  const bukaModalBayar = (trx) => {
    setBayarForm({ nama_pengirim: '', bukti: '' });
    setBayarModal({ show: true, trx });
  };

  // Upload bukti pembayaran (kompres dulu)
  const handleUploadBukti = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showAlert('Error', 'File harus berupa gambar.'); return; }
    try {
      const base64 = await kompresGambar(file, 800, 0.7);
      setBayarForm((prev) => ({ ...prev, bukti: base64 }));
    } catch {
      showAlert('Error', 'Gagal memproses gambar bukti.');
    }
  };

  // Konfirmasi pembayaran -> simpan ke Firestore
  const handleKonfirmasiBayar = async () => {
    if (!bayarForm.nama_pengirim.trim()) { showAlert('Peringatan', 'Nama pengirim wajib diisi.'); return; }
    if (!bayarForm.bukti) { showAlert('Peringatan', 'Bukti pembayaran wajib di-upload.'); return; }
    setProsesBayar(true);
    try {
      await updateDoc(doc(db, "transaksi", bayarModal.trx.id), {
        status_pembayaran: 'Menunggu Verifikasi',
        nama_pengirim: bayarForm.nama_pengirim.trim(),
        bukti_pembayaran: bayarForm.bukti,
        tanggal_bayar: new Date().toISOString()
      });
      setBayarModal({ show: false, trx: null });
      showAlert('Terkirim', 'Pembayaran terkirim! Menunggu verifikasi admin.');
      fetchData();
    } catch {
      showAlert('Error', 'Gagal mengirim pembayaran.');
    } finally {
      setProsesBayar(false);
    }
  };

  const handleCopyMaps = (link, id) => {
    if (!link) { showAlert('Info', 'Kamar ini belum punya link Maps.'); return; }
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleSubmitKomplain = async (e) => {
    e.preventDefault();
    if (!formKomplain.id_transaksi_terpilih) return showAlert("Peringatan", "Pilih kamar terlebih dahulu!");
    const trx = tagihans.find(t => t.id === formKomplain.id_transaksi_terpilih);
    await addDoc(collection(db, "komplain"), {
      id_penghuni: user.uid, nama_penghuni: user.nama, id_pemilik: trx.id_pemilik, nomor_kamar: trx.nomor_kamar,
      kategori: formKomplain.kategori, deskripsi: formKomplain.deskripsi, status: 'Menunggu', tanggal_dibuat: new Date().toISOString()
    });
    showAlert("Terkirim", "Komplain berhasil dikirim ke pemilik kos!");
    setFormKomplain({ ...formKomplain, deskripsi: '' });
    fetchData();
  };

  const cardStyle = { background: '#1e1e1e', padding: '20px', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' };

  const badgeBayar = (status) => {
    const map = { 'Lunas': '#10b981', 'Menunggu Verifikasi': '#f59e0b', 'Belum Dibayar': '#ef4444' };
    return <span style={{ padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', background: map[status] || '#777', color: '#fff' }}>{status}</span>;
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <CustomModal {...modal} onClose={() => setModal({ ...modal, show: false })} />

      {/* MODAL PEMBAYARAN QR (UPDATE 4) */}
      {bayarModal.show && bayarModal.trx && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#1e1e1e', padding: '25px', borderRadius: '12px', width: '420px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #333', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease' }}>
            <h3 style={{ marginTop: 0, color: '#3b82f6', textAlign: 'center' }}>Instruksi Pembayaran</h3>
            <p style={{ textAlign: 'center', color: '#ccc', margin: '0 0 4px' }}>Total Tagihan Kamar {bayarModal.trx.nomor_kamar}</p>
            <p style={{ textAlign: 'center', fontSize: '30px', fontWeight: 'bold', color: '#10b981', margin: '0 0 16px' }}>Rp {formatRupiah(bayarModal.trx.harga_sewa)}</p>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=KOSSANZ-${bayarModal.trx.nomor_kamar}-${bayarModal.trx.harga_sewa}`} alt="QR Pembayaran" style={{ borderRadius: '8px', background: '#fff', padding: '8px' }} />
            </div>
            <p style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', marginBottom: '20px' }}>Scan QR menggunakan GoPay / OVO / Dana. Setelah transfer, isi nama pengirim dan upload bukti di bawah.</p>

            <input type="text" placeholder="Nama Pengirim / Rekening" value={bayarForm.nama_pengirim} onChange={(e) => setBayarForm({ ...bayarForm, nama_pengirim: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#2d2d2d', color: '#fff', width: '100%', marginBottom: '12px' }} />

            <label style={{ fontSize: '13px', color: '#aaa', display: 'block', marginBottom: '6px' }}>Upload Bukti Pembayaran</label>
            <input type="file" accept="image/*" onChange={handleUploadBukti} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #444', background: '#2d2d2d', color: '#fff', width: '100%' }} />
            {bayarForm.bukti && <img src={bayarForm.bukti} alt="Preview Bukti" style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', marginTop: '12px', borderRadius: '8px', border: '1px solid #444' }} />}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setBayarModal({ show: false, trx: null })} style={{ flex: 1, padding: '12px', background: '#444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Batal</button>
              <button onClick={handleKonfirmasiBayar} disabled={prosesBayar} style={{ flex: 2, padding: '12px', background: prosesBayar ? '#1e4fa3' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: prosesBayar ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>{prosesBayar ? 'Mengirim...' : 'Konfirmasi Pembayaran'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#10b981', margin: 0 }}>Dashboard Penghuni</h1>
        <LogoutButton />
      </div>
      <p style={{ fontSize: '18px', color: '#ccc' }}>Halo, <strong style={{ color: '#fff' }}>{user?.nama}</strong>! Selamat datang di Kos-Sanz.</p>

      {/* TAGIHAN SAYA */}
      <div style={{ ...cardStyle, marginBottom: '30px', borderLeft: '5px solid #3b82f6', overflowX: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>Tagihan Saya & Riwayat</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead><tr style={{ borderBottom: '1px solid #444' }}><th style={{ padding: '12px' }}>Kamar</th><th style={{ padding: '12px' }}>Tanggal</th><th style={{ padding: '12px' }}>Total Tagihan</th><th style={{ padding: '12px' }}>Status</th><th style={{ padding: '12px' }}>Aksi</th></tr></thead>
          <tbody>
            {tagihans.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '12px' }}>Kamar {t.nomor_kamar}</td>
                <td style={{ padding: '12px' }}>{new Date(t.tanggal_booking).toLocaleDateString('id-ID')}</td>
                <td style={{ padding: '12px', color: '#10b981', fontWeight: 'bold' }}>Rp {formatRupiah(t.harga_sewa)}</td>
                <td style={{ padding: '12px' }}>{badgeBayar(t.status_pembayaran)}</td>
                <td style={{ padding: '12px' }}>
                  {t.status_pembayaran === 'Belum Dibayar'
                    ? <button onClick={() => bukaModalBayar(t)} style={{ background: '#3b82f6', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Bayar Sekarang</button>
                    : t.status_pembayaran === 'Menunggu Verifikasi'
                      ? <span style={{ color: '#f59e0b' }}>⏳ Menunggu Admin</span>
                      : <span style={{ color: '#10b981' }}>✓ Lunas</span>}
                </td>
              </tr>
            ))}
            {tagihans.length === 0 && <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>Belum ada tagihan. Silakan booking kamar di bawah.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* KOMPLAIN */}
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <div style={{ ...cardStyle, flex: '1 1 300px', borderLeft: '5px solid #f59e0b' }}>
          <h3 style={{ marginTop: 0 }}>Ajukan Komplain</h3>
          <form onSubmit={handleSubmitKomplain} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <select value={formKomplain.id_transaksi_terpilih} onChange={(e) => setFormKomplain({ ...formKomplain, id_transaksi_terpilih: e.target.value })} style={{ padding: '10px', borderRadius: '6px', background: '#2d2d2d', color: '#fff', border: '1px solid #444' }} required>
              <option value="">-- Pilih Kamar Anda --</option>
              {tagihans.map(t => <option key={t.id} value={t.id}>Kamar {t.nomor_kamar}</option>)}
            </select>
            <select value={formKomplain.kategori} onChange={(e) => setFormKomplain({ ...formKomplain, kategori: e.target.value })} style={{ padding: '10px', borderRadius: '6px', background: '#2d2d2d', color: '#fff', border: '1px solid #444' }}>
              <option value="Fasilitas Rusak">Fasilitas Rusak (AC, Keran, dll)</option><option value="Keamanan">Keamanan / Kenyamanan</option><option value="Lainnya">Lainnya</option>
            </select>
            <textarea placeholder="Jelaskan detail masalahnya..." value={formKomplain.deskripsi} onChange={(e) => setFormKomplain({ ...formKomplain, deskripsi: e.target.value })} required style={{ padding: '10px', borderRadius: '6px', background: '#2d2d2d', color: '#fff', border: '1px solid #444', height: '80px' }}></textarea>
            <button type="submit" style={{ padding: '12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Kirim Komplain</button>
          </form>
        </div>

        <div style={{ ...cardStyle, flex: '2 1 400px', overflowX: 'auto' }}>
          <h3 style={{ marginTop: 0 }}>Status Komplain Saya</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead><tr style={{ borderBottom: '1px solid #444' }}><th style={{ padding: '12px' }}>Kamar & Tanggal</th><th style={{ padding: '12px' }}>Keluhan</th><th style={{ padding: '12px' }}>Status</th></tr></thead>
            <tbody>
              {komplains.map((k) => (
                <tr key={k.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '12px' }}>{k.nomor_kamar}<br /><small style={{ color: '#aaa' }}>{new Date(k.tanggal_dibuat).toLocaleDateString('id-ID')}</small></td>
                  <td style={{ padding: '12px' }}><strong style={{ color: '#f59e0b' }}>{k.kategori}</strong><br /><span style={{ color: '#ccc' }}>{k.deskripsi}</span></td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: k.status === 'Selesai' ? '#10b981' : k.status === 'Diproses' ? '#f59e0b' : '#ef4444', color: '#fff' }}>{k.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KAMAR TERSEDIA */}
      <h2 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>Kamar Tersedia untuk Disewa</h2>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
        {kamarTersedia.map((kamar) => (
          <div key={kamar.id} style={{ ...cardStyle, width: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '15px' }}>
            <div>
              <FotoKamar src={kamar.foto_url} />
              <h2 style={{ margin: '12px 0 6px 0', color: '#10b981' }}>Kamar {kamar.nomor_kamar}</h2>
              {kamar.nama_kos && <p style={{ margin: '2px 0', color: '#fff', fontWeight: 'bold', fontSize: '15px' }}>{kamar.nama_kos}</p>}
              {kamar.alamat_lengkap && <p style={{ margin: '2px 0 10px', color: '#999', fontSize: '13px' }}>📍 {kamar.alamat_lengkap}</p>}
              <p style={{ margin: '5px 0', color: '#ccc' }}><strong>Tipe:</strong> {kamar.tipe_kamar}</p>
              <p style={{ margin: '5px 0', color: '#ccc' }}><strong>Fasilitas:</strong> {kamar.fasilitas}</p>

              {/* Tombol Maps */}
              {kamar.link_maps && (
                <div style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
                  <a href={kamar.link_maps} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#2d2d2d', border: '1px solid #444', borderRadius: '6px', color: '#3b82f6', fontSize: '13px', textDecoration: 'none' }}>📍 Lihat di Maps</a>
                  <button onClick={() => handleCopyMaps(kamar.link_maps, kamar.id)} style={{ padding: '8px 12px', background: '#2d2d2d', border: '1px solid #444', borderRadius: '6px', color: copiedId === kamar.id ? '#10b981' : '#ccc', fontSize: '13px', cursor: 'pointer' }}>{copiedId === kamar.id ? '✓ Tersalin!' : '📋 Copy Link'}</button>
                </div>
              )}
            </div>
            <div>
              <h3 style={{ margin: '15px 0', color: '#fff', fontSize: '24px' }}>Rp {formatRupiah(kamar.harga_sewa)}<small style={{ fontSize: '14px', color: '#aaa' }}>/bln</small></h3>
              <button onClick={() => handleBooking(kamar)} style={{ width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>Booking Kamar Ini</button>
            </div>
          </div>
        ))}
        {kamarTersedia.length === 0 && <p style={{ color: '#777' }}>Belum ada kamar tersedia saat ini.</p>}
      </div>
    </div>
  );
};