import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const Register = () => {
  const [formData, setFormData] = useState({ nama: '', email: '', password: '', role: 'Penghuni' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await setDoc(doc(db, "pengguna", userCredential.user.uid), {
        nama: formData.nama, email: formData.email, role: formData.role, tgl_registrasi: new Date().toISOString()
      });
      navigate('/login');
    } catch (err) {
      // Pesan error yang lebih ramah daripada kode mentah Firebase
      let pesan = 'Gagal mendaftar. Silakan coba lagi.';
      if (err.code === 'auth/email-already-in-use') pesan = 'Email ini sudah terdaftar. Silakan login.';
      else if (err.code === 'auth/weak-password') pesan = 'Password terlalu lemah (minimal 6 karakter).';
      else if (err.code === 'auth/invalid-email') pesan = 'Format email tidak valid.';
      setError(pesan);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#1e1e1e', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', border: '1px solid #333' }}>

        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '40px' }}>🏠</span>
        </div>
        <h2 style={{ textAlign: 'center', color: '#10b981', marginBottom: '4px', fontSize: '26px' }}>Daftar Akun Kos-Sanz</h2>
        <p style={{ textAlign: 'center', color: '#888', marginTop: 0, marginBottom: '30px', fontSize: '14px' }}>Buat akun untuk mulai mencari atau mengelola kos</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input name="nama" placeholder="Nama Lengkap" value={formData.nama} onChange={handleChange} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', background: '#2d2d2d', color: '#fff' }} />
          <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', background: '#2d2d2d', color: '#fff' }} />
          <input name="password" type="password" placeholder="Password (min. 6 karakter)" value={formData.password} onChange={handleChange} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', background: '#2d2d2d', color: '#fff' }} />
          <select name="role" value={formData.role} onChange={handleChange} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', background: '#2d2d2d', color: '#fff' }}>
            <option value="Penghuni">Penghuni (Pencari Kos)</option>
            <option value="Pemilik">Pemilik Kos</option>
            <option value="Admin">Admin Sistem</option>
          </select>

          {error && (
            <div style={{ background: '#3a1212', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 12px', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ padding: '12px', background: loading ? '#0a7a5a' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
            {loading ? 'Memproses...' : 'Buat Akun'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#aaa' }}>Sudah punya akun? <Link to="/login" style={{ color: '#10b981' }}>Login di sini</Link></p>
      </div>
    </div>
  );
};
export default Register;