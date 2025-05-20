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

  // In useChatStore.js
markMessagesAsRead: async (userId) => {
  try {
    await axiosInstance.patch(`/messages/mark-read/${userId}`);
    // Update local state if needed
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
},

hasUnreadMessages: (userId) => {
  return get().messages.some(
    msg => msg.senderId === userId && !msg.read
  );
},

 subscribeToMessages: () => {
  const socket = useAuthStore.getState().socket;
  if (!socket) return;

  socket.off("newMessage"); // prevent duplicates

  socket.on("newMessage", (newMessage) => {
    const { selectedUser, messages, users } = get();
    const isFromCurrentChat = selectedUser && newMessage.senderId === selectedUser._id;

    if (isFromCurrentChat) {
      set({ messages: [...messages, newMessage] });
    } else {
      const senderName = newMessage.senderName || "Unknown";
      toast(`📨 New message from ${sender.fullName}`, {
        duration: 5000,
        position: "bottom-right",
      });

      try {
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.3;
        audio.play().catch((err) => {
          console.warn("Notification sound blocked:", err.message);
        });
      } catch (err) {
        console.error("Error with notification sound:", err);
      }
    }
  });
},
 
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));