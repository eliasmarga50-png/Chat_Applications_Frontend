export const rooms = [
  {
    id: "1",
    name: "javascript",
    description: "JavaScript discussions",
    icon: "JS",
    members: 128,
    unread: 3,
  },
  {
    id: "2",
    name: "react",
    description: "React development",
    icon: "RE",
    members: 96,
    unread: 0,
  },
  {
    id: "3",
    name: "nodejs",
    description: "Node.js and backend",
    icon: "NO",
    members: 74,
    unread: 1,
  },
  {
    id: "4",
    name: "mongodb",
    description: "Database discussions",
    icon: "DB",
    members: 42,
    unread: 0,
  },
];

export const activeRoomId = "2";

export const messages = [
  {
    id: "m1",
    username: "alex",
    displayName: "Alex Morgan",
    initials: "AM",
    content:
      "Hey everyone! What are you currently building with React?",
    time: "09:30",
    isOwn: false,
  },
  {
    id: "m2",
    username: "sarah",
    displayName: "Sarah Johnson",
    initials: "SJ",
    content:
      "I'm working on a developer dashboard using React and Node.js.",
    time: "09:32",
    isOwn: false,
  },
  {
    id: "m3",
    username: "you",
    displayName: "You",
    initials: "YO",
    content:
      "I'm building DevConnect, a real-time developer community chat application!",
    time: "09:34",
    isOwn: true,
  },
  {
    id: "m4",
    username: "alex",
    displayName: "Alex Morgan",
    initials: "AM",
    content:
      "That sounds interesting! Are you using Socket.IO for real-time communication?",
    time: "09:36",
    isOwn: false,
  },
  {
    id: "m5",
    username: "you",
    displayName: "You",
    initials: "YO",
    content:
      "Yes! The backend is already implemented with Socket.IO, MongoDB, Redis and Express.",
    time: "09:38",
    isOwn: true,
  },
];