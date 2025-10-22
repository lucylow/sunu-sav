import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),
      
      // Tontines state
      tontines: [],
      setTontines: (tontines) => set({ tontines }),
      addTontine: (tontine) => 
        set((state) => ({ tontines: [...state.tontines, tontine] })),
      
      // Wallet state
      walletBalance: 0,
      setWalletBalance: (balance) => set({ walletBalance: balance }),
      
      // Payment state
      currentInvoice: null,
      setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),
      
      // API actions
      fetchTontines: async (userId) => {
        try {
          // Simulate API call - replace with actual backend
          const mockTontines = [
            {
              id: '1',
              name: 'Tontine Familiale',
              contributionAmount: 10000,
              currentCycle: 1,
              totalCycles: 12,
              status: 'active',
              members: [
                { id: '1', name: 'Moussa', hasPaid: true },
                { id: '2', name: 'Aminata', hasPaid: true },
                { id: '3', name: 'Ibrahim', hasPaid: false },
              ],
              userHasPaid: false,
              createdAt: new Date().toISOString()
            },
            {
              id: '2',
              name: 'Tontine Travail',
              contributionAmount: 25000,
              currentCycle: 3,
              totalCycles: 8,
              status: 'active',
              members: [
                { id: '4', name: 'Fatou', hasPaid: true },
                { id: '5', name: 'Mamadou', hasPaid: true },
                { id: '6', name: 'Aïcha', hasPaid: true },
                { id: '7', name: 'Ousmane', hasPaid: false },
              ],
              userHasPaid: true,
              createdAt: new Date().toISOString()
            }
          ];
          set({ tontines: mockTontines });
        } catch (error) {
          console.error('Failed to fetch tontines:', error);
        }
      },
      
      createTontine: async (tontineData) => {
        try {
          const newTontine = {
            id: Date.now().toString(),
            ...tontineData,
            status: 'active',
            currentCycle: 1,
            members: [],
            createdAt: new Date().toISOString()
          };
          
          set((state) => ({ 
            tontines: [...state.tontines, newTontine] 
          }));
          
          return newTontine;
        } catch (error) {
          console.error('Failed to create tontine:', error);
          throw error;
        }
      },
      
      joinTontine: async (tontineId, userId) => {
        try {
          const tontines = get().tontines;
          const updatedTontines = tontines.map(tontine => {
            if (tontine.id === tontineId) {
              return {
                ...tontine,
                members: [...tontine.members, { id: userId, name: 'New Member', hasPaid: false }]
              };
            }
            return tontine;
          });
          set({ tontines: updatedTontines });
        } catch (error) {
          console.error('Failed to join tontine:', error);
          throw error;
        }
      },
      
      makePayment: async (tontineId, invoice) => {
        try {
          // Simulate payment processing
          const tontines = get().tontines;
          const updatedTontines = tontines.map(tontine => {
            if (tontine.id === tontineId) {
              return {
                ...tontine,
                userHasPaid: true,
                members: tontine.members.map(member => 
                  member.id === get().user?.id 
                    ? { ...member, hasPaid: true }
                    : member
                )
              };
            }
            return tontine;
          });
          set({ tontines: updatedTontines });
        } catch (error) {
          console.error('Failed to make payment:', error);
          throw error;
        }
      },
      
      // Clear all data (for logout)
      clearStore: () => set({ 
        user: null, 
        tontines: [], 
        walletBalance: 0, 
        currentInvoice: null 
      })
    }),
    {
      name: 'tontine-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
