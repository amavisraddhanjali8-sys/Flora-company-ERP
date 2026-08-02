import React, { useState } from 'react';
import { X, Search, UserPlus, User } from 'lucide-react';
import { Client } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface ClientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSelect: (client: Client) => void;
  onAddClient: (client: Client) => void;
}

export default function ClientSelectionModal({ 
  isOpen, 
  onClose, 
  clients, 
  onSelect,
  onAddClient 
}: ClientSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const handleAdd = () => {
    const newClient = { ...formData, id: Date.now().toString() };
    onAddClient(newClient);
    onSelect(newClient);
    setIsAdding(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            {isAdding ? 'Add New Client' : 'Select Client'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {isAdding ? (
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
              <input 
                autoFocus
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Phone</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Address</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all"
              >
                Back
              </button>
              <button 
                onClick={handleAdd}
                disabled={!formData.name}
                className="flex-[2] py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                Create & Select
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 text-primary transition-colors mb-2 border border-dashed border-primary/20"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold">Add New Client</p>
                  <p className="text-[10px] opacity-70">Create a new customer profile</p>
                </div>
              </button>

              <div className="space-y-1">
                {filteredClients.map(client => (
                  <button
                    key={client.id}
                    disabled={client.isBlacklisted}
                    onClick={() => {
                      if (client.isBlacklisted) return;
                      onSelect(client);
                      onClose();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left group",
                      client.isBlacklisted ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:bg-gray-50"
                    )}
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <User size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-gray-900">{client.name}</p>
                        {client.isBlacklisted && (
                          <span className="text-[7px] font-black bg-red-100 text-red-600 px-1 rounded uppercase tracking-widest">BLACKLISTED</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500">{client.phone || client.email}</p>
                    </div>
                    {client.isBlacklisted && (
                      <div className="text-[8px] font-bold text-red-500 italic">Cannot select blacklisted client</div>
                    )}
                  </button>
                ))}
                {filteredClients.length === 0 && (
                  <div className="py-12 text-center text-gray-400 italic text-xs">
                    No clients found matching your search.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
