import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { Mail, MapPin, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: "Contact Us | TheDripMap",
  description: "Have questions about IV therapy or want to list your clinic? Contact the TheDripMap team today.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Get in <span className="text-wellness-600">Touch</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            Have questions about IV therapy or want to list your clinic? We&apos;re here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div className="space-y-12">
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 bg-wellness-50 rounded-2xl flex items-center justify-center text-wellness-600 shrink-0">
                <Mail size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Email Us</h3>
                <p className="text-slate-500 mb-2">For general inquiries and support:</p>
                <a href="mailto:hello@thedripmap.com" className="text-lg font-bold text-wellness-600 hover:underline">hello@thedripmap.com</a>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-14 h-14 bg-wellness-50 rounded-2xl flex items-center justify-center text-wellness-600 shrink-0">
                <MessageSquare size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Clinic Support</h3>
                <p className="text-slate-500 mb-2">For clinic owners and partners:</p>
                <a href="mailto:partners@thedripmap.com" className="text-lg font-bold text-wellness-600 hover:underline">partners@thedripmap.com</a>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-14 h-14 bg-wellness-50 rounded-2xl flex items-center justify-center text-wellness-600 shrink-0">
                <MapPin size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Headquarters</h3>
                <p className="text-slate-500">
                  123 Wellness Way<br />
                  Austin, TX 78701
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Send a Message</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Full Name</label>
                  <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-wellness-600/20 focus:border-wellness-600 transition-all" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</label>
                  <input type="email" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-wellness-600/20 focus:border-wellness-600 transition-all" placeholder="john@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Subject</label>
                <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-wellness-600/20 focus:border-wellness-600 transition-all appearance-none">
                  <option>General Inquiry</option>
                  <option>Clinic Partnership</option>
                  <option>Technical Support</option>
                  <option>Media Inquiry</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Message</label>
                <textarea rows={5} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-wellness-600/20 focus:border-wellness-600 transition-all resize-none" placeholder="How can we help you?"></textarea>
              </div>
              <button type="submit" className="w-full bg-wellness-600 text-white px-8 py-5 rounded-2xl font-bold text-lg hover:bg-wellness-700 transition-all shadow-xl shadow-wellness-100">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
