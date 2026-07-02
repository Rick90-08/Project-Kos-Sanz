import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
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
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const docSnap = await getDoc(doc(db, "pengguna", userCredential.user.uid));
      if (docSnap.exists()) {
        const userData = docSnap.data();
        localStorage.setItem('user', JSON.stringify({ uid: userCredential.user.uid, ...userData }));

        if (userData.role === 'Admin') navigate('/admin');
        else if (userData.role === 'Pemilik') navigate('/pemilik');
        else navigate('/penghuni');
      } else {
        setError('Data akun tidak ditemukan. Hubungi admin.');
      }
    } catch (err) {
      setError('Email atau password salah. Silakan coba lagi.');
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
        <h2 style={{ textAlign: 'center', color: '#3b82f6', marginBottom: '4px', fontSize: '28px' }}>Kos-Sanz</h2>
        <p style={{ textAlign: 'center', color: '#888', marginTop: 0, marginBottom: '30px', fontSize: '14px' }}>Cari kos online jadi lebih mudah</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', background: '#2d2d2d', color: '#fff' }} />
          <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', background: '#2d2d2d', color: '#fff' }} />

          {error && (
            <div style={{ background: '#3a1212', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 12px', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ padding: '12px', background: loading ? '#1e4fa3' : '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#aaa' }}>Belum punya akun? <Link to="/register" style={{ color: '#3b82f6' }}>Daftar di sini</Link></p>
      </div>
    </div>
  );
};
export default Login;