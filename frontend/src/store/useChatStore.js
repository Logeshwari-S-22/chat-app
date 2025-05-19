import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      console.log("Users API response:", res.data); // <--- check this
      set({ users: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching users");
    } finally {
      set({ isUsersLoading: false });
    }
  },
  

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToGlobalMessages: () => {
  const socket = useAuthStore.getState().socket;

  if (!socket) return;

  // First remove old listener to prevent duplicates
  socket.off("newMessage");

  socket.on("newMessage", (message) => {
    const selectedUser = get().selectedUser;

    const isFromCurrentChat = selectedUser && selectedUser._id === message.senderId;

    console.log("📥 Received newMessage:", message);
    console.log("🔄 Is from current chat?", isFromCurrentChat);

    if (isFromCurrentChat) {
      // Update message list if chatting with sender
      set({
        messages: [...get().messages, message],
      });
    } else {
      // 🔔 Show toast and play sound if from another user
      toast(`📨 New message from ${message.senderName || "Someone"}`);

      const audio = new Audio("/notification.mp3");
      audio.play().catch((err) => console.warn("Sound play failed:", err));
    }
  });
},

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));