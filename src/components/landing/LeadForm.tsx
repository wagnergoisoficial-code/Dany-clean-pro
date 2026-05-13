import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, CheckCircle, ArrowRight } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { cn } from '../../lib/utils';

export default function LeadForm() {
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      const path = 'leads';
      try {
        const docRef = await addDoc(collection(db, path), {
          ...formData,
          status: 'new',
          createdAt: serverTimestamp(),
        });
        return { id: docRef.id };
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: () => {
      setSubmitted(true);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    mutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h3 className="text-3xl font-bold text-slate-900 mb-2">Obrigado!</h3>
        <p className="text-slate-600 mb-8 max-w-xs mx-auto">
          Recebemos sua solicitação. Um especialista em limpeza entrará em contato em até 24 horas.
        </p>
        <button 
          onClick={() => setSubmitted(false)}
          className="text-blue-600 font-bold hover:underline"
        >
          Enviar outra solicitação
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Seu Nome Completo</label>
          <input 
            required
            name="name"
            placeholder="ex: Sarah Silva"
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600/20 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-medium text-slate-900 border"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Número de Telefone</label>
          <input 
            required
            type="tel"
            name="phone"
            placeholder="(475) 341-3699"
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600/20 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-medium text-slate-900 border"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Endereço de E-mail</label>
        <input 
          required
          type="email"
          name="email"
          placeholder="sarah@exemplo.com"
          className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600/20 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-medium text-slate-900 border"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Cidade em Connecticut</label>
          <input 
            required
            name="city"
            placeholder="ex: Stamford"
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600/20 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-medium text-slate-900 border"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Tipo de Serviço</label>
          <select 
            name="service_type"
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600/20 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-medium text-slate-900 border appearance-none"
          >
            <option>Limpeza Residencial Padrão</option>
            <option>Limpeza Profunda (Spring Cleaning)</option>
            <option>Mudança (Move In / Move Out)</option>
            <option>Pós-Obra</option>
            <option>Escritórios e Comercial</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Quartos</label>
          <select name="bedrooms" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600/20 outline-none transition-all font-medium text-slate-900 border appearance-none">
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Quarto{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Banheiros</label>
          <select name="bathrooms" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600/20 outline-none transition-all font-medium text-slate-900 border appearance-none">
            {[1,1.5,2,2.5,3,3.5,4].map(n => <option key={n} value={n}>{n} Banheiro{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      <button 
        type="submit"
        disabled={mutation.isPending}
        className={cn(
          "w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 active:scale-[0.98] mt-4",
          mutation.isPending && "opacity-70 cursor-not-allowed"
        )}
      >
        {mutation.isPending ? "Conectando com Profissional..." : (
          <>Verificar Disponibilidade <ArrowRight size={20} /></>
        )}
      </button>
      
      <p className="text-[10px] text-center text-slate-400 font-medium px-4">
        Ao clicar, você concorda em ser contatado por nossa equipe. Nenhum cartão de crédito é necessário para obter um orçamento.
      </p>
    </form>
  );
}
