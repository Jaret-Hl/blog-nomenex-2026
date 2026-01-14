import { useState } from 'react';
import { sanitizeInput } from '../utils/sanitize';

interface FormData {
  title: string;
  content: string;
  email: string;
}

export default function PostForm() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    email: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedData = {
      title: sanitizeInput.text(formData.title),
      content: sanitizeInput.html(formData.content),
      email: sanitizeInput.email(formData.email)
    };
    
    // Enviar datos sanitizados
    console.log('Datos sanitizados:', sanitizedData);
    // Aquí puedes hacer el POST a tu API
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Título"
      />
      <textarea
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        placeholder="Contenido"
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
      />
      <button type="submit">Enviar</button>
    </form>
  );
}